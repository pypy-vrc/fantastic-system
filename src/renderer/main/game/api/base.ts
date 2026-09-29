import { ref, watch } from "vue";
import { publish } from "../../../../common/pubsub.ts";

export type DateTimeString = string;

export const ApiStatusCode = {
  OK: 200,
  Unauthorized: 401,
  NotFound: 404,
};

export type ApiResponse<T> = {
  status: number;
  data?: T;
};

export type ApiResult = {
  message: string;
  status_code: number;
};

export type ApiError = {
  error?: ApiResult;
};

export type ApiSuccess = {
  success?: ApiResult;
};

export const ApiPlatform = {
  UnknownPlatform: "unknownplatform",
  StandaloneWindows: "standalonewindows",
  Android: "android",
  All: "all",
};

export type ApiPlatformValue = (typeof ApiPlatform)[keyof typeof ApiPlatform];

export const ApiReleaseStatus = {
  All: "all",
  Public: "public",
  Private: "private",
  Hidden: "hidden",
};

export type ApiReleaseStatusValue =
  (typeof ApiReleaseStatus)[keyof typeof ApiReleaseStatus];

export const isLoggedIn = ref(false);
export const lazyFetchUserIdSet = new Set<string>();
export const lazyFetchWorldIdSet = new Set<string>();
export const lazyFetchAvatarIdSet = new Set<string>();
export const notFoundUserIdSet = new Set<string>();
export const notFoundWorldIdSet = new Set<string>();
export const notFoundAvatarIdSet = new Set<string>();

const fetchUserTimerMap = new Map<string, unknown>();

watch(isLoggedIn, (value: boolean) => {
  if (!value) {
    console.log("logout");
    publish("api:logout");
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
  publish("api:login");
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
    }, milliseconds) as unknown,
  );
}
