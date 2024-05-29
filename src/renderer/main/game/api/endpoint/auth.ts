import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import type {
  ApiPlatform,
  ApiResponse,
  ApiSuccess,
  DateTimeString,
} from "../base";
import { ApiStatusCode, isLoggedIn, lazyFetchUserIdSet } from "../base";
import { api, ApiRequestMethod } from "../internal";
import type {
  ApiUser,
  ApiUserDeveloperType,
  ApiUserState,
  ApiUserStatus,
} from "./user";

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
  currentAvatar?: string;
  currentAvatarAssetUrl?: string;
  fallbackAvatar?: string;
  accountDeletionDate?: string | null;
  acceptedTOSVersion?: number;
  steamId?: string;
  steamDetails?: object;
  oculusId?: string;
  hasLoggedInFromClient?: boolean;
  homeLocation?: string;
  twoFactorAuthEnabled?: boolean;
  twoFactorAuthEnabledDate?: DateTimeString;
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
  last_activity?: DateTimeString;
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
  TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION = "totp",
  ONE_TIME_PASSWORD_AUTHENTICATION = "otp",
  SMS_AUTHENTICATION = "sms",
}

export interface ApiTwoFactorAuth {
  verified?: boolean;
}

export const enum ApiPermissionName {
  EarlyAdopterTags = "permission-early-adopter-tags",
  ExtraFavoritesAvatarGroups = "permission-extra-favorites-avatar-groups",
  InvitePhotos = "permission-invite-photos",
  ProfilePicOverride = "permission-profile-pic-override",
  SupporterTags = "permission-supporter-tags",
  TrustBoost = "permission-trust-boost",
  UserGallery = "permission-user-gallery",
  UserIcons = "permission-user-icons",
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

export const loginUser = vue.reactive<LoginUser>({
  id: "",
  apiLoginUser: {},
});

export const permissionMap = vue.reactive(new Map<string, ApiPermission>());

pubsub.subscribe("api:login", () => {
  permissionMap.clear();
});

function applyLoginUser({
  status,
  data: apiLoginUser,
}: ApiResponse<ApiLoginUser>) {
  if (status === ApiStatusCode.Unauthorized) {
    loginUser.id = "";
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
  loginUser.id = apiLoginUser.id ?? "";
  loginUser.apiLoginUser = vue.reactive(apiLoginUser);

  if (apiLoginUser.requiresTwoFactorAuth !== void 0) {
    isLoggedIn.value = false;
    return;
  }

  pubsub.publish("api:login-user");
  isLoggedIn.value = true;
}

export async function logout() {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: "logout",
  });

  const { status } = response;
  if (status === ApiStatusCode.OK || status === ApiStatusCode.Unauthorized) {
    loginUser.id = "";
    loginUser.apiLoginUser = {};
    isLoggedIn.value = false;
  }

  return response;
}

export async function fetchAuthToken() {
  return api<ApiAuth>({
    method: ApiRequestMethod.GET,
    path: "auth",
  });
}

export async function sendPasswordRecoveryLink(email: string) {
  return api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: "auth/password",
    body: {
      email,
    },
  });
}

export async function verifyTwoFactorAuthCode(
  type: ApiTwoFactorAuthType,
  code: string
) {
  const response = await api<ApiTwoFactorAuth>({
    method: ApiRequestMethod.POST,
    path: `auth/twofactorauth/${type}/verify`,
    body: {
      code,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0 && data.verified) {
    await fetchLoginUser();
  }

  return response;
}

export async function login(username: string, password: string) {
  const response = await api<ApiLoginUser>({
    method: ApiRequestMethod.GET,
    path: "auth/user",
    auth: {
      username,
      password,
    },
  });

  applyLoginUser(response);

  return response;
}

export async function fetchLoginUser() {
  const response = await api<ApiLoginUser>({
    method: ApiRequestMethod.GET,
    path: "auth/user",
  });

  applyLoginUser(response);

  return response;
}

export async function fetchPermissionList() {
  // params: { condensed: boolean }
  return api<ApiPermission[]>({
    method: ApiRequestMethod.GET,
    path: "auth/permissions",
  });
}

export async function fetchSubscriptionList() {
  return api<ApiSubscription[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/subscription",
  });
}

export async function fetchOnlineFriendList(n: number, offset: number) {
  return api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/friends",
    query: {
      offline: "false",
      n,
      offset,
    },
  });
}

export async function fetchOfflineFriendList(n: number, offset: number) {
  return api<ApiUser[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/friends",
    query: {
      offline: "true",
      n,
      offset,
    },
  });
}

export async function unfriend(userId: string) {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.DELETE,
    path: `auth/user/friends/${userId}`,
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    lazyFetchUserIdSet.add(userId);
  }

  return response;
}

export async function changePassword(
  password: string,
  currentPassword: string
) {
  const response = await api<ApiLoginUser>({
    method: ApiRequestMethod.PUT,
    path: `users/${loginUser.id}`,
    body: {
      password,
      currentPassword,
    },
  });

  applyLoginUser(response);

  return response;
}

export async function switchToAvatar(avatarId: string) {
  const response = await api<ApiLoginUser>({
    method: ApiRequestMethod.PUT,
    path: `users/${loginUser.id}/avatar`,
    body: {
      avatarId,
    },
  });

  applyLoginUser(response);

  return response;
}

export async function syncPermissionInternal() {
  const { status, data } = await fetchPermissionList();
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  permissionMap.clear();

  for (const apiPermission of data) {
    const { name } = apiPermission;
    if (name === void 0) {
      continue;
    }

    permissionMap.set(name, apiPermission);
  }

  return true;
}
