import * as vue from 'vue';
import * as api from '../../game/api';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

export default {
  name: 'FavoriteListPage',
  components: {
    FavoriteListItem: require('../favorite-list-item').default
  },
  setup(): any {
    return {
      friendFavoriteGroupList: api.friendFavoriteGroupList,
      worldFavoriteGroupList: api.worldFavoriteGroupList,
      avatarFavoriteGroupList: api.avatarFavoriteGroupList,
      refresh: api.refreshFavorite
    };
  }
};
