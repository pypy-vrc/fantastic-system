import { reactive } from "vue";
import { subscribe } from "../../../../../common/pubsub.ts";
import {
  ApiStatusCode,
  type ApiSuccess,
  type DateTimeString,
} from "../base.ts";
import { api, ApiRequestMethod } from "../internal.ts";

export const ApiPlayerModerationType = {
  Block: "block",
  Mute: "mute",
  Unmute: "unmute",
  HideAvatar: "hideAvatar",
  ShowAvatar: "showAvatar",
};

export type ApiPlayerModerationTypeValue =
  (typeof ApiPlayerModerationType)[keyof typeof ApiPlayerModerationType];

export type ApiPlayerModeration = {
  id?: string;
  type?: ApiPlayerModerationTypeValue;
  sourceUserId?: string;
  sourceDisplayName?: string;
  targetUserId?: string;
  targetDisplayName?: string;
  created?: DateTimeString;
};

export type PlayerModeration = {
  targetUserId: string;
  time: number;
  typeMap: Map<string, ApiPlayerModeration>;
};

export const playerModerationMap = reactive(
  new Map<string, PlayerModeration>(),
);

subscribe("api:login", () => {
  playerModerationMap.clear();
});

export function applyPlayerModeration(
  apiPlayerModeration: ApiPlayerModeration,
) {
  const { type, targetUserId, created } = apiPlayerModeration;
  if (type === void 0 || targetUserId === void 0) {
    return;
  }

  let playerModeration = playerModerationMap.get(targetUserId);
  if (playerModeration === void 0) {
    playerModeration = reactive<PlayerModeration>({
      targetUserId,
      time: 0,
      typeMap: reactive(new Map<string, ApiPlayerModeration>()),
    });
    playerModerationMap.set(targetUserId, playerModeration);
  }

  if (created !== void 0) {
    playerModeration.time = new Date(created).getTime();
  }

  playerModeration.typeMap.set(type, reactive(apiPlayerModeration));
}

export function fetchPlayerModerationList() {
  return api<ApiPlayerModeration[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/playermoderations",
  });
}

export async function clearAllPlayerModeration() {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.DELETE,
    path: "auth/user/playermoderations",
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    playerModerationMap.clear();
  }

  return response;
}

export async function sendPlayerModeration(
  moderated: string,
  type: ApiPlayerModerationTypeValue,
) {
  const response = await api<ApiPlayerModeration>({
    method: ApiRequestMethod.POST,
    path: "auth/user/playermoderations",
    body: {
      moderated,
      type,
    },
  });

  const { status, data: apiPlayerModeration } = response;
  if (status === ApiStatusCode.OK && apiPlayerModeration !== void 0) {
    applyPlayerModeration(apiPlayerModeration);
  }

  return response;
}

export async function deletePlayerModeration(
  moderated: string,
  type: ApiPlayerModerationTypeValue,
) {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: "auth/user/unplayermoderate",
    body: {
      moderated,
      type,
    },
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    const playerModeration = playerModerationMap.get(moderated);
    if (playerModeration !== void 0) {
      playerModeration.typeMap.delete(type);
      if (playerModeration.typeMap.size === 0) {
        playerModerationMap.delete(moderated);
      }
    }
  }

  return response;
}

export async function syncPlayerModerationInternal() {
  const { status, data } = await fetchPlayerModerationList();
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  playerModerationMap.clear();

  for (const apiPlayerModeration of data) {
    applyPlayerModeration(apiPlayerModeration);
  }

  return true;
}
