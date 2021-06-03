import * as vue from "vue";
import * as util from "../../../../common/util";
import * as router from "../../router";
import * as api from "../../game/api";

// const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  playerModeration: api.PlayerModeration;
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
  name: "PlayerModerationListItem",
  props: {
    playerModeration: Object,
  },
  components: {},
  setup(props: Props) {
    const playerModerationRef = vue.computed(() => props.playerModeration);

    return {
      playerModeration: playerModerationRef,
      goUserPage: router.goUserPage,
      formatDate: util.formatDate,
      deletePlayerModeration,
    };
  },
};
