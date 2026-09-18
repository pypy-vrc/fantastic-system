import { computed, ref } from "vue";
import { getDurationString } from "../../../../common/util.ts";
import { instanceLogRows, logContext } from "../../game/log.ts";
import {
  ApiStatusCode,
  fetchUserList,
  fetchWorldInstanceShortName,
  inviteMe,
  parseLocation,
  userMap,
} from "../../game/api/index.ts";
import { goUserPage } from "../../router.ts";
import { decrementLoading, incrementLoading } from "../loading.ts";
import { now } from "../clock.ts";
import VueLocation from "../location/index.vue";
import VueGameLogListItem from "../game-log-list-item/index.vue";

const { ipcRenderer } = window;

const pageSize = ref(100);
const currentPage = ref(1);

const gameDurationRef = computed(() => {
  const summary = logContext.value;
  if (summary === void 0) {
    return "";
  }

  const { gameStartTime, roomLeaveTime, isInRoom } = summary;
  if (gameStartTime === 0) {
    return "";
  }

  const time =
    (isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime) - gameStartTime;
  if (time < 0) {
    return "";
  }

  return getDurationString(time);
});

const roomDurationRef = computed(() => {
  const summary = logContext.value;
  if (summary === void 0) {
    return "";
  }

  const { roomJoinTime, roomLeaveTime, isInRoom } = summary;
  if (roomJoinTime === 0) {
    return "";
  }

  const time =
    (isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime) - roomJoinTime;
  if (time < 0) {
    return "";
  }

  return getDurationString(time);
});

const roomUserListRef = computed(() => {
  const summary = logContext.value;
  if (summary === void 0) {
    return [];
  }

  const { roomLeaveTime, isInRoom, roomUserMap } = summary;

  const time = isInRoom ? Math.floor(now.value / 1000) : roomLeaveTime;

  const roomUsers = [];
  for (const [displayName, joinTime] of roomUserMap) {
    roomUsers.push([displayName, time - joinTime]);
  }

  return roomUsers;
});

async function clickUser(targetDisplayName: string) {
  for (const user of userMap.values()) {
    if (user.apiUser.displayName === targetDisplayName) {
      goUserPage(user.id);
      return;
    }
  }

  incrementLoading();

  try {
    const { status, data } = await fetchUserList(targetDisplayName, 50, 0);
    if (status === ApiStatusCode.OK && data !== void 0) {
      for (const apiUser of data) {
        const { id, displayName } = apiUser;
        if (id === void 0 || displayName === void 0) {
          continue;
        }

        if (displayName === targetDisplayName) {
          goUserPage(id);
          break;
        }
      }
    }
  } catch (err) {
    console.error(err);
  }

  decrementLoading();
}

async function sendInviteMe(location: string, worldName: string) {
  try {
    const locationInfo = parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    const action = confirm(`sendInviteMe: ${location}`);
    if (!action) {
      return;
    }

    await inviteMe(location);
  } catch (err) {
    console.error(err);
  }
}

async function playGame(location: string, worldName: string) {
  try {
    const locationInfo = parseLocation(location);
    if (locationInfo.instanceId === void 0) {
      return;
    }

    const action = confirm(`playGame: ${location}`);
    if (!action) {
      return;
    }

    const response = await fetchWorldInstanceShortName(location);

    await ipcRenderer.invoke(
      "native:playGame",
      `vrchat://launch?id=${location}&shortName=${
        response.data?.secureName || ""
      }`,
    );
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "GameLogListPage",
  components: {
    Location: VueLocation,
    GameLogListItem: VueGameLogListItem,
  },
  setup() {
    return {
      pageSize,
      currentPage,
      gameLogList: instanceLogRows,
      summary: logContext,
      gameDuration: gameDurationRef,
      roomDuration: roomDurationRef,
      roomUserList: roomUserListRef,
      getDurationString: getDurationString,
      clickUser,
      sendInviteMe,
      playGame,
    };
  },
};
