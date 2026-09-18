import {
  avatarFavoriteGroupList,
  friendFavoriteGroupList,
  refreshFavorite,
  worldFavoriteGroupList,
} from "../../game/api/index.ts";
import VueFavoriteListItem from "../favorite-list-item/index.vue";

export default {
  name: "FavoriteListPage",
  components: {
    FavoriteListItem: VueFavoriteListItem,
  },
  setup() {
    return {
      friendFavoriteGroupList: friendFavoriteGroupList,
      worldFavoriteGroupList: worldFavoriteGroupList,
      avatarFavoriteGroupList: avatarFavoriteGroupList,
      refresh: refreshFavorite,
    };
  },
};
