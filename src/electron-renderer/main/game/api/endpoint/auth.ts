import * as vue from 'vue';
import * as util from '../../../../../util';
import * as pubsub from '../../../../../pubsub';
import type {
  ApiPlatform,
  ApiResponse,
  ApiSuccess,
  DateTimeString
} from '../base';
import {ApiStatusCode, isLoggedIn, lazyFetchUserIdSet} from '../base';
import {api, applyObject, ApiRequestMethod} from '../internal';
import type {
  ApiUser,
  ApiUserDeveloperType,
  ApiUserState,
  ApiUserStatus
} from './user';

export interface ApiAuth {
  ok?: boolean;
  token?: string;
}

export interface ApiLoginUser {
  id?: string;
  username?: string;
  displayName?: string;
  userIcon?: string;
  bio?: string;
  bioLinks?: string[];
  profilePicOverride?: string;
  pastDisplayNames?: {
    displayName: string;
    updated_at: DateTimeString;
  }[];
  hasEmail?: boolean;
  hasPendingEmail?: boolean;
  obfuscatedEmail?: string;
  obfuscatedPendingEmail?: string;
  emailVerified?: boolean;
  hasBirthday?: boolean;
  unsubscribe?: boolean;
  statusHistory?: string[];
  statusFirstTime?: boolean;
  friends?: string[];
  friendGroupNames?: string[];
  currentAvatarImageUrl?: string;
  currentAvatarThumbnailImageUrl?: string;
  fallbackAvatar?: string;
  currentAvatar?: string;
  currentAvatarAssetUrl?: string;
  accountDeletionDate?: string | null;
  acceptedTOSVersion?: number;
  steamId?: string;
  steamDetails?: object;
  oculusId?: string;
  hasLoggedInFromClient?: boolean;
  homeLocation?: string;
  twoFactorAuthEnabled?: boolean;
  status?: ApiUserStatus;
  statusDescription?: string;
  state?: ApiUserState;
  tags?: string[];
  developerType?: ApiUserDeveloperType;
  last_login?: DateTimeString;
  last_platform?: ApiPlatform;
  allowAvatarCopying?: boolean;
  date_joined?: string;
  isFriend?: boolean;
  friendKey?: string;
  /** @deprecated */
  onlineFriends?: string[];
  /** @deprecated */
  activeFriends?: string[];
  /** @deprecated */
  offlineFriends?: string[];
  /** 2FA */
  requiresTwoFactorAuth?: ApiTwoFactorAuthType[];
}

export interface LoginUser {
  id: string;
  apiLoginUser: ApiLoginUser;
}

export const enum ApiTwoFactorAuthType {
  TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION = 'totp',
  ONE_TIME_PASSWORD_AUTHENTICATION = 'otp',
  SMS_AUTHENTICATION = 'sms'
}

export interface ApiTwoFactorAuth {
  verified?: boolean;
}

export const enum ApiPermissionName {
  EarlyAdopterTags = 'permission-early-adopter-tags',
  ExtraFavoritesAvatarGroups = 'permission-extra-favorites-avatar-groups',
  InvitePhotos = 'permission-invite-photos',
  ProfilePicOverride = 'permission-profile-pic-override',
  SupporterTags = 'permission-supporter-tags',
  TrustBoost = 'permission-trust-boost',
  UserGallery = 'permission-user-gallery',
  UserIcons = 'permission-user-icons'
}

export interface ApiPermission {
  id?: string;
  ownerId?: string;
  name?: ApiPermissionName;
  data?: {
    tags?: string[];
    maxFavoritePerGroup?: {
      [key: string]: number;
    };
    maxFavoriteGroups?: {
      [key: string]: number;
    };
  };
}

export interface ApiSubscription {
  // 'vrchatplus-yearly'
  id?: string;
  transactionId?: string;
  // 'Steam'
  store?: string;
  steamItemId?: string;
  amount?: number;
  // 'VRChat Plus (Yearly)'
  description?: string;
  // 'year'
  period?: string;
  tier?: number;
  active?: boolean;
  // 'active'
  status?: string;
  expires?: DateTimeString;
  created_at?: DateTimeString;
  updated_at?: DateTimeString;
  licenseGroups?: string[];
}

export let loginUser = vue.reactive<LoginUser>({
  id: '',
  apiLoginUser: {}
});

export let permissionMap = vue.reactive(new Map<string, ApiPermission>());

pubsub.subscribe('api:login', () => {
  permissionMap.clear();
});

function applyLoginUser({
  status,
  data: apiLoginUser
}: ApiResponse<ApiLoginUser>): void {
  if (status === ApiStatusCode.Unauthorized) {
    loginUser.id = '';
    loginUser.apiLoginUser = {};
    isLoggedIn.value = false;
    return;
  }

  if (status !== ApiStatusCode.OK || apiLoginUser === void 0) {
    return;
  }

  // deprecated
  delete apiLoginUser.onlineFriends;
  delete apiLoginUser.activeFriends;
  delete apiLoginUser.offlineFriends;

  // replace
  loginUser.id = apiLoginUser.id ?? '';
  loginUser.apiLoginUser = vue.reactive(apiLoginUser);

  if (apiLoginUser.requiresTwoFactorAuth !== void 0) {
    isLoggedIn.value = false;
    return;
  }

  pubsub.publish('api:login-user');
  isLoggedIn.value = true;
}

export async function logout(): Promise<ApiResponse<ApiSuccess>> {
  let response = await api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: 'logout'
  });

  let {status} = response;
  if (status === ApiStatusCode.OK || status === ApiStatusCode.Unauthorized) {
    loginUser.id = '';
    loginUser.apiLoginUser = {};
    isLoggedIn.value = false;
  }

  return response;
}

export async function fetchAuthToken(): Promise<ApiResponse<ApiAuth>> {
  return api<ApiAuth>({
    method: ApiRequestMethod.GET,
    path: 'auth'
  });
}

export async function sendPasswordRecoveryLink(
  email: string
): Promise<ApiResponse<ApiSuccess>> {
  return api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: 'auth/password',
    body: {
      email
    }
  });
}

export async function verifyTwoFactorAuthCode(
  type: ApiTwoFactorAuthType,
  code: string
): Promise<ApiResponse<ApiTwoFactorAuth>> {
  let response = await api<ApiTwoFactorAuth>({
    method: ApiRequestMethod.POST,
    path: `auth/twofactorauth/${type}/verify`,
    body: {
      code
    }
  });

  let {status, data} = response;
  if (
    status === ApiStatusCode.OK &&
    data !== void 0 &&
    data.verified === true
  ) {
    await fetchLoginUser();
  }

  return response;
}

export async function login(
  username: string,
  password: string
): Promise<ApiResponse<ApiLoginUser>> {
  let response = await api<ApiLoginUser>({
    method: ApiRequestMethod.GET,
    path: 'auth/user',
    auth: {
      username,
      password
    }
  });

  applyLoginUser(response);

  return response;
}

export async function fetchLoginUser(): Promise<ApiResponse<ApiLoginUser>> {
  let response = await api<ApiLoginUser>({
    method: ApiRequestMethod.GET,
    path: 'auth/user'
  });

  applyLoginUser(response);

  return response;
}

export async function fetchPermissionList(): Promise<
  ApiResponse<ApiPermission[]>
> {
  // params: { condensed: boolean }
  return api<ApiPermission[]>({
    method: ApiRequestMethod.GET,
    path: 'auth/permissions'
  });
}

export async function fetchSubscriptionList(): Promise<
  ApiResponse<ApiSubscription[]>
> {
  return api<ApiSubscription[]>({
    method: ApiRequestMethod.GET,
    path: 'auth/user/subscription'
  });
}

export async function fetchOnlineFriendList(
  n: number,
  offset: number
): Promise<ApiResponse<ApiUser[]>> {
  return api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: 'auth/user/friends',
    query: {
      offline: 'false',
      n,
      offset
    }
  });
}

export async function fetchOfflineFriendList(
  n: number,
  offset: number
): Promise<ApiResponse<ApiUser[]>> {
  return api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: 'auth/user/friends',
    query: {
      offline: 'true',
      n,
      offset
    }
  });
}

export async function unfriend(
  userId: string
): Promise<ApiResponse<ApiSuccess>> {
  let response = await api<ApiSuccess>({
    method: ApiRequestMethod.DELETE,
    path: `auth/user/friends/${userId}`
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    lazyFetchUserIdSet.add(userId);
  }

  return response;
}

export async function changePassword(
  password: string,
  currentPassword: string
): Promise<ApiResponse<ApiLoginUser>> {
  let response = await api<ApiLoginUser>({
    method: ApiRequestMethod.PUT,
    path: `users/${loginUser.id}`,
    body: {
      password,
      currentPassword
    }
  });

  applyLoginUser(response);

  return response;
}

export async function switchToAvatar(
  avatarId: string
): Promise<ApiResponse<ApiLoginUser>> {
  let response = await api<ApiLoginUser>({
    method: ApiRequestMethod.PUT,
    path: `users/${loginUser.id}/avatar`,
    body: {
      avatarId
    }
  });

  applyLoginUser(response);

  return response;
}

export async function syncPermissionInternal(): Promise<boolean> {
  let {status, data} = await fetchPermissionList();
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  permissionMap.clear();

  for (let apiPermission of data) {
    let {name} = apiPermission;
    if (name === void 0) {
      continue;
    }

    permissionMap.set(name, apiPermission);
  }

  return true;
}
