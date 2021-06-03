import * as vue from 'vue';
import * as pubsub from '../../../../../pubsub';
import * as util from '../../../../../util';
import type {
  ApiPlatform,
  ApiResponse,
  ApiSuccess,
  DateTimeString
} from '../base';
import {
  ApiStatusCode,
  lazyFetchUserIdSet,
  lazyFetchWorldIdSet,
  notFoundUserIdSet
} from '../base';
import {api, ApiRequestMethod, applyObject} from '../internal';
import type {LocationInfo} from '../location';
import {parseLocation, ReservedLocation} from '../location';
import {fetchOfflineFriendList, fetchOnlineFriendList, loginUser} from './auth';
import type {ApiWorld, Instance, World} from './world';
import {applyWorld, worldMap} from './world';

export const enum ApiUserDeveloperType {
  None = 'none',
  Trusted = 'trusted',
  Internal = 'internal',
  Moderator = 'moderator'
}

export const enum ApiUserStatus {
  Offline = 'offline',
  Online = 'active',
  JoinMe = 'join me',
  AskMe = 'ask me',
  DoNotDisturb = 'busy'
}

export const enum ApiUserState {
  Offline = 'offline',
  Active = 'active',
  Online = 'online'
}

export interface ApiUser {
  id?: string;
  username?: string;
  displayName?: string;
  userIcon?: string;
  bio?: string;
  bioLinks?: string[];
  profilePicOverride?: string;
  currentAvatarImageUrl?: string;
  currentAvatarThumbnailImageUrl?: string;
  fallbackAvatar?: string;
  status?: ApiUserStatus;
  statusDescription?: string;
  state?: ApiUserState;
  tags?: string[];
  developerType?: ApiUserDeveloperType;
  last_login?: DateTimeString;
  // "2019.2.2-772-Release"
  last_platform?: ApiPlatform;
  allowAvatarCopying?: boolean;
  /** YYYY-MM-DD */
  date_joined?: string;
  isFriend?: boolean;
  friendKey?: string;
  worldId?: string;
  instanceId?: string;
  location?: string;
}

export interface ApiFriendStatus {
  isFriend?: boolean;
  outgoingRequest?: boolean;
  incomingRequest?: boolean;
}

export const enum UserState {
  Offline = 'offline',
  Active = 'active',
  Online = 'online',
  Private = 'private'
}

export const enum UserStatus {
  Offline = 'offline',
  Active = 'active',
  Online = 'online',
  JoinMe = 'join-me',
  AskMe = 'ask-me',
  DoNotDisturb = 'do-not-disturb'
}

export const enum UserTrustLevel {
  Visitor = 'visitor',
  New = 'new',
  User = 'user',
  Known = 'known',
  Trusted = 'trusted',
  Veteran = 'veteran',
  Troll = 'troll',
  Moderator = 'moderator'
}

export interface User {
  id: string;
  apiUser: ApiUser;
  locationInfo: LocationInfo;
  activityTime: number;
  locationTime: number;
  state: UserState;
  status: UserStatus;
  trustLevel: UserTrustLevel;
  trustLevelText: string;
  outgoingFriendRequest: boolean;
  incomingFriendRequest: boolean;
}

export let userMap = vue.reactive(new Map<string, User>());
export let onlineFriendSet = vue.reactive(new Set<User>());
export let privateFriendSet = vue.reactive(new Set<User>());
export let activeFriendSet = vue.reactive(new Set<User>());
export let offlineFriendSet = vue.reactive(new Set<User>());

pubsub.subscribe('api:login', () => {
  userMap.clear();
  onlineFriendSet.clear();
  privateFriendSet.clear();
  activeFriendSet.clear();
  offlineFriendSet.clear();
});

export function applyUserState(user: User): void {
  let {apiUser} = user;
  let state = UserState.Offline;
  let status = UserStatus.Offline;

  if (apiUser.state !== ApiUserState.Offline) {
    let {locationInfo} = user;

    if (locationInfo.isOffline === true) {
      state = UserState.Active;
      status = UserStatus.Active;
    } else {
      if (locationInfo.isPrivate === true) {
        state = UserState.Private;
      } else {
        state = UserState.Online;
      }

      switch (apiUser.status) {
        case ApiUserStatus.Online:
          status = UserStatus.Online;
          break;

        case ApiUserStatus.JoinMe:
          status = UserStatus.JoinMe;
          break;

        case ApiUserStatus.AskMe:
          status = UserStatus.AskMe;
          break;

        case ApiUserStatus.DoNotDisturb:
          status = UserStatus.DoNotDisturb;
          break;
      }
    }
  }

  user.state = state;
  user.status = status;

  if (apiUser.isFriend === true) {
    switch (state) {
      case UserState.Online:
        privateFriendSet.delete(user);
        activeFriendSet.delete(user);
        offlineFriendSet.delete(user);
        onlineFriendSet.add(user);
        break;

      case UserState.Private:
        onlineFriendSet.delete(user);
        activeFriendSet.delete(user);
        offlineFriendSet.delete(user);
        privateFriendSet.add(user);
        break;

      case UserState.Active:
        onlineFriendSet.delete(user);
        privateFriendSet.delete(user);
        offlineFriendSet.delete(user);
        activeFriendSet.add(user);
        break;

      case UserState.Offline:
        onlineFriendSet.delete(user);
        privateFriendSet.delete(user);
        activeFriendSet.delete(user);
        offlineFriendSet.add(user);
        break;
    }
  } else {
    onlineFriendSet.delete(user);
    privateFriendSet.delete(user);
    activeFriendSet.delete(user);
    offlineFriendSet.delete(user);
  }
}

export function applyUserTag(user: User, tags: string[]): void {
  let tagSet = new Set(tags);

  // TODO:
  // system_early_adopter
  // system_supporter

  let level = UserTrustLevel.Visitor;
  let text = 'Visitor';

  if (tagSet.has('admin_moderator') === true) {
    // TODO: developerType
    level = UserTrustLevel.Moderator;
    text = 'VRChat Team';
  } else if (
    tagSet.has('system_troll') === true ||
    tagSet.has('system_probable_troll') === true
  ) {
    level = UserTrustLevel.Troll;
    text = 'Nuisance User';
  } else if (tagSet.has('system_trust_legend') === true) {
    level = UserTrustLevel.Veteran;
    text = 'Veteran User';
  } else if (tagSet.has('system_trust_veteran') === true) {
    level = UserTrustLevel.Trusted;
    text = 'Trusted User';
  } else if (tagSet.has('system_trust_trusted') === true) {
    level = UserTrustLevel.Known;
    text = 'Known User';
  } else if (tagSet.has('system_trust_known') === true) {
    level = UserTrustLevel.User;
    text = 'User';
  } else if (tagSet.has('system_trust_basic') === true) {
    level = UserTrustLevel.New;
    text = 'New User';
  }

  user.trustLevel = level;
  user.trustLevelText = text;
}

export function applyUserLocation(
  user: User,
  location: string,
  prevLocation: string | undefined
): void {
  if (location === prevLocation) {
    return;
  }

  let {last_login, isFriend} = user.apiUser;

  if (prevLocation !== void 0) {
    let locationInfo = parseLocation(prevLocation);
    let {worldId} = locationInfo;
    if (worldId !== void 0) {
      let world = worldMap.get(worldId);
      if (world !== void 0) {
        let instance = world.instances.get(prevLocation);
        if (instance !== void 0) {
          instance.users.delete(user);
          if (instance.users.size === 0) {
            world.instances.delete(prevLocation);
          }
        }
      }
    }
  }

  let locationInfo = parseLocation(location);
  user.locationInfo = locationInfo;
  user.locationTime = isFriend === true ? Date.now() : 0;

  let {worldId} = locationInfo;
  if (worldId !== void 0) {
    let world = worldMap.get(worldId);
    if (world === void 0) {
      lazyFetchWorldIdSet.add(worldId);
      world = applyWorld({
        id: worldId
      })!;
    }

    let instance = world.instances.get(location);
    if (instance === void 0) {
      instance = vue.reactive<Instance>({
        id: location,
        users: new Set()
      });
      world.instances.set(location, instance);
    }

    instance.users.add(user);
  }

  if (isFriend === false) {
    user.activityTime = 0;
  } else if (user.activityTime === 0) {
    if (typeof last_login === 'string' && last_login !== '') {
      user.activityTime = new Date(last_login).getTime();
    }
  } else {
    user.activityTime = Date.now();
  }
}

export function applyUser(apiUser: ApiUser): void {
  let {id} = apiUser;
  if (id === void 0) {
    return;
  }

  let user = userMap.get(id);
  if (user === void 0) {
    user = vue.reactive<User>({
      id,
      apiUser: {},
      locationInfo: parseLocation(ReservedLocation.Offline),
      activityTime: 0,
      locationTime: 0,
      state: UserState.Offline,
      status: UserStatus.Offline,
      trustLevel: UserTrustLevel.Visitor,
      trustLevelText: '',
      outgoingFriendRequest: false,
      incomingFriendRequest: false
    });
    userMap.set(id, user);
  }

  let changes = applyObject(user.apiUser, apiUser);
  if (changes.length !== 0) {
    // console.log('applyUser', id, changes);

    let bye = false;

    for (let [key, value, oldValue] of changes) {
      switch (key) {
        case 'isFriend':
          if (value === false) {
            bye = true;
          }
          break;

        case 'location':
          applyUserLocation(user, value, oldValue);
          break;

        case 'tags':
          applyUserTag(user, value);
          break;
      }
    }

    if (bye === true) {
      let prevLocation = apiUser.location;
      apiUser.location = ReservedLocation.Offline;
      applyUserLocation(user, ReservedLocation.Offline, prevLocation);
    }

    applyUserState(user);
  }
}

export async function fetchUser(userId: string): Promise<ApiResponse<ApiUser>> {
  let response = await api<ApiUser>({
    method: ApiRequestMethod.GET,
    path: `users/${userId}`
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK) {
    if (data !== void 0) {
      notFoundUserIdSet.delete(userId);
      applyUser(data);
    }
  } else if (status === ApiStatusCode.NotFound) {
    notFoundUserIdSet.add(userId);
  }

  return response;
}

export async function fetchUserList(
  search: string,
  n: number,
  offset: number
): Promise<ApiResponse<ApiUser[]>> {
  let response = await api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: 'users',
    query: {
      search,
      n,
      offset
    }
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (let apiUser of data) {
      let {id} = apiUser;
      if (id === void 0) {
        continue;
      }

      notFoundUserIdSet.delete(id);

      applyUser(apiUser);
    }
  }

  return response;
}

export async function sendFriendRequest(
  userId: string
): Promise<ApiResponse<ApiSuccess>> {
  let response = await api<ApiSuccess>({
    method: ApiRequestMethod.POST,
    path: `user/${userId}/friendRequest`,
    body: {
      userId
    }
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    fetchFriendStatus(userId).catch(util.nop);
  }

  return response;
}

export async function cancelFriendRequest(
  userId: string
): Promise<ApiResponse<ApiSuccess>> {
  let response = await api<ApiSuccess>({
    method: ApiRequestMethod.DELETE,
    path: `user/${userId}/friendRequest`,
    body: {
      userId
    }
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    fetchFriendStatus(userId).catch(util.nop);
  }

  return response;
}

export async function fetchFriendStatus(
  userId: string
): Promise<ApiResponse<ApiFriendStatus>> {
  let response = await api<ApiFriendStatus>({
    method: ApiRequestMethod.GET,
    path: `user/${userId}/friendStatus`
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    let user = userMap.get(userId);
    if (user !== void 0) {
      let {outgoingRequest, incomingRequest} = data;

      if (outgoingRequest !== void 0) {
        user.outgoingFriendRequest = outgoingRequest;
      }

      if (incomingRequest !== void 0) {
        user.incomingFriendRequest = incomingRequest;
      }
    }
  }

  return response;
}

export async function syncFriendInternal(): Promise<boolean> {
  // 503, 'endpoint temporarily disabled'

  let {friends} = loginUser.apiLoginUser;
  if (friends === void 0) {
    return false;
  }

  let missingFriendIdSet = new Set(friends);

  for (let offset = 0; missingFriendIdSet.size !== 0; offset += 50) {
    let {status, data} = await fetchOnlineFriendList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    if (data.length === 0) {
      break;
    }

    for (let apiUser of data) {
      let {id} = apiUser;
      if (id === void 0) {
        continue;
      }

      missingFriendIdSet.delete(id);

      if (
        apiUser.location === '' ||
        apiUser.location === ReservedLocation.Offline
      ) {
        apiUser.state = ApiUserState.Active;
      } else {
        apiUser.state = ApiUserState.Online;
      }

      applyUser(apiUser);
    }
  }

  for (let offset = 0; missingFriendIdSet.size !== 0; offset += 50) {
    let {status, data} = await fetchOfflineFriendList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    if (data.length === 0) {
      break;
    }

    for (let apiUser of data) {
      let {id} = apiUser;
      if (id === void 0) {
        continue;
      }

      missingFriendIdSet.delete(id);

      // always offline
      delete apiUser.status;

      // always empty
      delete apiUser.statusDescription;

      apiUser.state = ApiUserState.Offline;

      applyUser(apiUser);
    }
  }

  for (let userId of missingFriendIdSet) {
    let user = userMap.get(userId);
    if (user === void 0) {
      applyUser({
        id: userId,
        isFriend: true,
        state: ApiUserState.Offline
      });
    }

    lazyFetchUserIdSet.add(userId);
  }

  for (let userId of friends) {
    lazyFetchUserIdSet.add(userId);
  }

  return true;
}
