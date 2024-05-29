import * as vue from "vue";
import { goUserPage, goWorldPage } from "../../router";
import * as api from "../../game/api";
import * as loading from "../loading";

const searchKeywordRef = vue.ref("");
const hasMoreUserRef = vue.ref(false);
const hasMoreWorldRef = vue.ref(false);
const userMap = vue.reactive(new Map<string, api.ApiUser>());
const worldMap = vue.reactive(new Map<string, api.ApiWorld>());

async function searchUser() {
  loading.increment();

  try {
    const { status, data } = await api.fetchUserList(
      searchKeywordRef.value,
      10,
      userMap.size
    );

    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (const apiUser of data) {
        const { id } = apiUser;
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

async function searchWorld() {
  loading.increment();

  try {
    const { status, data } = await api.fetchWorldList(
      searchKeywordRef.value,
      10,
      worldMap.size
    );

    if (status === api.ApiStatusCode.OK && data !== void 0) {
      for (const apiWorld of data) {
        const { id } = apiWorld;
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

async function searchAll() {
  const keyword = searchKeywordRef.value;

  if (keyword.startsWith("usr_")) {
    goUserPage(keyword);
    return;
  }

  if (keyword.startsWith("wrld_")) {
    goWorldPage(keyword);
    return;
  }

  if (keyword.startsWith("avtr_")) {
    // avatar
    return;
  }

  if (keyword.startsWith("not_")) {
    // notification
    return;
  }

  if (keyword.startsWith("pmod_")) {
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

function reset() {
  searchKeywordRef.value = "";
  userMap.clear();
  worldMap.clear();
}

export default {
  name: "SearchPage",
  setup() {
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
      reset,
    };
  },
};
