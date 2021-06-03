import * as vue from 'vue';
import {goUserPage, goWorldPage} from '../../router';
import * as api from '../../game/api';
import * as loading from '../loading';

let searchKeywordRef = vue.ref('');
let hasMoreUserRef = vue.ref(false);
let hasMoreWorldRef = vue.ref(false);
let userMap = vue.reactive(new Map<string, api.ApiUser>());
let worldMap = vue.reactive(new Map<string, api.ApiWorld>());

async function searchUser(): Promise<void> {
  loading.increment();

  try {
    let {status, data} = await api.fetchUserList(
      searchKeywordRef.value,
      10,
      userMap.size
    );

    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (let apiUser of data) {
        let {id} = apiUser;
        if (id === void 0) {
          continue;
        }

        userMap.set(id, apiUser);
      }

      hasMoreUserRef.value = data.length === 10;
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function searchWorld(): Promise<void> {
  loading.increment();

  try {
    let {status, data} = await api.fetchWorldList(
      searchKeywordRef.value,
      10,
      worldMap.size
    );

    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (let apiWorld of data) {
        let {id} = apiWorld;
        if (id === void 0) {
          continue;
        }

        worldMap.set(id, apiWorld);
      }

      hasMoreWorldRef.value = data.length === 10;
    }
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

async function searchAll(): Promise<void> {
  let keyword = searchKeywordRef.value;

  if (keyword.startsWith('usr_') === true) {
    goUserPage(keyword);
    return;
  }

  if (keyword.startsWith('wrld_') === true) {
    goWorldPage(keyword);
    return;
  }

  if (keyword.startsWith('avtr_') === true) {
    // avatar
    return;
  }

  if (keyword.startsWith('not_') === true) {
    // notification
    return;
  }

  if (keyword.startsWith('pmod_') === true) {
    // player moderation
    return;
  }

  loading.increment();
  try {
    userMap.clear();
    worldMap.clear();
    await Promise.all([searchUser(), searchWorld()]);
  } catch (err) {
    console.error(err);
  }

  loading.decrement();
}

function reset(): void {
  searchKeywordRef.value = '';
  userMap.clear();
  worldMap.clear();
}

setTimeout(() => {
  window.addEventListener('keydown', (e) => {
    let input = document.getElementById('search-page-search-input');
    if (input === null || document.activeElement === input) {
      return;
    }
    input.focus();
  });
}, 1);

export default {
  name: 'SearchPage',
  setup(): any {
    return {
      searchKeyword: searchKeywordRef,
      hasMoreUser: hasMoreUserRef,
      hasMoreWorld: hasMoreWorldRef,
      userMap,
      worldMap,
      goUserPage,
      goWorldPage,
      searchUser,
      searchWorld,
      searchAll,
      reset
    };
  }
};
