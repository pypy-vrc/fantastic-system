import * as vue from 'vue';
import * as util from '../../../../util';
import * as router from '../../router';
import * as api from '../../game/api';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  playerModeration: api.PlayerModeration;
}

async function deletePlayerModeration(
  moderated: string,
  type: api.ApiPlayerModerationType
): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('deletePlayerModeration');
    if (action === false) {
      return;
    }

    await api.deletePlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: 'PlayerModerationListItem',
  props: {
    playerModeration: Object
  },
  components: {},
  setup(props: Props): any {
    let playerModerationRef = vue.computed(() => props.playerModeration);

    return {
      playerModeration: playerModerationRef,
      goUserPage: router.goUserPage,
      formatDate: util.formatDate,
      deletePlayerModeration
    };
  }
};
