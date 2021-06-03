import * as vue from 'vue';
import type * as vueRouter from 'vue-router';
import * as util from '../../../../util';
import * as pubsub from '../../../../pubsub';
import * as router from '../../router';
import * as api from '../../game/api';
import * as log from '../../game/log';
import {now} from '../clock';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

let userIdRef = vue.ref('');
let worldInstanceRef = vue.ref<api.ApiWorldInstance | undefined>(void 0);
let worldLinkRef = vue.ref('');

let userRef = vue.computed(() => {
  console.log('UserPage:userRef', userIdRef.value);
  return api.userMap.get(userIdRef.value);
});

let bioRef = vue.computed(() =>
  util.escapeHtml(userRef.value?.apiUser.bio ?? '').replace(/\n/g, '<br>')
);

let worldRef = vue.computed(() => {
  console.log('UserPage:worldRef', userIdRef.value);

  let user = userRef.value;
  if (user === void 0) {
    return;
  }

  let {worldId} = user.locationInfo;
  if (worldId === void 0) {
    return;
  }

  return api.worldMap.get(worldId);
});

let friendRequestRef = vue.computed(() => {
  return api.friendRequestMap.get(userIdRef.value);
});

let playerModerationRef = vue.computed(() => {
  console.log('UserPage:playerModerationRef', userIdRef.value);
  return api.playerModerationMap.get(userIdRef.value);
});

let favoriteRef = vue.computed(() => {
  console.log('UserPage:favoriteRef', userIdRef.value);
  return api.favoriteMap.get(userIdRef.value);
});

let instanceDurationRef = vue.computed(() => {
  let user = userRef.value;
  if (user === void 0) {
    return '';
  }

  let {locationTime} = user;
  if (locationTime === 0) {
    return '';
  }

  let time = now.value - locationTime;
  if (time < 0) {
    return '';
  }

  return util.getDurationString(Math.floor(time / 1000));
});

let instanceOwnerRef = vue.computed(() => {
  console.log('UserPage:instanceOwnerRef');

  let worldInstance = worldInstanceRef.value;
  if (worldInstance === void 0) {
    return;
  }

  let {ownerId} = worldInstance;
  if (typeof ownerId !== 'string') {
    return;
  }

  return api.userMap.get(ownerId);
});

pubsub.subscribe(
  'router:after-each',
  ({name, params}: vueRouter.RouteLocationNormalized) => {
    if (name !== 'user-page') {
      return;
    }

    let userId = params.id as string;
    console.log('UserPage', userId);
    setUserId(userId).catch(util.nop);
  }
);

async function setUserId(userId: string): Promise<void> {
  if (userIdRef.value === userId && api.userMap.has(userId) === true) {
    return;
  }

  userIdRef.value = userId;

  try {
    await api.fetchUser(userId);
    await api.fetchFriendStatus(userId);
  } catch (err) {
    console.error(err);
  }
}

function clickInstanceOwner(): void {
  let worldInstance = worldInstanceRef.value;
  if (worldInstance === void 0) {
    return;
  }

  let {ownerId} = worldInstance;
  if (typeof ownerId !== 'string') {
    return;
  }

  router.goUserPage(ownerId);
}

async function refreshInstance(): Promise<void> {
  try {
    worldInstanceRef.value = void 0;

    let user = userRef.value;
    if (user === void 0) {
      return;
    }

    let {locationInfo} = user;
    if (locationInfo.instanceId === void 0) {
      return;
    }

    let {status, data: apiWorldInstance} = await api.fetchWorldInstance(
      locationInfo.location
    );
    if (status !== api.ApiStatusCode.OK || apiWorldInstance === void 0) {
      return;
    }

    worldInstanceRef.value = apiWorldInstance;
    worldLinkRef.value = `https://vrch.at/${apiWorldInstance.shortName ?? ''}`;

    let {ownerId} = apiWorldInstance;
    if (
      typeof ownerId !== 'string' ||
      ownerId.length === 0 ||
      api.userMap.has(ownerId) === true
    ) {
      return;
    }

    await api.fetchUser(ownerId);
  } catch (err) {
    console.error(err);
  }
}

vue.watchEffect(() => {
  refreshInstance().catch(util.nop);
});

async function onActionMenuCommand(command: string): Promise<void> {
  console.log('onActionMenuCommand', command);
  try {
    let user = userRef.value;
    if (user === void 0) {
      return;
    }

    switch (command) {
      case 'sendFriendRequest': {
        // eslint-disable-next-line no-alert
        let action = confirm('sendFriendRequest');
        if (action === false) {
          break;
        }

        await api.sendFriendRequest(user.id);
        break;
      }

      case 'cancelFriendRequest': {
        // eslint-disable-next-line no-alert
        let action = confirm('cancelFriendRequest');
        if (action === false) {
          break;
        }

        await api.cancelFriendRequest(user.id);
        break;
      }

      case 'acceptFriendRequest': {
        // eslint-disable-next-line no-alert
        let action = confirm('acceptNotification');
        if (action === false) {
          break;
        }

        let notification = api.friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await api.acceptNotification(notification.id);
        break;
      }

      case 'declineFriendRequest': {
        // eslint-disable-next-line no-alert
        let action = confirm('hideNotification');
        if (action === false) {
          break;
        }

        let notification = api.friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await api.hideNotification(notification.id);
        break;
      }

      case 'unfriend': {
        // eslint-disable-next-line no-alert
        let action = confirm('unfriend');
        if (action === false) {
          break;
        }

        await api.unfriend(user.id);
        break;
      }

      case 'blockUser': {
        // eslint-disable-next-line no-alert
        let action = confirm('blockUser');
        if (action === false) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Block
        );
        break;
      }

      case 'unblockUser': {
        // eslint-disable-next-line no-alert
        let action = confirm('unblockUser');
        if (action === false) {
          break;
        }

        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Block
        );
        break;
      }

      case 'muteUser': {
        // eslint-disable-next-line no-alert
        let action = confirm('muteUser');
        if (action === false) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Mute
        );
        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Unmute
        );
        break;
      }

      case 'unmuteUser': {
        // eslint-disable-next-line no-alert
        let action = confirm('unmuteUser');
        if (action === false) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Unmute
        );
        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Mute
        );
        break;
      }

      case 'hideAvatar': {
        // eslint-disable-next-line no-alert
        let action = confirm('hideAvatar');
        if (action === false) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.HideAvatar
        );
        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.ShowAvatar
        );
        break;
      }

      case 'showAvatar': {
        // eslint-disable-next-line no-alert
        let action = confirm('showAvatar');
        if (action === false) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.ShowAvatar
        );
        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.HideAvatar
        );
        break;
      }

      case 'sendRequestInvite': {
        // eslint-disable-next-line no-alert
        let action = confirm('sendRequestInvite');
        if (action === false) {
          break;
        }

        await api.sendRequestInvite(user.id, {
          platform: api.ApiPlatform.UnknownPlatform
        });
        break;
      }

      case 'sendInvite': {
        let summary = log.summary.value;
        if (summary === void 0) {
          break;
        }

        let {location, worldName} = summary;
        let locationInfo = api.parseLocation(location);
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        let action = confirm(`sendInvite: ${locationInfo.location}`);
        if (action === false) {
          break;
        }

        await api.sendInvite(user.id, {
          instanceId: location,
          worldId: location
        });
        break;
      }

      case 'sendInviteMe': {
        let {locationInfo} = user;
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        let action = confirm(`sendInviteMe: ${locationInfo.location}`);
        if (action === false) {
          break;
        }

        await api.sendInvite(api.loginUser.id, {
          instanceId: locationInfo.location,
          worldId: locationInfo.location
        });
        break;
      }

      case 'playGame': {
        let {locationInfo} = user;
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        let action = confirm(`playGame: ${locationInfo.location}`);
        if (action === false) {
          break;
        }

        await ipcRenderer.invoke(
          'native:playGame',
          `vrchat://launch?id=${locationInfo.location}`
        );
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: api.FavoriteGroup): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('addFavorite');
    if (action === false) {
      return;
    }

    await api.addToFavoriteGroup(
      api.ApiFavoriteGroupType.Friend,
      userIdRef.value,
      favoriteGroup.apiFavoriteGroup.name
    );
  } catch (err) {
    console.error(err);
  }
}

async function removeFavorite(): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('removeFavorite');
    if (action === false) {
      return;
    }

    await api.removeFromFavoriteGroup(userIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: 'UserPage',
  components: {
    Location: require('../location').default
  },
  setup(): any {
    // let {params} = router.useRoute();

    // let userId = params.id as string;
    // console.log('UserPage', userId);
    // setUserId(userId);

    return {
      friendFavoriteGroupList: api.friendFavoriteGroupList,
      userId: userIdRef,
      worldInstance: worldInstanceRef,
      worldLink: worldLinkRef,
      user: userRef,
      bio: bioRef,
      world: worldRef,
      friendRequest: friendRequestRef,
      playerModeration: playerModerationRef,
      favorite: favoriteRef,
      instanceDuration: instanceDurationRef,
      instanceOwner: instanceOwnerRef,
      refreshInstance,
      clickInstanceOwner,
      onActionMenuCommand,
      addFavorite,
      removeFavorite
    };
  }
};
