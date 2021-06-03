import * as vueRouter from 'vue-router';
import * as util from '../../util';
import * as pubsub from '../../pubsub';

export let {useRoute} = vueRouter;

let history = vueRouter.createWebHashHistory();

export let router = vueRouter.createRouter({
  history,
  routes: [
    {
      path: '/',
      name: 'login-user-page',
      component: require('./vue/login-user-page').default
    },
    {
      path: '/game-logs',
      name: 'game-log-list-page',
      component: require('./vue/game-log-list-page').default
    },
    {
      path: '/favorites',
      name: 'favorite-list-page',
      component: require('./vue/favorite-list-page').default
    },
    {
      path: '/friends',
      name: 'friend-list-page',
      component: require('./vue/friend-list-page').default
    },
    {
      path: '/notifications',
      name: 'notification-list-page',
      component: require('./vue/notification-list-page').default
    },
    {
      path: '/player-moderations',
      name: 'player-moderation-list-page',
      component: require('./vue/player-moderation-list-page').default
    },
    {
      path: '/search',
      name: 'search-page',
      component: require('./vue/search-page').default
    },
    {
      path: '/setting',
      name: 'setting-page',
      component: require('./vue/setting-page').default
    },
    {
      path: '/users/:id',
      name: 'user-page',
      component: require('./vue/user-page').default
    },
    {
      path: '/worlds/:id',
      name: 'world-page',
      component: require('./vue/world-page').default
    },
    {
      path: '/avatars/:id',
      name: 'avatar-page',
      component: require('./vue/avatar-page').default
    }
  ]
});

router.afterEach((to, from, failure) => {
  let position = Number(history.state.position);

  pubsub.publish('router:button-state', {
    back: position > 0,
    forward: window.history.length > position + 1
  });

  pubsub.publish('router:after-each', to, from, failure);
});

export function goUserPage(userId: string): void {
  router
    .push({
      name: 'user-page',
      params: {
        id: userId
      }
    })
    .catch(util.nop);
}

export function goWorldPage(worldId: string): void {
  router
    .push({
      name: 'world-page',
      params: {
        id: worldId
      }
    })
    .catch(util.nop);
}

export function goAvatarPage(avatarId: string): void {
  router
    .push({
      name: 'avatar-page',
      params: {
        id: avatarId
      }
    })
    .catch(util.nop);
}
