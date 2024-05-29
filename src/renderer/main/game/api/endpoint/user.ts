import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import * as util from "../../../../../common/util";
import type { ApiPlatform, ApiSuccess, DateTimeString } from "../base";
import {
  ApiStatusCode,
  lazyFetchUserIdSet,
  lazyFetchWorldIdSet,
  notFoundUserIdSet,
} from "../base";
import { api, ApiRequestMethod, applyObject } from "../internal";
import type { LocationInfo } from "../location";
import { parseLocation, ReservedLocation } from "../location";
import {
  fetchOfflineFriendList,
  fetchOnlineFriendList,
  loginUser,
} from "./auth";
import type { Instance } from "./world";
import { applyWorld, worldMap } from "./world";

export const enum ApiUserDeveloperType {
  None = "none",
  Trusted = "trusted",
  Internal = "internal",
  Moderator = "moderator",
}

export const enum ApiUserStatus {
  Offline = "offline",
  Online = "active",
  JoinMe = "join me",
  AskMe = "ask me",
  DoNotDisturb = "busy",
}

export const enum ApiUserState {
  Offline = "offline",
  Active = "active",
  Online = "online",
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
  last_activity?: DateTimeString;
  worldId?: string;
  instanceId?: string;
  location?: string;
  travelingToWorld?: string;
  travelingToInstance?: string;
  travelingToLocation?: string;
  // "completed"
  friendRequestStatus?: string;
  note?: string;
  //
  // /users/usr_*
  // id: string;
  // username: string;
  // displayName: string;
  // userIcon: string;
  // bio: string;
  // bioLinks: string[];
  // profilePicOverride: string;
  // statusDescription: string;
  // currentAvatarImageUrl: string;
  // currentAvatarThumbnailImageUrl: string;
  // state: string;
  // tags: string[];
  // developerType: string;
  // last_login: string;
  // last_platform: string;
  // allowAvatarCopying: boolean;
  // status: string;
  // date_joined: string;
  // isFriend: boolean;
  // friendKey: string;
  // last_activity: string;
  // worldId: string;
  // instanceId: string;
  // location: string;
  // travelingToWorld: string;
  // travelingToInstance: string;
  // travelingToLocation: string;
  // friendRequestStatus: string;
  // note: string;
  //
  // /users/me
  // id: string;
  // username: string;
  // displayName: string;
  // userIcon: string;
  // bio: string;
  // bioLinks: string[];
  // profilePicOverride: string;
  // statusDescription: string;
  // pastDisplayNames: {
  //   displayName: string;
  //   updated_at: string;
  // }[];
  // hasEmail: true;
  // hasPendingEmail: false;
  // obfuscatedEmail: string;
  // obfuscatedPendingEmail: string;
  // emailVerified: boolean;
  // hasBirthday: boolean;
  // unsubscribe: boolean;
  // statusHistory: string[];
  // statusFirstTime: false;
  // friends: string[];
  // friendGroupNames: string[];
  // currentAvatarImageUrl: string;
  // currentAvatarThumbnailImageUrl: string;
  // currentAvatar: string;
  // currentAvatarAssetUrl: string;
  // fallbackAvatar: string;
  // accountDeletionDate: string | null;
  // accountDeletionLog: string | null;
  // acceptedTOSVersion: number;
  // steamId: string;
  // steamDetails: Record<string, unknown>;
  // oculusId: string;
  // hasLoggedInFromClient: boolean;
  // homeLocation: string;
  // twoFactorAuthEnabled: boolean;
  // twoFactorAuthEnabledDate: string;
  // state: string;
  // tags: string[];
  // developerType: string;
  // last_login: string;
  // last_platform: string;
  // allowAvatarCopying: boolean;
  // status: string;
  // date_joined: string;
  // isFriend: boolean;
  // friendKey: string;
  // last_activity: string;
  // worldId: string;
  // instanceId: string;
  // location: string;
  // travelingToWorld: string;
  // travelingToInstance: string;
  // travelingToLocation: string;
  // friendRequestStatus: string;
  // note: string;
  //
  // auth/user
  // id: string;
  // username: string;
  // displayName: string;
  // userIcon: string;
  // bio: string;
  // bioLinks: string[];
  // profilePicOverride: string;
  // statusDescription: string;
  // pastDisplayNames: {
  //   displayName: string;
  //   updated_at: string;
  // }[];
  // hasEmail: true;
  // hasPendingEmail: false;
  // obfuscatedEmail: string;
  // obfuscatedPendingEmail: string;
  // emailVerified: boolean;
  // hasBirthday: boolean;
  // unsubscribe: boolean;
  // statusHistory: string[];
  // statusFirstTime: false;
  // friends: string[];
  // friendGroupNames: string[];
  // currentAvatarImageUrl: string;
  // currentAvatarThumbnailImageUrl: string;
  // currentAvatar: string;
  // currentAvatarAssetUrl: string;
  // fallbackAvatar: string;
  // accountDeletionDate: string | null;
  // accountDeletionLog: string | null;
  // acceptedTOSVersion: number;
  // steamId: string;
  // steamDetails: Record<string, unknown>;
  // oculusId: string;
  // hasLoggedInFromClient: boolean;
  // homeLocation: string;
  // twoFactorAuthEnabled: boolean;
  // twoFactorAuthEnabledDate: string;
  // state: string;
  // tags: string[];
  // developerType: string;
  // last_login: string;
  // last_platform: string;
  // allowAvatarCopying: boolean;
  // status: string;
  // date_joined: string;
  // isFriend: boolean;
  // friendKey: string;
  // last_activity: string;
  // onlineFriends: string[];
  // activeFriends: string[];
  // offlineFriends: string[];
  //
  // /auth/user/friends
  // id: string;
  // username: string;
  // displayName: string;
  // bio: string;
  // bioLinks: string[];
  // currentAvatarImageUrl: string;
  // currentAvatarThumbnailImageUrl: string;
  // fallbackAvatar: string;
  // userIcon: string;
  // profilePicOverride: string;
  // last_platform: string;
  // tags: string[];
  // developerType: string;
  // status: string;
  // statusDescription: string;
  // friendKey: string;
  // last_login: string;
  // isFriend: boolean;
  // location: string;
  // travelingToLocation: string;
}

export interface ApiFriendStatus {
  isFriend?: boolean;
  outgoingRequest?: boolean;
  incomingRequest?: boolean;
}

export interface ApiUserNote {
  id: string;
  userId: string;
  targetUserId: string;
  note: string;
  createdAt: string;
}

export const enum UserState {
  Offline = "offline",
  Active = "active",
  Online = "online",
  Private = "private",
}

export const enum UserStatus {
  Offline = "offline",
  Active = "active",
  Online = "online",
  JoinMe = "join-me",
  AskMe = "ask-me",
  DoNotDisturb = "do-not-disturb",
}

export const enum UserTrustLevel {
  Visitor = "visitor",
  New = "new",
  User = "user",
  Known = "known",
  Trusted = "trusted",
  Troll = "troll",
  Moderator = "moderator",
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

export const userMap = vue.reactive(new Map<string, User>());
export const onlineFriendSet = vue.reactive(new Set<User>());
export const privateFriendSet = vue.reactive(new Set<User>());
export const activeFriendSet = vue.reactive(new Set<User>());
export const offlineFriendSet = vue.reactive(new Set<User>());

pubsub.subscribe("api:login", () => {
  userMap.clear();
  onlineFriendSet.clear();
  privateFriendSet.clear();
  activeFriendSet.clear();
  offlineFriendSet.clear();
});

export function applyUserState(user: User) {
  const { apiUser } = user;
  let state = UserState.Offline;
  let status = UserStatus.Offline;

  if (apiUser.state !== ApiUserState.Offline) {
    const { locationInfo } = user;

    if (locationInfo.isOffline) {
      state = UserState.Active;
      status = UserStatus.Active;
    } else {
      if (locationInfo.isPrivate) {
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

  if (apiUser.isFriend) {
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

export function applyUserTag(user: User, tags: string[]) {
  const tagSet = new Set(tags);

  // TODO:
  // system_early_adopter
  // system_supporter

  let level = UserTrustLevel.Visitor;
  let text = "Visitor";

  if (tagSet.has("admin_moderator")) {
    // TODO: developerType
    level = UserTrustLevel.Moderator;
    text = "VRChat Team";
  } else if (
    tagSet.has("system_troll") ||
    tagSet.has("system_probable_troll")
  ) {
    level = UserTrustLevel.Troll;
    text = "Nuisance User";
  } else if (tagSet.has("system_trust_veteran")) {
    level = UserTrustLevel.Trusted;
    text = "Trusted User";
  } else if (tagSet.has("system_trust_trusted")) {
    level = UserTrustLevel.Known;
    text = "Known User";
  } else if (tagSet.has("system_trust_known")) {
    level = UserTrustLevel.User;
    text = "User";
  } else if (tagSet.has("system_trust_basic")) {
    level = UserTrustLevel.New;
    text = "New User";
  }

  user.trustLevel = level;
  user.trustLevelText = text;
}

export function applyUserLocation(
  user: User,
  location: string,
  prevLocation: string | undefined
) {
  if (location === prevLocation) {
    return;
  }

  const { last_login, isFriend } = user.apiUser;

  if (prevLocation !== void 0) {
    const locationInfo = parseLocation(prevLocation);
    const { worldId } = locationInfo;
    if (worldId !== void 0) {
      const world = worldMap.get(worldId);
      if (world !== void 0) {
        const instance = world.instances.get(prevLocation);
        if (instance !== void 0) {
          instance.users.delete(user);
          if (instance.users.size === 0) {
            world.instances.delete(prevLocation);
          }
        }
      }
    }
  }

  const locationInfo = parseLocation(location);
  user.locationInfo = locationInfo;
  user.locationTime = isFriend ? Date.now() : 0;

  const { worldId } = locationInfo;
  if (worldId !== void 0) {
    let world = worldMap.get(worldId);
    if (world === void 0) {
      lazyFetchWorldIdSet.add(worldId);
      world = applyWorld({
        id: worldId,
      });
      if (world === void 0) {
        return;
      }
    }

    let instance = world.instances.get(location);
    if (instance === void 0) {
      instance = vue.reactive<Instance>({
        id: location,
        users: new Set(),
      });
      world.instances.set(location, instance);
    }

    instance.users.add(user);
  }

  if (!isFriend) {
    user.activityTime = 0;
  } else if (user.activityTime === 0) {
    if (typeof last_login === "string" && last_login !== "") {
      user.activityTime = new Date(last_login).getTime();
    }
  } else {
    user.activityTime = Date.now();
  }
}

export function applyUser(apiUser: ApiUser) {
  const { id } = apiUser;
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
      trustLevelText: "",
      outgoingFriendRequest: false,
      incomingFriendRequest: false,
    });
    userMap.set(id, user);
  }

  const changes = applyObject(user.apiUser, apiUser);
  if (changes.length !== 0) {
    // console.log('applyUser', id, changes);

    let bye = false;

    for (const [key, value, oldValue] of changes) {
      switch (key) {
        case "isFriend":
          if (value === false) {
            bye = true;
          }
          break;

        case "location":
          applyUserLocation(
            user,
            value as string,
            oldValue as string | undefined
          );
          break;

        case "tags":
          applyUserTag(user, value as string[]);
          break;
      }
    }

    if (bye) {
      const prevLocation = apiUser.location;
      apiUser.location = ReservedLocation.Offline;
      applyUserLocation(user, ReservedLocation.Offline, prevLocation);
    }

    applyUserState(user);
  }
}

export async function fetchUser(userId: string) {
  const response = await api<ApiUser>({
    method: ApiRequestMethod.GET,
    path: `users/${userId}`,
  });

  const { status, data } = response;
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

export async function fetchUserList(search: string, n: number, offset: number) {
  const response = await api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: "users",
    query: {
      search,
      n,
      offset,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (const apiUser of data) {
      const { id } = apiUser;
      if (id === void 0) {
        continue;
      }

      notFoundUserIdSet.delete(id);

      applyUser(apiUser);
    }
  }

  return response;
}

export async function sendFriendRequest(userId: string) {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.POST,
    path: `user/${userId}/friendRequest`,
    body: {
      userId,
    },
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    fetchFriendStatus(userId).catch(util.nop);
  }

  return response;
}

export async function cancelFriendRequest(userId: string) {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.DELETE,
    path: `user/${userId}/friendRequest`,
    body: {
      userId,
    },
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    fetchFriendStatus(userId).catch(util.nop);
  }

  return response;
}

export async function fetchFriendStatus(userId: string) {
  const response = await api<ApiFriendStatus>({
    method: ApiRequestMethod.GET,
    path: `user/${userId}/friendStatus`,
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    const user = userMap.get(userId);
    if (user !== void 0) {
      const { outgoingRequest, incomingRequest } = data;

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

export async function saveUserNote(targetUserId: string, note: string) {
  const response = await api<ApiUserNote>({
    method: ApiRequestMethod.POST,
    path: "userNotes",
    body: {
      targetUserId,
      note,
    },
    any: true,
  });

  // "User note cleared." or object

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    fetchUser(targetUserId).catch(util.nop);
  }

  return response;
}

export async function syncFriendInternal() {
  // 503, 'endpoint temporarily disabled'

  const { friends } = loginUser.apiLoginUser;
  if (friends === void 0) {
    return false;
  }

  const missingFriendIdSet = new Set(friends);

  for (let offset = 0; missingFriendIdSet.size !== 0; offset += 50) {
    const { status, data } = await fetchOnlineFriendList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    if (data.length === 0) {
      break;
    }

    for (const apiUser of data) {
      const { id } = apiUser;
      if (id === void 0) {
        continue;
      }

      missingFriendIdSet.delete(id);

      if (
        apiUser.location === "" ||
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
    const { status, data } = await fetchOfflineFriendList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    if (data.length === 0) {
      break;
    }

    for (const apiUser of data) {
      const { id } = apiUser;
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

  for (const userId of missingFriendIdSet) {
    const user = userMap.get(userId);
    if (user === void 0) {
      applyUser({
        id: userId,
        isFriend: true,
        state: ApiUserState.Offline,
      });
    }

    lazyFetchUserIdSet.add(userId);
  }

  for (const userId of friends) {
    lazyFetchUserIdSet.add(userId);
  }

  return true;
}
