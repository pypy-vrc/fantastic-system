import { reactive, ref } from "vue";
import { goUserPage, goWorldPage } from "../../router.ts";
import {
  ApiStatusCode,
  fetchUserList,
  fetchWorldList,
  type ApiUser,
  type ApiWorld,
} from "../../game/api/index.ts";
import { decrementLoading, incrementLoading } from "../loading.ts";

const searchKeywordRef = ref("");
const hasMoreUserRef = ref(false);
const hasMoreWorldRef = ref(false);
const userMap = reactive(new Map<string, ApiUser>());
const worldMap = reactive(new Map<string, ApiWorld>());

async function searchUser() {
  incrementLoading();

  try {
    const { status, data } = await fetchUserList(
      searchKeywordRef.value,
      10,
      userMap.size,
    );

    if (status === ApiStatusCode.OK && data !== void 0) {
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

  decrementLoading();
}

async function searchWorld() {
  incrementLoading();

  try {
    const { status, data } = await fetchWorldList(
      searchKeywordRef.value,
      10,
      worldMap.size,
    );

    if (status === ApiStatusCode.OK && data !== void 0) {
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

  decrementLoading();
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

  incrementLoading();
  try {
    userMap.clear();
    worldMap.clear();
    await Promise.all([searchUser(), searchWorld()]);
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
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
