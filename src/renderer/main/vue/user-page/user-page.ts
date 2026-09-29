import { computed, ref, watchEffect } from "vue";
import type * as vueRouter from "vue-router";
import { escapeHtml, getDurationString, nop } from "../../../../common/util.ts";
import { subscribe } from "../../../../common/pubsub.ts";
import { goUserPage } from "../../router.ts";
import {
  acceptNotification,
  addToFavoriteGroup,
  ApiFavoriteGroupType,
  ApiPlatform,
  ApiPlayerModerationType,
  ApiStatusCode,
  cancelFriendRequest,
  deletePlayerModeration,
  favoriteMap,
  fetchFriendStatus,
  fetchUser,
  fetchWorldInstance,
  fetchWorldInstanceShortName,
  friendFavoriteGroupList,
  friendRequestMap,
  hideNotification,
  inviteMe,
  parseLocation,
  playerModerationMap,
  removeFromFavoriteGroup,
  saveUserNote,
  sendFriendRequest,
  sendInvite,
  sendPlayerModeration,
  sendRequestInvite,
  unfriend,
  userMap,
  worldMap,
  type ApiWorldInstance,
  type FavoriteGroup,
} from "../../game/api/index.ts";
import { logContext } from "../../game/log.ts";
import { now } from "../clock.ts";
import VueLocation from "../location/index.vue";

const { ipcRenderer } = window;

const userIdRef = ref("");
const worldInstanceRef = ref<ApiWorldInstance | undefined>(void 0);
const worldLinkRef = ref("");

const userRef = computed(() => {
  console.log("UserPage:userRef", userIdRef.value);
  return userMap.get(userIdRef.value);
});

const bioRef = computed(() =>
  escapeHtml(userRef.value?.apiUser.bio || "").replace(/\n/g, "<br>"),
);

const worldRef = computed(() => {
  console.log("UserPage:worldRef", userIdRef.value);

  const user = userRef.value;
  if (user === void 0) {
    return;
  }

  const { worldId } = user.locationInfo;
  if (worldId === void 0) {
    return;
  }

  return worldMap.get(worldId);
});

const friendRequestRef = computed(() => {
  return friendRequestMap.get(userIdRef.value);
});

const playerModerationRef = computed(() => {
  console.log("UserPage:playerModerationRef", userIdRef.value);
  return playerModerationMap.get(userIdRef.value);
});

const favoriteRef = computed(() => {
  console.log("UserPage:favoriteRef", userIdRef.value);
  return favoriteMap.get(userIdRef.value);
});

const instanceDurationRef = computed(() => {
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

  return getDurationString(Math.floor(time / 1000));
});

const instanceOwnerRef = computed(() => {
  console.log("UserPage:instanceOwnerRef");

  const worldInstance = worldInstanceRef.value;
  if (worldInstance === void 0) {
    return;
  }

  const { ownerId } = worldInstance;
  if (typeof ownerId !== "string") {
    return;
  }

  return userMap.get(ownerId);
});

subscribe(
  "router:after-each",
  ({ name, params }: vueRouter.RouteLocationNormalized) => {
    if (name !== "user-page") {
      return;
    }

    const userId = params.id as string;
    console.log("UserPage", userId);
    setUserId(userId).catch(nop);
  },
);

async function setUserId(userId: string) {
  if (userIdRef.value === userId && userMap.has(userId)) {
    return;
  }

  userIdRef.value = userId;

  try {
    await fetchUser(userId);
    await fetchFriendStatus(userId);
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

  goUserPage(ownerId);
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

    const { status, data: apiWorldInstance } = await fetchWorldInstance(
      locationInfo.location,
    );
    if (status !== ApiStatusCode.OK || apiWorldInstance === void 0) {
      return;
    }

    worldInstanceRef.value = apiWorldInstance;
    worldLinkRef.value = `https://vrch.at/${apiWorldInstance.shortName || ""}`;

    const { ownerId } = apiWorldInstance;
    if (
      typeof ownerId !== "string" ||
      ownerId.length === 0 ||
      ownerId.startsWith("grp_") ||
      userMap.has(ownerId)
    ) {
      return;
    }

    await fetchUser(ownerId);
  } catch (err) {
    console.error(err);
  }
}

watchEffect(() => {
  refreshInstance().catch(nop);
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
        const action = confirm("sendFriendRequest");
        if (!action) {
          break;
        }

        await sendFriendRequest(user.id);
        break;
      }

      case "cancelFriendRequest": {
        const action = confirm("cancelFriendRequest");
        if (!action) {
          break;
        }

        await cancelFriendRequest(user.id);
        break;
      }

      case "acceptFriendRequest": {
        const action = confirm("acceptNotification");
        if (!action) {
          break;
        }

        const notification = friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await acceptNotification(notification.id);
        break;
      }

      case "declineFriendRequest": {
        const action = confirm("hideNotification");
        if (!action) {
          break;
        }

        const notification = friendRequestMap.get(user.id);
        if (notification === void 0) {
          break;
        }

        await hideNotification(notification.id);
        break;
      }

      case "unfriend": {
        const action = confirm("unfriend");
        if (!action) {
          break;
        }

        await unfriend(user.id);
        break;
      }

      case "blockUser": {
        const action = confirm("blockUser");
        if (!action) {
          break;
        }

        await sendPlayerModeration(user.id, ApiPlayerModerationType.Block);
        break;
      }

      case "unblockUser": {
        const action = confirm("unblockUser");
        if (!action) {
          break;
        }

        await deletePlayerModeration(user.id, ApiPlayerModerationType.Block);
        break;
      }

      case "muteUser": {
        const action = confirm("muteUser");
        if (!action) {
          break;
        }

        await sendPlayerModeration(user.id, ApiPlayerModerationType.Mute);
        await deletePlayerModeration(user.id, ApiPlayerModerationType.Unmute);
        break;
      }

      case "unmuteUser": {
        const action = confirm("unmuteUser");
        if (!action) {
          break;
        }

        await sendPlayerModeration(user.id, ApiPlayerModerationType.Unmute);
        await deletePlayerModeration(user.id, ApiPlayerModerationType.Mute);
        break;
      }

      case "hideAvatar": {
        const action = confirm("hideAvatar");
        if (!action) {
          break;
        }

        await sendPlayerModeration(user.id, ApiPlayerModerationType.HideAvatar);
        await deletePlayerModeration(
          user.id,
          ApiPlayerModerationType.ShowAvatar,
        );
        break;
      }

      case "showAvatar": {
        const action = confirm("showAvatar");
        if (!action) {
          break;
        }

        await sendPlayerModeration(user.id, ApiPlayerModerationType.ShowAvatar);
        await deletePlayerModeration(
          user.id,
          ApiPlayerModerationType.HideAvatar,
        );
        break;
      }

      case "sendRequestInvite": {
        const action = confirm("sendRequestInvite");
        if (!action) {
          break;
        }

        await sendRequestInvite(user.id, {
          platform: ApiPlatform.UnknownPlatform,
        });
        break;
      }

      case "sendInvite": {
        const summary = logContext.value;
        if (summary === void 0) {
          break;
        }

        const { location } = summary;
        const locationInfo = parseLocation(location);
        if (locationInfo.instanceId === void 0) {
          break;
        }

        const action = confirm(`sendInvite: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        await sendInvite(user.id, {
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

        const action = confirm(`sendInviteMe: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        await inviteMe(locationInfo.location);
        break;
      }

      case "playGame": {
        const { locationInfo } = user;
        if (locationInfo.instanceId === void 0) {
          break;
        }

        const action = confirm(`playGame: ${locationInfo.location}`);
        if (!action) {
          break;
        }

        const response = await fetchWorldInstanceShortName(
          locationInfo.location,
        );

        await ipcRenderer.invoke(
          "native:playGame",
          `vrchat://launch?id=${locationInfo.location}&shortName=${
            response.data?.secureName || ""
          }`,
        );
        break;
      }

      case "setNote": {
        const note = prompt("type note", user.apiUser.note);
        if (typeof note !== "string") {
          break;
        }
        await saveUserNote(user.id, note);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: FavoriteGroup) {
  try {
    const action = confirm("addFavorite");
    if (!action) {
      return;
    }

    await addToFavoriteGroup(
      ApiFavoriteGroupType.Friend,
      userIdRef.value,
      favoriteGroup.apiFavoriteGroup.name,
    );
  } catch (err) {
    console.error(err);
  }
}

async function removeFavorite() {
  try {
    const action = confirm("removeFavorite");
    if (!action) {
      return;
    }

    await removeFromFavoriteGroup(userIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "UserPage",
  components: {
    Location: VueLocation,
  },
  setup() {
    // let {params} = router.useRoute();

    // let userId = params.id as string;
    // console.log('UserPage', userId);
    // setUserId(userId);

    return {
      friendFavoriteGroupList: friendFavoriteGroupList,
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
