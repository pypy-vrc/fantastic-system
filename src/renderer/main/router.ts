import { createRouter, createWebHashHistory, useRoute } from "vue-router";
import { nop } from "../../common/util.ts";
import { publish } from "../../common/pubsub.ts";
import VueLoginUserPage from "./vue/login-user-page/index.vue";
import VueGameLogListPage from "./vue/game-log-list-page/index.vue";
import VueFavoriteListPage from "./vue/favorite-list-page/index.vue";
import VueFriendListPage from "./vue/friend-list-page/index.vue";
import VueNotificationListPage from "./vue/notification-list-page/index.vue";
import VuePlayerModerationListPage from "./vue/player-moderation-list-page/index.vue";
import VueSearchPage from "./vue/search-page/index.vue";
import VueSettingPage from "./vue/setting-page/index.vue";
import VueUserPage from "./vue/user-page/index.vue";
import VueWorldPage from "./vue/world-page/index.vue";
import VueAvatarPage from "./vue/avatar-page/index.vue";

export { useRoute };

const history = createWebHashHistory();

export const router = createRouter({
  history,
  routes: [
    {
      path: "/",
      name: "login-user-page",
      component: VueLoginUserPage,
    },
    {
      path: "/game-logs",
      name: "game-log-list-page",
      component: VueGameLogListPage,
    },
    {
      path: "/favorites",
      name: "favorite-list-page",
      component: VueFavoriteListPage,
    },
    {
      path: "/friends",
      name: "friend-list-page",
      component: VueFriendListPage,
    },
    {
      path: "/notifications",
      name: "notification-list-page",
      component: VueNotificationListPage,
    },
    {
      path: "/player-moderations",
      name: "player-moderation-list-page",
      component: VuePlayerModerationListPage,
    },
    {
      path: "/search",
      name: "search-page",
      component: VueSearchPage,
    },
    {
      path: "/setting",
      name: "setting-page",
      component: VueSettingPage,
    },
    {
      path: "/users/:id",
      name: "user-page",
      component: VueUserPage,
    },
    {
      path: "/worlds/:id",
      name: "world-page",
      component: VueWorldPage,
    },
    {
      path: "/avatars/:id",
      name: "avatar-page",
      component: VueAvatarPage,
    },
  ],
  scrollBehavior(to, from) {
    let { viewScrollLeft, viewScrollTop } = window.history.state;

    if (to.name === from.name) {
      // scroll top top when route to same page
      viewScrollLeft = 0;
      viewScrollTop = 0;
    } else {
      viewScrollLeft ??= 0;
      viewScrollTop ??= 0;
    }

    document.getElementById("view")?.scrollTo(viewScrollLeft, viewScrollTop);
    return { left: 0, top: 0 }; // ignore body scroll
  },
});

router.afterEach((to, from, failure) => {
  const position = Number(history.state.position);

  publish("router:button-state", {
    back: position > 0,
    forward: window.history.length > position + 1,
  });

  publish("router:after-each", to, from, failure);
});

export function goUserPage(userId: string) {
  router
    .push({
      name: "user-page",
      params: {
        id: userId,
      },
    })
    .catch(nop);
}

export function goWorldPage(worldId: string) {
  router
    .push({
      name: "world-page",
      params: {
        id: worldId,
      },
    })
    .catch(nop);
}

export function goAvatarPage(avatarId: string) {
  router
    .push({
      name: "avatar-page",
      params: {
        id: avatarId,
      },
    })
    .catch(nop);
}
