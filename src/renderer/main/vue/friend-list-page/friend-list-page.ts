import * as vue from 'vue';
import {goUserPage} from '../../router';
import * as api from '../../game/api';

let searchKeywordRef = vue.ref('');
let isFavoriteRef = vue.ref(false);

let loginUserRef = vue.computed(() => {
  // console.log('computed loginUser');
  return api.userMap.get(api.loginUser.id);
});

let onlineFriendListRef = vue.computed(() => {
  // console.log('computed onlineFriends');
  let array = searchKeywordFilter(api.onlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

let privateFriendListRef = vue.computed(() => {
  // console.log('computed privateFriends');
  let array = searchKeywordFilter(api.privateFriendSet);
  array.sort(sortFriendList);
  return array;
});

let activeFriendListRef = vue.computed(() => {
  // console.log('computed activeFriends');
  let array = searchKeywordFilter(api.activeFriendSet);
  array.sort(sortFriendList);
  return array;
});

let offlineFriendListRef = vue.computed(() => {
  // console.log('computed offlineFriends');
  let array = searchKeywordFilter(api.offlineFriendSet);
  array.sort(sortFriendList);
  return array;
});

function sortFriendList(a: api.User, b: api.User): number {
  return b.activityTime - a.activityTime;
}

function searchKeywordFilter(userSet: Set<api.User>): api.User[] {
  let {favoriteMap} = api;
  let keyword = searchKeywordRef.value.replace(/\s+/g, '').toUpperCase();
  let isFavorite = isFavoriteRef.value;
  let array = [] as api.User[];

  if (keyword.length === 0) {
    if (isFavorite === false) {
      return [...userSet];
    }

    for (let user of userSet) {
      if (favoriteMap.has(user.id) === false) {
        continue;
      }

      array.push(user);
    }

    return array;
  }

  for (let user of userSet) {
    if (isFavorite === true && favoriteMap.has(user.id) === false) {
      continue;
    }

    let {username, displayName} = user.apiUser;

    if (
      username?.replace(/\s+/g, '').toUpperCase().includes(keyword) === true ||
      displayName?.replace(/\s+/g, '').toUpperCase().includes(keyword) === true
    ) {
      array.push(user);
    }
  }

  return array;
}

setTimeout(() => {
  window.addEventListener('keydown', (e) => {
    let input = document.getElementById('friend-list-page-search-input');
    if (input === null || document.activeElement === input) {
      return;
    }
    input.focus();
  });
}, 1);

export default {
  name: 'FriendListPage',
  components: {
    Location: require('../location').default,
    FriendListItem: require('../friend-list-item').default
  },
  setup(): any {
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
      testUserDialog(): void {
        goUserPage('usr_4f76a584-9d4b-46f6-8209-8305eb683661');
      }
    };
  }
};
