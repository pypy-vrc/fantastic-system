import { reactive } from "vue";
import { publish, subscribe } from "../../../../../common/pubsub.ts";
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchUserIdSet,
  type ApiPlatformValue,
  type ApiResponse,
  type ApiSuccess,
  type DateTimeString,
} from "../base.ts";
import { api, ApiRequestMethod } from "../internal.ts";
import type {
  ApiUserStatusValue,
  ApiUserStateValue,
  ApiUserDeveloperTypeValue,
  ApiUser,
} from "./user.ts";

export type ApiAuth = {
  ok?: boolean;
  token?: string;
};

export type ApiLoginUser = {
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
  status?: ApiUserStatusValue;
  statusDescription?: string;
  state?: ApiUserStateValue;
  tags?: string[];
  developerType?: ApiUserDeveloperTypeValue;
  last_login?: DateTimeString;
  last_platform?: ApiPlatformValue;
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
  requiresTwoFactorAuth?: ApiTwoFactorAuthTypeValue[];
};

export type LoginUser = {
  id: string;
  apiLoginUser: ApiLoginUser;
};

export const ApiTwoFactorAuthType = {
  TIME_BASED_ONE_TIME_PASSWORD_AUTHENTICATION: "totp",
  ONE_TIME_PASSWORD_AUTHENTICATION: "otp",
  SMS_AUTHENTICATION: "sms",
};

export type ApiTwoFactorAuthTypeValue =
  (typeof ApiTwoFactorAuthType)[keyof typeof ApiTwoFactorAuthType];

export type ApiTwoFactorAuth = {
  verified?: boolean;
};

export const ApiPermissionName = {
  EarlyAdopterTags: "permission-early-adopter-tags",
  ExtraFavoritesAvatarGroups: "permission-extra-favorites-avatar-groups",
  InvitePhotos: "permission-invite-photos",
  ProfilePicOverride: "permission-profile-pic-override",
  SupporterTags: "permission-supporter-tags",
  TrustBoost: "permission-trust-boost",
  UserGallery: "permission-user-gallery",
  UserIcons: "permission-user-icons",
};

export type ApiPermissionNameValue =
  (typeof ApiPermissionName)[keyof typeof ApiPermissionName];

export type ApiPermission = {
  id?: string;
  ownerId?: string;
  name?: ApiPermissionNameValue;
  data?: {
    tags?: string[];
    maxFavoritePerGroup?: {
      [key: string]: number;
    };
    maxFavoriteGroups?: {
      [key: string]: number;
    };
  };
};

export type ApiSubscription = {
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
};

export const loginUser = reactive<LoginUser>({
  id: "",
  apiLoginUser: {},
});

export const permissionMap = reactive(new Map<string, ApiPermission>());

subscribe("api:login", () => {
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
  loginUser.id = apiLoginUser.id || "";
  loginUser.apiLoginUser = reactive(apiLoginUser);

  if (apiLoginUser.requiresTwoFactorAuth !== void 0) {
    isLoggedIn.value = false;
    return;
  }

  publish("api:login-user");
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

export function fetchAuthToken() {
  return api<ApiAuth>({
    method: ApiRequestMethod.GET,
    path: "auth",
  });
}

export function sendPasswordRecoveryLink(email: string) {
  return api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: "auth/password",
    body: {
      email,
    },
  });
}

export async function verifyTwoFactorAuthCode(
  type: ApiTwoFactorAuthTypeValue,
  code: string,
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

export function fetchPermissionList() {
  // params: { condensed: boolean }
  return api<ApiPermission[]>({
    method: ApiRequestMethod.GET,
    path: "auth/permissions",
  });
}

export function fetchSubscriptionList() {
  return api<ApiSubscription[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/subscription",
  });
}

export function fetchOnlineFriendList(n: number, offset: number) {
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

export function fetchOfflineFriendList(n: number, offset: number) {
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
  currentPassword: string,
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
