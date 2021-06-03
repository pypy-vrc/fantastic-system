import * as vue from "vue";
import type * as vueRouter from "vue-router";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import * as router from "../../router";
import * as api from "../../game/api";
import * as log from "../../game/log";
import { now } from "../clock";
import * as VueLocation from "../location/index.vue";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

const userIdRef = vue.ref("");
const worldInstanceRef = vue.ref<api.ApiWorldInstance | undefined>(void 0);
const worldLinkRef = vue.ref("");

const userRef = vue.computed(() => {
  console.log("UserPage:userRef", userIdRef.value);
  return api.userMap.get(userIdRef.value);
});

const bioRef = vue.computed(() =>
  util.escapeHtml(userRef.value?.apiUser.bio ?? "").replace(/\n/g, "<br>")
);

const worldRef = vue.computed(() => {
  console.log("UserPage:worldRef", userIdRef.value);

  const user = userRef.value;
  if (user === void 0) {
    return;
  }

  const { worldId } = user.locationInfo;
  if (worldId === void 0) {
    return;
  }

  return api.worldMap.get(worldId);
});

const friendRequestRef = vue.computed(() => {
  return api.friendRequestMap.get(userIdRef.value);
});

const playerModerationRef = vue.computed(() => {
  console.log("UserPage:playerModerationRef", userIdRef.value);
  return api.playerModerationMap.get(userIdRef.value);
});

const favoriteRef = vue.computed(() => {
  console.log("UserPage:favoriteRef", userIdRef.value);
  return api.favoriteMap.get(userIdRef.value);
});

const instanceDurationRef = vue.computed(() => {
  const user = userRef.value;
  if (user === void 0) {
    return "";
  }

  const { locationTime } = user;
  if (locationTime === 0) {
    return "";
  }

  const time = now.value - locationTime;
  if (time < 0) {
    return "";
  }

  return util.getDurationString(Math.floor(time / 1000));
});

const instanceOwnerRef = vue.computed(() => {
  console.log("UserPage:instanceOwnerRef");

  const worldInstance = worldInstanceRef.value;
  if (worldInstance === void 0) {
    return;
  }

  const { ownerId } = worldInstance;
  if (typeof ownerId !== "string") {
    return;
  }

  return api.userMap.get(ownerId);
});

pubsub.subscribe(
  "router:after-each",
  ({ name, params }: vueRouter.RouteLocationNormalized) => {
    if (name !== "user-page") {
      return;
    }

    const userId = params.id as string;
    console.log("UserPage", userId);
    setUserId(userId).catch(util.nop);
  }
);

async function setUserId(userId: string) {
  if (userIdRef.value === userId && api.userMap.has(userId)) {
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

function clickInstanceOwner() {
  const worldInstance = worldInstanceRef.value;
  if (worldInstance === void 0) {
    return;
  }

  const { ownerId } = worldInstance;
  if (typeof ownerId !== "string") {
    return;
  }

  router.goUserPage(ownerId);
}

async function refreshInstance() {
  try {
    worldInstanceRef.value = void 0;

    const user = userRef.value;
    if (user === void 0) {
      return;
    }

    const { locationInfo } = user;
    if (locationInfo.instanceId === void 0) {
      return;
    }

    const { status, data: apiWorldInstance } = await api.fetchWorldInstance(
      locationInfo.location
    );
    if (status !== api.ApiStatusCode.OK || apiWorldInstance === void 0) {
      return;
    }

    worldInstanceRef.value = apiWorldInstance;
    worldLinkRef.value = `https://vrch.at/${apiWorldInstance.shortName ?? ""}`;

    const { ownerId } = apiWorldInstance;
    if (
      typeof ownerId !== "string" ||
      ownerId.length === 0 ||
      ownerId.startsWith("grp_") ||
      api.userMap.has(ownerId)
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

async function onActionMenuCommand(command: string) {
  console.log("onActionMenuCommand", command);
  try {
    const user = userRef.value;
    if (user === void 0) {
      return;
    }

    switch (command) {
      case "sendFriendRequest": {
        // eslint-disable-next-line no-alert
        const action = confirm("sendFriendRequest");
        if (!action) {
          break;
        }

        await api.sendFriendRequest(user.id);
        break;
      }

      case "cancelFriendRequest": {
        // eslint-disable-next-line no-alert
        const action = confirm("cancelFriendRequest");
        if (!action) {
          break;
        }

        await api.cancelFriendRequest(user.id);
        break;
      }

      case "acceptFriendRequest": {
        // eslint-disable-next-line no-alert
        const action = confirm("acceptNotification");
        if (!action) {
          break;
        }

        const notification = api.friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await api.acceptNotification(notification.id);
        break;
      }

      case "declineFriendRequest": {
        // eslint-disable-next-line no-alert
        const action = confirm("hideNotification");
        if (!action) {
          break;
        }

        const notification = api.friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await api.hideNotification(notification.id);
        break;
      }

      case "unfriend": {
        // eslint-disable-next-line no-alert
        const action = confirm("unfriend");
        if (!action) {
          break;
        }

        await api.unfriend(user.id);
        break;
      }

      case "blockUser": {
        // eslint-disable-next-line no-alert
        const action = confirm("blockUser");
        if (!action) {
          break;
        }

        await api.sendPlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Block
        );
        break;
      }

      case "unblockUser": {
        // eslint-disable-next-line no-alert
        const action = confirm("unblockUser");
        if (!action) {
          break;
        }

        await api.deletePlayerModeration(
          user.id,
          api.ApiPlayerModerationType.Block
        );
        break;
      }

      case "muteUser": {
        // eslint-disable-next-line no-alert
        const action = confirm("muteUser");
        if (!action) {
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

      case "unmuteUser": {
        // eslint-disable-next-line no-alert
        const action = confirm("unmuteUser");
        if (!action) {
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

      case "hideAvatar": {
        // eslint-disable-next-line no-alert
        const action = confirm("hideAvatar");
        if (!action) {
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

      case "showAvatar": {
        // eslint-disable-next-line no-alert
        const action = confirm("showAvatar");
        if (!action) {
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

      case "sendRequestInvite": {
        // eslint-disable-next-line no-alert
        const action = confirm("sendRequestInvite");
        if (!action) {
          break;
        }

        await api.sendRequestInvite(user.id, {
          platform: api.ApiPlatform.UnknownPlatform,
        });
        break;
      }

      case "sendInvite": {
        const summary = log.summary.value;
        if (summary === void 0) {
          break;
        }

        const { location } = summary;
        const locationInfo = api.parseLocation(location);
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        const action = confirm(`sendInvite: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        await api.sendInvite(user.id, {
          instanceId: location,
          worldId: location,
        });
        break;
      }

      case "sendInviteMe": {
        const { locationInfo } = user;
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        const action = confirm(`sendInviteMe: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        await api.inviteMe(locationInfo.location);
        break;
      }

      case "playGame": {
        const { locationInfo } = user;
        if (locationInfo.instanceId === void 0) {
          break;
        }

        // eslint-disable-next-line no-alert
        const action = confirm(`playGame: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        const response = await api.fetchWorldInstanceShortName(
          locationInfo.location
        );

        await ipcRenderer.invoke(
          "native:playGame",
          `vrchat://launch?id=${locationInfo.location}&shortName=${
            response.data?.secureName ?? ""
          }`
        );
        break;
      }

      case "setNote": {
        const note = prompt("type note", user.apiUser.note);
        if (typeof note !== "string") {
          break;
        }
        await api.saveUserNote(user.id, note);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: api.FavoriteGroup) {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("addFavorite");
    if (!action) {
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

async function removeFavorite() {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("removeFavorite");
    if (!action) {
      return;
    }

    await api.removeFromFavoriteGroup(userIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "UserPage",
  components: {
    Location: VueLocation.default,
  },
  setup() {
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
      removeFavorite,
    };
  },
};
