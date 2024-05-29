import * as noty from "noty";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchAvatarIdSet,
  lazyFetchUserIdSet,
  lazyFetchWorldIdSet,
  notFoundAvatarIdSet,
  notFoundUserIdSet,
  notFoundWorldIdSet,
} from "./base";
import { checkWebSocket } from "./pipeline";
import {
  loginUser,
  fetchLoginUser,
  syncPermissionInternal,
} from "./endpoint/auth";
import { syncFavoriteInternal } from "./endpoint/favorite";
import { syncNotificationInternal } from "./endpoint/notification";
import { syncPlayerModerationInternal } from "./endpoint/player-moderation";
import {
  fetchUser,
  syncFriendInternal,
  userMap,
  UserState,
} from "./endpoint/user";
import { fetchWorld } from "./endpoint/world";
import { fetchAvatar } from "./endpoint/avatar";

export * from "./base";
export * from "./location";
export * from "./endpoint/auth";
export * from "./endpoint/avatar";
export * from "./endpoint/config";
export * from "./endpoint/etc";
export * from "./endpoint/favorite";
export * from "./endpoint/file";
export * from "./endpoint/message";
export * from "./endpoint/notification";
export * from "./endpoint/player-moderation";
export * from "./endpoint/user";
export * from "./endpoint/world";

let hasFreshLoginUser = false;
let nextLoginUserSyncTime = 0;
let nextFriendSyncTime = 0;
let nextRecentFriendSyncTime = 0;
let nextPermissionSyncTime = 0;
let nextNotificationSyncTime = 0;
let nextPlayerModerationSyncTime = 0;
let nextFavoriteSyncTime = 0;

pubsub.subscribe("api:login-user", () => {
  hasFreshLoginUser = true;
  nextLoginUserSyncTime = Date.now() + 60 * 1000; // 1m
});

pubsub.subscribe("api:login", () => {
  // nextLoginUserSyncTime = 0;
  nextFriendSyncTime = 0;
  nextRecentFriendSyncTime = 0;
  nextPermissionSyncTime = 0;
  nextNotificationSyncTime = 0;
  nextPlayerModerationSyncTime = 0;
  nextFavoriteSyncTime = 0;

  new noty({
    type: "info",
    layout: "bottomRight",
    theme: "sunset",
    text: `Hello there, ${util.escapeHtml(
      loginUser.apiLoginUser.displayName ?? loginUser.id
    )}`,
    timeout: 6000,
    queue: "api",
  }).show();
});

pubsub.subscribe("api:logout", () => {
  new noty({
    type: "info",
    layout: "bottomRight",
    theme: "sunset",
    text: `See you again, ${util.escapeHtml(
      loginUser.apiLoginUser.displayName ?? loginUser.id
    )}`,
    timeout: 6000,
    queue: "api",
  }).show();
});

export function refreshFriend() {
  nextLoginUserSyncTime = 0;
  nextFriendSyncTime = 0;
}

export function refreshPermission() {
  nextLoginUserSyncTime = 0;
  nextPermissionSyncTime = 0;
}

export function refreshNotification() {
  nextLoginUserSyncTime = 0;
  nextNotificationSyncTime = 0;
}

export function refreshPlayerModeration() {
  nextLoginUserSyncTime = 0;
  nextPlayerModerationSyncTime = 0;
}

export function refreshFavorite() {
  nextLoginUserSyncTime = 0;
  nextFavoriteSyncTime = 0;
}

async function syncFriend() {
  // 503, 'endpoint temporarily disabled'

  if (Date.now() >= nextFriendSyncTime) {
    if (!(await syncFriendInternal())) {
      nextFriendSyncTime = Date.now() + 10 * 1000; // 10s
      return;
    }

    nextFriendSyncTime = Date.now() + 3600 * 1000; // 1h
    nextRecentFriendSyncTime = 0;
  }

  if (Date.now() >= nextRecentFriendSyncTime) {
    const minActivityTime = Date.now() - 3600 * 1000; // 1h

    const { friends } = loginUser.apiLoginUser;
    if (friends !== void 0) {
      for (const userId of friends) {
        const user = userMap.get(userId);
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

async function syncPermission() {
  if (Date.now() < nextPermissionSyncTime) {
    return;
  }

  if (!(await syncPermissionInternal())) {
    nextPermissionSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextPermissionSyncTime = Date.now() + 60 * 1000; // 1m
}

async function syncNotification() {
  if (Date.now() < nextNotificationSyncTime) {
    return;
  }

  if (!(await syncNotificationInternal())) {
    nextNotificationSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextNotificationSyncTime = Date.now() + 300 * 1000; // 5m
}

async function syncPlayerModeration() {
  if (Date.now() < nextPlayerModerationSyncTime) {
    return;
  }

  if (!(await syncPlayerModerationInternal())) {
    nextPlayerModerationSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextPlayerModerationSyncTime = Date.now() + 660 * 1000; // 11m
}

async function syncFavorite() {
  if (Date.now() < nextFavoriteSyncTime) {
    return;
  }

  if (!(await syncFavoriteInternal())) {
    nextFavoriteSyncTime = Date.now() + 10 * 1000; // 10s
    return;
  }

  nextFavoriteSyncTime = Date.now() + 420 * 1000; // 7m
}

(async function syncLoop() {
  for (;;) {
    await util.sleep(1007);

    try {
      if (!isLoggedIn.value) {
        continue;
      }

      if (Date.now() >= nextLoginUserSyncTime) {
        const { status } = await fetchLoginUser();
        if (status === ApiStatusCode.OK) {
          nextLoginUserSyncTime = Date.now() + 60 * 1000; // 1m
          hasFreshLoginUser = true; // TYPESCRIPT SUCKS
        } else {
          nextLoginUserSyncTime = Date.now() + 10 * 1000; // 10s
        }
      }

      if (hasFreshLoginUser) {
        hasFreshLoginUser = false;
        await Promise.all([
          fetchUser(loginUser.id),
          syncPermission(),
          syncFriend(),
        ]);
        await Promise.all([
          syncNotification(),
          syncPlayerModeration(),
          syncFavorite(),
        ]);
      }

      await checkWebSocket();
    } catch (err) {
      console.error(err);
    }
  }
})();

(async function fetchUserLoop() {
  for (;;) {
    await util.sleep(500);

    try {
      if (!isLoggedIn.value || lazyFetchUserIdSet.size === 0) {
        continue;
      }

      for (const userId of [...lazyFetchUserIdSet]) {
        if (notFoundUserIdSet.has(userId)) {
          lazyFetchUserIdSet.delete(userId);
          continue;
        }

        const { status } = await fetchUser(userId);
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

(async function fetchWorldLoop() {
  for (;;) {
    await util.sleep(500);

    try {
      if (!isLoggedIn.value || lazyFetchWorldIdSet.size === 0) {
        continue;
      }

      for (const worldId of [...lazyFetchWorldIdSet]) {
        if (notFoundWorldIdSet.has(worldId)) {
          lazyFetchWorldIdSet.delete(worldId);
          continue;
        }

        const { status } = await fetchWorld(worldId);
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

(async function fetchAvatarLoop() {
  for (;;) {
    await util.sleep(500);

    try {
      if (!isLoggedIn.value || lazyFetchAvatarIdSet.size === 0) {
        continue;
      }

      for (const avatarId of [...lazyFetchAvatarIdSet]) {
        if (notFoundAvatarIdSet.has(avatarId)) {
          lazyFetchAvatarIdSet.delete(avatarId);
          continue;
        }

        const { status } = await fetchAvatar(avatarId);
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
