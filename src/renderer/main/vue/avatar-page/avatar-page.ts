import { computed, ref } from "vue";
import type * as vueRouter from "vue-router";
import { nop } from "../../../../common/util.ts";
import { subscribe } from "../../../../common/pubsub.ts";
import { goUserPage } from "../../router.ts";
import {
  addToFavoriteGroup,
  ApiFavoriteGroupType,
  avatarFavoriteGroupList,
  avatarMap,
  favoriteMap,
  fetchAvatar,
  removeFromFavoriteGroup,
  type FavoriteGroup,
} from "../../game/api/index.ts";

const avatarIdRef = ref("");

const avatarRef = computed(() => {
  console.log("AvatarPage:worldRef", avatarIdRef.value);
  return avatarMap.get(avatarIdRef.value);
});

const favoriteRef = computed(() => {
  console.log("AvatarPage:favoriteRef", avatarIdRef.value);
  return favoriteMap.get(avatarIdRef.value);
});

subscribe(
  "router:after-each",
  ({ name, params }: vueRouter.RouteLocationNormalized) => {
    if (name !== "avatar-page") {
      return;
    }

    const avatarId = params.id as string;
    console.log("AvatarPage", avatarId);
    setAvatarId(avatarId).catch(nop);
  },
);

async function setAvatarId(avatarId: string) {
  if (avatarIdRef.value === avatarId && avatarMap.has(avatarId)) {
    return;
  }

  avatarIdRef.value = avatarId;

  try {
    await fetchAvatar(avatarId);
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
      ApiFavoriteGroupType.Avatar,
      avatarIdRef.value,
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

    await removeFromFavoriteGroup(avatarIdRef.value);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "AvatarPage",
  components: {},
  setup() {
    // var {params} = router.useRoute();

    // var avatarId = params.id as string;
    // console.log('AvatarPage', avatarId);
    // setAvatarId(avatarId);

    return {
      avatarFavoriteGroupList: avatarFavoriteGroupList,
      avatarId: avatarIdRef,
      avatar: avatarRef,
      favorite: favoriteRef,
      goUserPage: goUserPage,
      addFavorite,
      removeFavorite,
    };
  },
};
