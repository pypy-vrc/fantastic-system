import { computed } from "vue";
import {
  clearAllPlayerModeration,
  deletePlayerModeration,
  playerModerationMap,
  refreshPlayerModeration,
  sendPlayerModeration,
  type ApiPlayerModerationTypeValue,
} from "../../game/api/index.ts";
import VuePlayerModerationListItem from "../player-moderation-list-item/index.vue";

const playerModerationListRef = computed(() => {
  const array = [...playerModerationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll() {
  try {
    const action = confirm("clearAllPlayerModeration");
    if (!action) {
      return;
    }

    await clearAllPlayerModeration();
  } catch (err) {
    console.error(err);
  }
}

async function doSendPlayerModeration(
  moderated: string,
  type: ApiPlayerModerationTypeValue,
) {
  try {
    const action = confirm("sendPlayerModeration");
    if (!action) {
      return;
    }

    await sendPlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

async function doDeletePlayerModeration(
  moderated: string,
  type: ApiPlayerModerationTypeValue,
) {
  try {
    const action = confirm("deletePlayerModeration");
    if (!action) {
      return;
    }

    await deletePlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "PlayerModerationListPage",
  components: {
    PlayerModerationListItem: VuePlayerModerationListItem,
  },
  setup() {
    return {
      playerModerationList: playerModerationListRef,
      refresh: refreshPlayerModeration,
      clearAll,
      sendPlayerModeration: doSendPlayerModeration,
      deletePlayerModeration: doDeletePlayerModeration,
    };
  },
};
