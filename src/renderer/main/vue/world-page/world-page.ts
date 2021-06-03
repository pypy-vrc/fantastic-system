import * as vue from 'vue';
import type * as vueRouter from 'vue-router';
import * as util from '../../../../util';
import * as pubsub from '../../../../pubsub';
import * as router from '../../router';
import * as api from '../../game/api';

let worldIdRef = vue.ref('');

let worldRef = vue.computed(() => {
  console.log('WorldPage:worldRef', worldIdRef.value);
  return api.worldMap.get(worldIdRef.value);
});

let favoriteRef = vue.computed(() => {
  console.log('WorldPage:favoriteRef', worldIdRef.value);
  return api.favoriteMap.get(worldIdRef.value);
});

pubsub.subscribe(
  'router:after-each',
  ({name, params}: vueRouter.RouteLocationNormalized) => {
    if (name !== 'world-page') {
      return;
    }

    let worldId = params.id as string;
    console.log('WorldPage', worldId);
    setWorldId(worldId).catch(util.nop);
  }
);

async function setWorldId(worldId: string): Promise<void> {
  if (worldIdRef.value === worldId && api.worldMap.has(worldId) === true) {
    return;
  }

  worldIdRef.value = worldId;

  try {
    await api.fetchWorld(worldId);
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: api.FavoriteGroup): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('addFavorite');
    if (action === false) {
      return;
    }

    await api.addToFavoriteGroup(
      api.ApiFavoriteGroupType.World,
      worldIdRef.value,
      favoriteGroup.apiFavoriteGroup.name
    );
  } catch (err) {
    console.error(err);
  }
}

async function removeFavorite(): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('removeFavorite');
    if (action === false) {
      return;
    }

    await api.removeFromFavoriteGroup(worldIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: 'WorldPage',
  components: {
    Location: require('../location').default
  },
  setup(): any {
    // let {params} = router.useRoute();

    // let worldId = params.id as string;
    // console.log('WorldPage', worldId);
    // setWorldId(worldId);

    return {
      worldFavoriteGroupList: api.worldFavoriteGroupList,
      worldId: worldIdRef,
      world: worldRef,
      favorite: favoriteRef,
      goUserPage: router.goUserPage,
      addFavorite,
      removeFavorite
    };
  }
};
