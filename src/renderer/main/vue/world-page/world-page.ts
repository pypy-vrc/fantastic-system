import { computed, ref } from "vue";
import type { RouteLocationNormalized } from "vue-router";
import { nop } from "../../../../common/util.ts";
import { subscribe } from "../../../../common/pubsub.ts";
import { goUserPage } from "../../router.ts";
import {
  addToFavoriteGroup,
  ApiFavoriteGroupType,
  favoriteMap,
  fetchWorld,
  removeFromFavoriteGroup,
  worldFavoriteGroupList,
  worldMap,
  type FavoriteGroup,
} from "../../game/api/index.ts";
import VueLocation from "../location/index.vue";

const worldIdRef = ref("");

const worldRef = computed(() => {
  console.log("WorldPage:worldRef", worldIdRef.value);
  return worldMap.get(worldIdRef.value);
});

const favoriteRef = computed(() => {
  console.log("WorldPage:favoriteRef", worldIdRef.value);
  return favoriteMap.get(worldIdRef.value);
});

subscribe("router:after-each", ({ name, params }: RouteLocationNormalized) => {
  if (name !== "world-page") {
    return;
  }

  const worldId = params.id as string;
  console.log("WorldPage", worldId);
  setWorldId(worldId).catch(nop);
});

async function setWorldId(worldId: string) {
  if (worldIdRef.value === worldId && worldMap.has(worldId)) {
    return;
  }

  worldIdRef.value = worldId;

  try {
    await fetchWorld(worldId);
  } catch (err) {
    console.error(err);
  }
}

async function addFavorite(favoriteGroup: FavoriteGroup) {
  try {
    const action = confirm("addFavorite");
    if (!action) {
      return;
    }

    await addToFavoriteGroup(
      ApiFavoriteGroupType.World,
      worldIdRef.value,
      favoriteGroup.apiFavoriteGroup.name,
    );
  } catch (err) {
    console.error(err);
  }
}

async function removeFavorite() {
  try {
    const action = confirm("removeFavorite");
    if (!action) {
      return;
    }

    await removeFromFavoriteGroup(worldIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "WorldPage",
  components: {
    Location: VueLocation,
  },
  setup() {
    // let {params} = router.useRoute();

    // let worldId = params.id as string;
    // console.log('WorldPage', worldId);
    // setWorldId(worldId);

    return {
      worldFavoriteGroupList: worldFavoriteGroupList,
      worldId: worldIdRef,
      world: worldRef,
      favorite: favoriteRef,
      goUserPage: goUserPage,
      addFavorite,
      removeFavorite,
    };
  },
};
