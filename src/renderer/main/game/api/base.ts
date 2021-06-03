import * as vue from 'vue';
import * as pubsub from '../../../../pubsub';

export type DateTimeString = string;

export const enum ApiStatusCode {
  OK = 200,
  Unauthorized = 401,
  NotFound = 404
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
  UnknownPlatform = 'unknownplatform',
  StandaloneWindows = 'standalonewindows',
  Android = 'android',
  All = 'all'
}

export const enum ApiReleaseStatus {
  All = 'all',
  Public = 'public',
  Private = 'private',
  Hidden = 'hidden'
}

export let isLoggedIn = vue.ref(false);
export let lazyFetchUserIdSet = new Set<string>();
export let lazyFetchWorldIdSet = new Set<string>();
export let lazyFetchAvatarIdSet = new Set<string>();
export let notFoundUserIdSet = new Set<string>();
export let notFoundWorldIdSet = new Set<string>();
export let notFoundAvatarIdSet = new Set<string>();

let fetchUserTimerMap = new Map<string, any>();

vue.watch(isLoggedIn, (value: boolean) => {
  if (value === false) {
    console.log('logout');
    pubsub.publish('api:logout');
    return;
  }

  lazyFetchUserIdSet.clear();
  lazyFetchWorldIdSet.clear();
  lazyFetchAvatarIdSet.clear();
  notFoundUserIdSet.clear();
  notFoundWorldIdSet.clear();
  notFoundAvatarIdSet.clear();

  for (let timerId of fetchUserTimerMap.values()) {
    clearTimeout(timerId);
  }
  fetchUserTimerMap.clear();

  console.log('login');
  pubsub.publish('api:login');
});

export function setFetchUserTimer(userId: string, milliseconds: number): void {
  let timerId = fetchUserTimerMap.get(userId);
  if (timerId !== void 0) {
    clearTimeout(timerId);
  }

  fetchUserTimerMap.set(
    userId,
    setTimeout(() => {
      fetchUserTimerMap.delete(userId);
      lazyFetchUserIdSet.add(userId);
    }, milliseconds)
  );
}
