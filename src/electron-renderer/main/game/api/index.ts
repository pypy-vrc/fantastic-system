import * as noty from 'noty';
import * as util from '../../../../util';
import * as pubsub from '../../../../pubsub';
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchAvatarIdSet,
  lazyFetchUserIdSet,
  lazyFetchWorldIdSet,
  notFoundAvatarIdSet,
  notFoundUserIdSet,
  notFoundWorldIdSet
} from './base';
import {checkWebSocket} from './pipeline';
import {
  loginUser,
  fetchLoginUser,
  syncPermissionInternal
} from './endpoint/auth';
import {syncFavoriteInternal} from './endpoint/favorite';
import {syncNotificationInternal} from './endpoint/notification';
import {syncPlayerModerationInternal} from './endpoint/player-moderation';
import {
  fetchUser,
  syncFriendInternal,
  userMap,
  UserState
} from './endpoint/user';
import {fetchWorld} from './endpoint/world';
import {fetchAvatar} from './endpoint/avatar';

export * from './base';
export * from './location';
export * from './endpoint/auth';
export * from './endpoint/avatar';
export * from './endpoint/config';
export * from './endpoint/etc';
export * from './endpoint/favorite';
export * from './endpoint/file';
export * from './endpoint/message';
export * from './endpoint/notification';
export * from './endpoint/player-moderation';
export * from './endpoint/user';
export * from './endpoint/world';

let hasFreshLoginUser = false;
let nextLoginUserSyncTime = 0;
let nextFriendSyncTime = 0;
let nextRecentFriendSyncTime = 0;
let nextPermissionSyncTime = 0;
let nextNotificationSyncTime = 0;
let nextPlayerModerationSyncTime = 0;
let nextFavoriteSyncTime = 0;

pubsub.subscribe('api:login-user', () => {
  hasFreshLoginUser = true;
  nextLoginUserSyncTime = Date.now() + 60 * 1000; // 1m
});

pubsub.subscribe('api:login', () => {
  // nextLoginUserSyncTime = 0;
  nextFriendSyncTime = 0;
  nextRecentFriendSyncTime = 0;
  nextPermissionSyncTime = 0;
  nextNotificationSyncTime = 0;
  nextPlayerModerationSyncTime = 0;
  nextFavoriteSyncTime = 0;

  new noty({
    type: 'info',
    layout: 'bottomRight',
    theme: 'sunset',
    text: `Hello there, ${util.escapeHtml(
      loginUser.apiLoginUser.displayName ?? loginUser.id
    )}`,
    timeout: 6000,
    queue: 'api'
  }).show();
});

pubsub.subscribe('api:logout', () => {
  new noty({
    type: 'info',
    layout: 'bottomRight',
    theme: 'sunset',
    text: `See you again, ${util.escapeHtml(
      loginUser.apiLoginUser.displayName ?? loginUser.id
    )}`,
    timeout: 6000,
    queue: 'api'
  }).show();
});

export function refreshFriend(): void {
  nextLoginUserSyncTime = 0;
  nextFriendSyncTime = 0;
}

export function refreshPermission(): void {
  nextLoginUserSyncTime = 0;
  nextPermissionSyncTime = 0;
}

export function refreshNotification(): void {
  nextLoginUserSyncTime = 0;
  nextNotificationSyncTime = 0;
}

export function refreshPlayerModeration(): void {
  nextLoginUserSyncTime = 0;
  nextPlayerModerationSyncTime = 0;
}

export function refreshFavorite(): void {
  nextLoginUserSyncTime = 0;
  nextFavoriteSyncTime = 0;
}

async function syncFriend(): Promise<void> {
  // 503, 'endpoint temporarily disabled'

  if (Date.now() >= nextFriendSyncTime) {
    if ((await syncFriendInternal()) === false) {
      nextFriendSyncTime = Date.now() + 10 * 1000; // 10s
      return;
    }

    nextFriendSyncTime = Date.now() + 3600 * 1000; // 1h
    nextRecentFriendSyncTime = 0;
  }

  if (Date.now() >= nextRecentFriendSyncTime) {
    let minActivityTime = Date.now() - 3600 * 1000; // 1h

    let {friends} = loginUser.apiLoginUser;
    if (friends !== void 0) {
      for (let userId of friends) {
        let user = userMap.get(userId);
        if (
          user !== void 0 &&
          user.state === UserState.Offline &&
          user.activityTime < minActivityTime
        ) {
          continue;
        }
        lazyFetchUserIdSet.add(userId);
      }
    }

    nextRecentFriendSyncTime = Date.now() + 300 * 1000; // 5m
  }
}

async function syncPermission(): Promise<void> {
  if (Date.now() < nextPermissionSyncTime) {
    return;
  }

  if ((await syncPermissionInternal()) === false) {
    nextPermissionSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextPermissionSyncTime = Date.now() + 60 * 1000; // 1m
}

async function syncNotification(): Promise<void> {
  if (Date.now() < nextNotificationSyncTime) {
    return;
  }

  if ((await syncNotificationInternal()) === false) {
    nextNotificationSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextNotificationSyncTime = Date.now() + 300 * 1000; // 5m
}

async function syncPlayerModeration(): Promise<void> {
  if (Date.now() < nextPlayerModerationSyncTime) {
    return;
  }

  if ((await syncPlayerModerationInternal()) === false) {
    nextPlayerModerationSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextPlayerModerationSyncTime = Date.now() + 660 * 1000; // 11m
}

async function syncFavorite(): Promise<void> {
  if (Date.now() < nextFavoriteSyncTime) {
    return;
  }

  if ((await syncFavoriteInternal()) === false) {
    nextFavoriteSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextFavoriteSyncTime = Date.now() + 420 * 1000; // 7m
}

(async function syncLoop(): Promise<never> {
  for (;;) {
    await util.sleep(1007);

    try {
      if (isLoggedIn.value === false) {
        continue;
      }

      if (Date.now() >= nextLoginUserSyncTime) {
        let {status} = await fetchLoginUser();
        if (status === ApiStatusCode.OK) {
          nextLoginUserSyncTime = Date.now() + 60 * 1000; // 1m
          hasFreshLoginUser = true; // TYPESCRIPT SUCKS
        } else {
          nextLoginUserSyncTime = Date.now() + 10 * 1000; // 10s
        }
      }

      if (hasFreshLoginUser === true) {
        hasFreshLoginUser = false;
        await Promise.all([
          fetchUser(loginUser.id),
          syncPermission(),
          syncFriend()
        ]);
        await Promise.all([
          syncNotification(),
          syncPlayerModeration(),
          syncFavorite()
        ]);
      }

      await checkWebSocket();
    } catch (err) {
      console.error(err);
    }
  }
})();

(async function fetchUserLoop(): Promise<never> {
  for (;;) {
    await util.sleep(500);

    try {
      if (isLoggedIn.value === false || lazyFetchUserIdSet.size === 0) {
        continue;
      }

      for (let userId of [...lazyFetchUserIdSet]) {
        if (notFoundUserIdSet.has(userId) === true) {
          lazyFetchUserIdSet.delete(userId);
          continue;
        }

        let {status} = await fetchUser(userId);
        if (status === ApiStatusCode.Unauthorized) {
          break;
        }

        if (status === ApiStatusCode.OK) {
          lazyFetchUserIdSet.delete(userId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
})();

(async function fetchWorldLoop(): Promise<never> {
  for (;;) {
    await util.sleep(500);

    try {
      if (isLoggedIn.value === false || lazyFetchWorldIdSet.size === 0) {
        continue;
      }

      for (let worldId of [...lazyFetchWorldIdSet]) {
        if (notFoundWorldIdSet.has(worldId) === true) {
          lazyFetchWorldIdSet.delete(worldId);
          continue;
        }

        let {status} = await fetchWorld(worldId);
        if (status === ApiStatusCode.Unauthorized) {
          break;
        }

        if (status === ApiStatusCode.OK) {
          lazyFetchWorldIdSet.delete(worldId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
})();

(async function fetchAvatarLoop(): Promise<never> {
  for (;;) {
    await util.sleep(500);

    try {
      if (isLoggedIn.value === false || lazyFetchAvatarIdSet.size === 0) {
        continue;
      }

      for (let avatarId of [...lazyFetchAvatarIdSet]) {
        if (notFoundAvatarIdSet.has(avatarId) === true) {
          lazyFetchAvatarIdSet.delete(avatarId);
          continue;
        }

        let {status} = await fetchAvatar(avatarId);
        if (status === ApiStatusCode.Unauthorized) {
          break;
        }

        if (status === ApiStatusCode.OK) {
          lazyFetchAvatarIdSet.delete(avatarId);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
})();
