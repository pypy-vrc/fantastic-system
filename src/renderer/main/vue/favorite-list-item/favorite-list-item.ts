import { computed } from "vue";
import { goAvatarPage, goUserPage, goWorldPage } from "../../router.ts";
import {
  ApiFavoriteGroupType,
  avatarMap,
  userMap,
  worldMap,
  type Favorite,
} from "../../game/api/index.ts";
import VueLocation from "../location/index.vue";

type Props = {
  favorite: Favorite;
};

export default {
  name: "FavoriteListItem",
  props: {
    favorite: Object,
  },
  components: {
    Location: VueLocation,
  },
  setup(props: Props) {
    const favoriteRef = computed(() => props.favorite);
    const userRef = computed(() => {
      const { apiFavorite } = favoriteRef.value;

      if (
        apiFavorite.favoriteId === void 0 ||
        apiFavorite.type !== ApiFavoriteGroupType.Friend
      ) {
        return;
      }

      return userMap.get(apiFavorite.favoriteId);
    });

    return {
      favorite: favoriteRef,
      user: userRef,
      userWorld: computed(() => {
        const user = userRef.value;
        if (user === void 0) {
          return;
        }

        const { worldId } = user.locationInfo;
        if (worldId === void 0) {
          return;
        }

        return worldMap.get(worldId);
      }),
      world: computed(() => {
        const { apiFavorite } = favoriteRef.value;

        if (
          apiFavorite.favoriteId === void 0 ||
          apiFavorite.type !== ApiFavoriteGroupType.World
        ) {
          return;
        }

        return worldMap.get(apiFavorite.favoriteId);
      }),
      avatar: computed(() => {
        const { apiFavorite } = favoriteRef.value;

        if (
          apiFavorite.favoriteId === void 0 ||
          apiFavorite.type !== ApiFavoriteGroupType.Avatar
        ) {
          return;
        }

        return avatarMap.get(apiFavorite.favoriteId);
      }),
      thumbnailUrl: computed(() => {
        //
      }),
      goUserPage: goUserPage,
      goWorldPage: goWorldPage,
      goAvatarPage: goAvatarPage,
    };
  },
};
