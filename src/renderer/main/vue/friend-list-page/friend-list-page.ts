import { computed, ref } from "vue";
import { goUserPage } from "../../router.ts";
import {
  activeFriendSet,
  favoriteMap,
  isLoggedIn,
  loginUser,
  offlineFriendSet,
  onlineFriendSet,
  privateFriendSet,
  refreshFriend,
  userMap,
  type User,
} from "../../game/api/index.ts";
import VueLocation from "../location/index.vue";
import VueFriendListItem from "../friend-list-item/index.vue";

const searchKeywordRef = ref("");
const isFavoriteRef = ref(false);

const loginUserRef = computed(() => {
  // console.log('computed loginUser');
  return userMap.get(loginUser.id);
});

const onlineFriendListRef = computed(() => {
  // console.log('computed onlineFriends');
  const array = searchKeywordFilter(onlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

const privateFriendListRef = computed(() => {
  // console.log('computed privateFriends');
  const array = searchKeywordFilter(privateFriendSet);
  array.sort(sortFriendList);
  return array;
});

const activeFriendListRef = computed(() => {
  // console.log('computed activeFriends');
  const array = searchKeywordFilter(activeFriendSet);
  array.sort(sortFriendList);
  return array;
});

const offlineFriendListRef = computed(() => {
  // console.log('computed offlineFriends');
  const array = searchKeywordFilter(offlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

function sortFriendList(a: User, b: User) {
  return b.activityTime - a.activityTime;
}

function searchKeywordFilter(userSet: Set<User>) {
  const keyword = searchKeywordRef.value.replace(/\s+/g, "").toUpperCase();
  const isFavorite = isFavoriteRef.value;
  const array: User[] = [];

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
    Location: VueLocation,
    FriendListItem: VueFriendListItem,
  },
  setup() {
    return {
      isLoggedIn: isLoggedIn,
      loginUser: loginUserRef,
      searchKeyword: searchKeywordRef,
      isFavorite: isFavoriteRef,
      onlineFriendList: onlineFriendListRef,
      privateFriendList: privateFriendListRef,
      activeFriendList: activeFriendListRef,
      offlineFriendList: offlineFriendListRef,
      refresh: refreshFriend,
      testUserDialog() {
        goUserPage("usr_4f76a584-9d4b-46f6-8209-8305eb683661");
      },
    };
  },
};
