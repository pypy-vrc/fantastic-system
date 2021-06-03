import * as vue from 'vue';
import * as router from '../../router';
import * as api from '../../game/api';

interface Props {
  favorite: api.Favorite;
}

export default {
  name: 'FavoriteListItem',
  props: {
    favorite: Object
  },
  components: {
    Location: require('../location').default
  },
  setup(props: Props): any {
    let favoriteRef = vue.computed(() => props.favorite);
    let userRef = vue.computed(() => {
      let {apiFavorite} = favoriteRef.value;

      if (apiFavorite.type !== api.ApiFavoriteGroupType.Friend) {
        return;
      }

      return api.userMap.get(apiFavorite.favoriteId!);
    });

    return {
      favorite: favoriteRef,
      user: userRef,
      userWorld: vue.computed(() => {
        let user = userRef.value;
        if (user === void 0) {
          return;
        }

        let {worldId} = user.locationInfo;
        if (worldId === void 0) {
          return;
        }

        return api.worldMap.get(worldId);
      }),
      world: vue.computed(() => {
        let {apiFavorite} = favoriteRef.value;

        if (apiFavorite.type !== api.ApiFavoriteGroupType.World) {
          return;
        }

        return api.worldMap.get(apiFavorite.favoriteId!);
      }),
      avatar: vue.computed(() => {
        let {apiFavorite} = favoriteRef.value;

        if (apiFavorite.type !== api.ApiFavoriteGroupType.Avatar) {
          return;
        }

        return api.avatarMap.get(apiFavorite.favoriteId!);
      }),
      thumbnailUrl: vue.computed(() => {}),
      goUserPage: router.goUserPage,
      goWorldPage: router.goWorldPage,
      goAvatarPage: router.goAvatarPage
    };
  }
};
