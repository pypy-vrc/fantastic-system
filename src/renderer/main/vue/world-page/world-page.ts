import * as vue from "vue";
import type * as vueRouter from "vue-router";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import * as router from "../../router";
import * as api from "../../game/api";
import * as VueLocation from "../location/index.vue";

const worldIdRef = vue.ref("");

const worldRef = vue.computed(() => {
  console.log("WorldPage:worldRef", worldIdRef.value);
  return api.worldMap.get(worldIdRef.value);
});

const favoriteRef = vue.computed(() => {
  console.log("WorldPage:favoriteRef", worldIdRef.value);
  return api.favoriteMap.get(worldIdRef.value);
});

pubsub.subscribe(
  "router:after-each",
  ({ name, params }: vueRouter.RouteLocationNormalized) => {
    if (name !== "world-page") {
      return;
    }

    const worldId = params.id as string;
    console.log("WorldPage", worldId);
    setWorldId(worldId).catch(util.nop);
  }
);

async function setWorldId(worldId: string) {
  if (worldIdRef.value === worldId && api.worldMap.has(worldId)) {
    return;
  }

  worldIdRef.value = worldId;

  try {
    await api.fetchWorld(worldId);
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: api.FavoriteGroup) {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("addFavorite");
    if (!action) {
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

async function removeFavorite() {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("removeFavorite");
    if (!action) {
      return;
    }

    await api.removeFromFavoriteGroup(worldIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "WorldPage",
  components: {
    Location: VueLocation.default,
  },
  setup() {
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
      removeFavorite,
    };
  },
};
