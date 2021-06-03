import * as vueRouter from "vue-router";
import * as util from "../../common/util";
import * as pubsub from "../../common/pubsub";
import * as VueLoginUserPage from "./vue/login-user-page/index.vue";
import * as VueGameLogListPage from "./vue/game-log-list-page/index.vue";
import * as VueFavoriteListPage from "./vue/favorite-list-page/index.vue";
import * as VueFriendListPage from "./vue/friend-list-page/index.vue";
import * as VueNotificationListPage from "./vue/notification-list-page/index.vue";
import * as VuePlayerModerationListPage from "./vue/player-moderation-list-page/index.vue";
import * as VueSearchPage from "./vue/search-page/index.vue";
import * as VueSettingPage from "./vue/setting-page/index.vue";
import * as VueUserPage from "./vue/user-page/index.vue";
import * as VueWorldPage from "./vue/world-page/index.vue";
import * as VueAvatarPage from "./vue/avatar-page/index.vue";

export const { useRoute } = vueRouter;

const history = vueRouter.createWebHashHistory();

export const router = vueRouter.createRouter({
  history,
  routes: [
    {
      path: "/",
      name: "login-user-page",
      component: VueLoginUserPage.default,
    },
    {
      path: "/game-logs",
      name: "game-log-list-page",
      component: VueGameLogListPage.default,
    },
    {
      path: "/favorites",
      name: "favorite-list-page",
      component: VueFavoriteListPage.default,
    },
    {
      path: "/friends",
      name: "friend-list-page",
      component: VueFriendListPage.default,
    },
    {
      path: "/notifications",
      name: "notification-list-page",
      component: VueNotificationListPage.default,
    },
    {
      path: "/player-moderations",
      name: "player-moderation-list-page",
      component: VuePlayerModerationListPage.default,
    },
    {
      path: "/search",
      name: "search-page",
      component: VueSearchPage.default,
    },
    {
      path: "/setting",
      name: "setting-page",
      component: VueSettingPage.default,
    },
    {
      path: "/users/:id",
      name: "user-page",
      component: VueUserPage.default,
    },
    {
      path: "/worlds/:id",
      name: "world-page",
      component: VueWorldPage.default,
    },
    {
      path: "/avatars/:id",
      name: "avatar-page",
      component: VueAvatarPage.default,
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

  pubsub.publish("router:button-state", {
    back: position > 0,
    forward: window.history.length > position + 1,
  });

  pubsub.publish("router:after-each", to, from, failure);
});

export function goUserPage(userId: string) {
  router
    .push({
      name: "user-page",
      params: {
        id: userId,
      },
    })
    .catch(util.nop);
}

export function goWorldPage(worldId: string) {
  router
    .push({
      name: "world-page",
      params: {
        id: worldId,
      },
    })
    .catch(util.nop);
}

export function goAvatarPage(avatarId: string) {
  router
    .push({
      name: "avatar-page",
      params: {
        id: avatarId,
      },
    })
    .catch(util.nop);
}
