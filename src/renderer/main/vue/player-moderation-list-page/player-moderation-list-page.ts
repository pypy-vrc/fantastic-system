import * as vue from 'vue';
import {goUserPage} from '../../router';
import * as api from '../../game/api';

let playerModerationListRef = vue.computed(() => {
  let array = [...api.playerModerationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll(): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('clearAllPlayerModeration');
    if (action === false) {
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
): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('sendPlayerModeration');
    if (action === false) {
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
  name: 'PlayerModerationListPage',
  components: {
    PlayerModerationListItem: require('../player-moderation-list-item').default
  },
  setup(): any {
    return {
      playerModerationList: playerModerationListRef,
      refresh: api.refreshPlayerModeration,
      clearAll,
      sendPlayerModeration,
      deletePlayerModeration
    };
  }
};
