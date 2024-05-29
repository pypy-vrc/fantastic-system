import * as vue from "vue";
import * as pubsub from "../../../../common/pubsub";

export type DateTimeString = string;

export const enum ApiStatusCode {
  OK = 200,
  Unauthorized = 401,
  NotFound = 404,
}

export interface ApiResponse<T> {
  status: number;
  data?: T;
}

export interface ApiResult {
  message: string;
  status_code: number;
}

export interface ApiError {
  error?: ApiResult;
}

export interface ApiSuccess {
  success?: ApiResult;
}

export const enum ApiPlatform {
  UnknownPlatform = "unknownplatform",
  StandaloneWindows = "standalonewindows",
  Android = "android",
  All = "all",
}

export const enum ApiReleaseStatus {
  All = "all",
  Public = "public",
  Private = "private",
  Hidden = "hidden",
}

export const isLoggedIn = vue.ref(false);
export const lazyFetchUserIdSet = new Set<string>();
export const lazyFetchWorldIdSet = new Set<string>();
export const lazyFetchAvatarIdSet = new Set<string>();
export const notFoundUserIdSet = new Set<string>();
export const notFoundWorldIdSet = new Set<string>();
export const notFoundAvatarIdSet = new Set<string>();

const fetchUserTimerMap = new Map<string, unknown>();

vue.watch(isLoggedIn, (value: boolean) => {
  if (!value) {
    console.log("logout");
    pubsub.publish("api:logout");
    return;
  }

  lazyFetchUserIdSet.clear();
  lazyFetchWorldIdSet.clear();
  lazyFetchAvatarIdSet.clear();
  notFoundUserIdSet.clear();
  notFoundWorldIdSet.clear();
  notFoundAvatarIdSet.clear();

  for (const timerId of fetchUserTimerMap.values()) {
    clearTimeout(timerId as number);
  }
  fetchUserTimerMap.clear();

  console.log("login");
  pubsub.publish("api:login");
});

export function setFetchUserTimer(userId: string, milliseconds: number) {
  const timerId = fetchUserTimerMap.get(userId);
  if (timerId !== void 0) {
    clearTimeout(timerId as number);
  }

  fetchUserTimerMap.set(
    userId,
    setTimeout(() => {
      fetchUserTimerMap.delete(userId);
      lazyFetchUserIdSet.add(userId);
    }, milliseconds) as unknown
  );
}
