import * as vue from "vue";
import { goUserPage } from "../../router";
import * as api from "../../game/api";
import * as VueLocation from "../location/index.vue";
import * as VueFriendListItem from "../friend-list-item/index.vue";

const searchKeywordRef = vue.ref("");
const isFavoriteRef = vue.ref(false);

const loginUserRef = vue.computed(() => {
  // console.log('computed loginUser');
  return api.userMap.get(api.loginUser.id);
});

const onlineFriendListRef = vue.computed(() => {
  // console.log('computed onlineFriends');
  const array = searchKeywordFilter(api.onlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

const privateFriendListRef = vue.computed(() => {
  // console.log('computed privateFriends');
  const array = searchKeywordFilter(api.privateFriendSet);
  array.sort(sortFriendList);
  return array;
});

const activeFriendListRef = vue.computed(() => {
  // console.log('computed activeFriends');
  const array = searchKeywordFilter(api.activeFriendSet);
  array.sort(sortFriendList);
  return array;
});

const offlineFriendListRef = vue.computed(() => {
  // console.log('computed offlineFriends');
  const array = searchKeywordFilter(api.offlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

function sortFriendList(a: api.User, b: api.User) {
  return b.activityTime - a.activityTime;
}

function searchKeywordFilter(userSet: Set<api.User>) {
  const { favoriteMap } = api;
  const keyword = searchKeywordRef.value.replace(/\s+/g, "").toUpperCase();
  const isFavorite = isFavoriteRef.value;
  const array: api.User[] = [];

  if (keyword.length === 0) {
    if (!isFavorite) {
      return [...userSet];
    }

    for (const user of userSet) {
      if (!favoriteMap.has(user.id)) {
        continue;
      }

      array.push(user);
    }

    return array;
  }

  for (const user of userSet) {
    if (isFavorite && !favoriteMap.has(user.id)) {
      continue;
    }

    const { username, displayName } = user.apiUser;

    if (
      username?.replace(/\s+/g, "").toUpperCase().includes(keyword) ||
      displayName?.replace(/\s+/g, "").toUpperCase().includes(keyword)
    ) {
      array.push(user);
    }
  }

  return array;
}

export default {
  name: "FriendListPage",
  components: {
    Location: VueLocation.default,
    FriendListItem: VueFriendListItem.default,
  },
  setup() {
    return {
      isLoggedIn: api.isLoggedIn,
      loginUser: loginUserRef,
      searchKeyword: searchKeywordRef,
      isFavorite: isFavoriteRef,
      onlineFriendList: onlineFriendListRef,
      privateFriendList: privateFriendListRef,
      activeFriendList: activeFriendListRef,
      offlineFriendList: offlineFriendListRef,
      refresh: api.refreshFriend,
      testUserDialog() {
        goUserPage("usr_4f76a584-9d4b-46f6-8209-8305eb683661");
      },
    };
  },
};
