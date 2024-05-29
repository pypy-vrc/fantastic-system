import * as api from "../../game/api";
import * as VueFavoriteListItem from "../favorite-list-item/index.vue";

// const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

export default {
  name: "FavoriteListPage",
  components: {
    FavoriteListItem: VueFavoriteListItem.default,
  },
  setup() {
    return {
      friendFavoriteGroupList: api.friendFavoriteGroupList,
      worldFavoriteGroupList: api.worldFavoriteGroupList,
      avatarFavoriteGroupList: api.avatarFavoriteGroupList,
      refresh: api.refreshFavorite,
    };
  },
};
