import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import type { ApiSuccess, DateTimeString } from "../base";
import { ApiStatusCode } from "../base";
import { api, ApiRequestMethod } from "../internal";

export const enum ApiPlayerModerationType {
  Block = "block",
  Mute = "mute",
  Unmute = "unmute",
  HideAvatar = "hideAvatar",
  ShowAvatar = "showAvatar",
}

export interface ApiPlayerModeration {
  id?: string;
  type?: ApiPlayerModerationType;
  sourceUserId?: string;
  sourceDisplayName?: string;
  targetUserId?: string;
  targetDisplayName?: string;
  created?: DateTimeString;
}

export interface PlayerModeration {
  targetUserId: string;
  time: number;
  typeMap: Map<string, ApiPlayerModeration>;
}

export const playerModerationMap = vue.reactive(
  new Map<string, PlayerModeration>()
);

pubsub.subscribe("api:login", () => {
  playerModerationMap.clear();
});

export function applyPlayerModeration(
  apiPlayerModeration: ApiPlayerModeration
) {
  const { type, targetUserId, created } = apiPlayerModeration;
  if (type === void 0 || targetUserId === void 0) {
    return;
  }

  let playerModeration = playerModerationMap.get(targetUserId);
  if (playerModeration === void 0) {
    playerModeration = vue.reactive<PlayerModeration>({
      targetUserId,
      time: 0,
      typeMap: vue.reactive(new Map<string, ApiPlayerModeration>()),
    });
    playerModerationMap.set(targetUserId, playerModeration);
  }

  if (created !== void 0) {
    playerModeration.time = new Date(created).getTime();
  }

  playerModeration.typeMap.set(type, vue.reactive(apiPlayerModeration));
}

export async function fetchPlayerModerationList() {
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
  type: ApiPlayerModerationType
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
  type: ApiPlayerModerationType
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
