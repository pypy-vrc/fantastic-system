import * as vue from "vue";
import * as router from "../../router";
import * as api from "../../game/api";
import * as VueLocation from "../location/index.vue";

interface Props {
  favorite: api.Favorite;
}

export default {
  name: "FavoriteListItem",
  props: {
    favorite: Object,
  },
  components: {
    Location: VueLocation.default,
  },
  setup(props: Props) {
    const favoriteRef = vue.computed(() => props.favorite);
    const userRef = vue.computed(() => {
      const { apiFavorite } = favoriteRef.value;

      if (
        apiFavorite.favoriteId === void 0 ||
        apiFavorite.type !== api.ApiFavoriteGroupType.Friend
      ) {
        return;
      }

      return api.userMap.get(apiFavorite.favoriteId);
    });

    return {
      favorite: favoriteRef,
      user: userRef,
      userWorld: vue.computed(() => {
        const user = userRef.value;
        if (user === void 0) {
          return;
        }

        const { worldId } = user.locationInfo;
        if (worldId === void 0) {
          return;
        }

        return api.worldMap.get(worldId);
      }),
      world: vue.computed(() => {
        const { apiFavorite } = favoriteRef.value;

        if (
          apiFavorite.favoriteId === void 0 ||
          apiFavorite.type !== api.ApiFavoriteGroupType.World
        ) {
          return;
        }

        return api.worldMap.get(apiFavorite.favoriteId);
      }),
      avatar: vue.computed(() => {
        const { apiFavorite } = favoriteRef.value;

        if (
          apiFavorite.favoriteId === void 0 ||
          apiFavorite.type !== api.ApiFavoriteGroupType.Avatar
        ) {
          return;
        }

        return api.avatarMap.get(apiFavorite.favoriteId);
      }),
      thumbnailUrl: vue.computed(() => {
        //
      }),
      goUserPage: router.goUserPage,
      goWorldPage: router.goWorldPage,
      goAvatarPage: router.goAvatarPage,
    };
  },
};
