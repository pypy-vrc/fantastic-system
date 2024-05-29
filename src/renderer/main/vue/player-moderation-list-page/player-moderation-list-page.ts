import * as vue from "vue";
import * as api from "../../game/api";
import * as VuePlayerModerationListItem from "../player-moderation-list-item/index.vue";

const playerModerationListRef = vue.computed(() => {
  const array = [...api.playerModerationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll() {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("clearAllPlayerModeration");
    if (!action) {
      return;
    }

    await api.clearAllPlayerModeration();
  } catch (err) {
    console.error(err);
  }
}

async function sendPlayerModeration(
  moderated: string,
  type: api.ApiPlayerModerationType
) {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("sendPlayerModeration");
    if (!action) {
      return;
    }

    await api.sendPlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

async function deletePlayerModeration(
  moderated: string,
  type: api.ApiPlayerModerationType
) {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("deletePlayerModeration");
    if (!action) {
      return;
    }

    await api.deletePlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "PlayerModerationListPage",
  components: {
    PlayerModerationListItem: VuePlayerModerationListItem.default,
  },
  setup() {
    return {
      playerModerationList: playerModerationListRef,
      refresh: api.refreshPlayerModeration,
      clearAll,
      sendPlayerModeration,
      deletePlayerModeration,
    };
  },
};
