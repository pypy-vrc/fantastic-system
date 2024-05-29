import * as vue from "vue";
import type * as vueRouter from "vue-router";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import * as router from "../../router";
import * as api from "../../game/api";

const avatarIdRef = vue.ref("");

const avatarRef = vue.computed(() => {
  console.log("AvatarPage:worldRef", avatarIdRef.value);
  return api.avatarMap.get(avatarIdRef.value);
});

const favoriteRef = vue.computed(() => {
  console.log("AvatarPage:favoriteRef", avatarIdRef.value);
  return api.favoriteMap.get(avatarIdRef.value);
});

pubsub.subscribe(
  "router:after-each",
  ({ name, params }: vueRouter.RouteLocationNormalized) => {
    if (name !== "avatar-page") {
      return;
    }

    const avatarId = params.id as string;
    console.log("AvatarPage", avatarId);
    setAvatarId(avatarId).catch(util.nop);
  }
);

async function setAvatarId(avatarId: string) {
  if (avatarIdRef.value === avatarId && api.avatarMap.has(avatarId)) {
    return;
  }

  avatarIdRef.value = avatarId;

  try {
    await api.fetchAvatar(avatarId);
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
      api.ApiFavoriteGroupType.Avatar,
      avatarIdRef.value,
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

    await api.removeFromFavoriteGroup(avatarIdRef.value);
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
      avatarFavoriteGroupList: api.avatarFavoriteGroupList,
      avatarId: avatarIdRef,
      avatar: avatarRef,
      favorite: favoriteRef,
      goUserPage: router.goUserPage,
      addFavorite,
      removeFavorite,
    };
  },
};
