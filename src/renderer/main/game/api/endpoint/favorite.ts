import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import { ApiStatusCode } from "../base";
import { api, ApiRequestMethod } from "../internal";
import { loginUser } from "./auth";
import { syncFavoriteAvatar } from "./avatar";
import { syncFavoriteWorld } from "./world";

// public const int MAX_GROUP_NAME_LENGTH = 24;
// public const int MAX_WORLDS_IN_GROUP = 32;
// public const int MAX_FRIENDS_IN_GROUP = 32;
// public const int MAX_AVATARS_IN_GROUP = 25;
// public const int MAX_FAVORITE_FRIEND_GROUPS = 3;
// public const int MAX_WORLD_PLAYLIST_GROUPS = 4;
// public const int MIN_FAVORITE_AVATAR_GROUPS = 1;
// public const int MAX_FAVORITE_AVATAR_GROUPS = 4;

export const enum ApiFavoriteGroupType {
  Undefiend = "undefined",
  Friend = "friend",
  World = "world",
  Avatar = "avatar",
}

export interface ApiFavorite {
  id?: string;
  type?: ApiFavoriteGroupType;
  favoriteId?: string;
  tags?: string[];
}

export const enum ApiFavoriteGroupVisibility {
  Public = "public",
  Friends = "friends",
  Private = "private",
}

export interface ApiFavoriteGroup {
  id?: string;
  ownerId?: string;
  ownerDisplayName?: string;
  name?: string;
  displayName?: string;
  type?: ApiFavoriteGroupType;
  visibility?: ApiFavoriteGroupVisibility;
  tags?: string[];
}

export interface Favorite {
  objectId: string;
  apiFavorite: ApiFavorite;
  favoriteGroup?: FavoriteGroup;
}

export interface FavoriteGroup {
  type: ApiFavoriteGroupType;
  capacity: number;
  favoriteMap: Map<string, Favorite>;
  apiFavoriteGroup: ApiFavoriteGroup;
}

/** {[objectKey: string]: Favorite} */
export const favoriteMap = vue.reactive(new Map<string, Favorite>());
export const friendFavoriteGroupList = vue.reactive([] as FavoriteGroup[]);
export const worldFavoriteGroupList = vue.reactive([] as FavoriteGroup[]);
export const avatarFavoriteGroupList = vue.reactive([] as FavoriteGroup[]);

pubsub.subscribe("api:login", () => {
  favoriteMap.clear();
  resetFavoriteGroup();
});

export function getFavoriteGroup(type: ApiFavoriteGroupType, name: string) {
  let favoriteGroupList: FavoriteGroup[] | undefined = void 0;

  switch (type) {
    case ApiFavoriteGroupType.Friend:
      favoriteGroupList = friendFavoriteGroupList;
      break;

    case ApiFavoriteGroupType.World:
      favoriteGroupList = worldFavoriteGroupList;
      break;

    case ApiFavoriteGroupType.Avatar:
      favoriteGroupList = avatarFavoriteGroupList;
      break;
  }

  if (favoriteGroupList === void 0) {
    return;
  }

  for (const favoriteGroup of favoriteGroupList) {
    if (favoriteGroup.apiFavoriteGroup.name === name) {
      return favoriteGroup;
    }
  }
}

function applyFavorite(apiFavorite: ApiFavorite) {
  const { type, favoriteId, tags } = apiFavorite;
  if (type === void 0 || favoriteId === void 0 || tags === void 0) {
    return;
  }

  let favorite = favoriteMap.get(favoriteId);
  if (favorite === void 0) {
    favorite = vue.reactive<Favorite>({
      objectId: favoriteId,
      apiFavorite: {},
      favoriteGroup: void 0,
    });

    favoriteMap.set(favoriteId, favorite);
  }

  favorite.apiFavorite = vue.reactive(apiFavorite);
  favorite.favoriteGroup = void 0;

  const name = tags[0] as string | undefined;
  if (name === void 0) {
    return;
  }

  const favoriteGroup = getFavoriteGroup(type, name);
  if (favoriteGroup === void 0) {
    return;
  }

  favorite.favoriteGroup = favoriteGroup;
  favoriteGroup.favoriteMap.set(favoriteId, favorite);
}

export async function fetchFavoriteList(n: number, offset: number) {
  return api<ApiFavorite[]>({
    method: ApiRequestMethod.GET,
    path: "favorites",
    query: {
      n,
      offset,
    },
  });
}

export async function fetchFavoriteGroupList(ownerId?: string) {
  return api<ApiFavoriteGroup[]>({
    method: ApiRequestMethod.GET,
    path: "favorite/groups",
    query: {
      ownerId,
    },
  });
}

export async function clearFavoriteGroup(
  type: ApiFavoriteGroupType,
  name: string
) {
  const response = await api<ApiFavoriteGroup>({
    method: ApiRequestMethod.DELETE,
    path: `favorite/group/${type}/${name}/${loginUser.id}`,
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    const favoriteGroup = getFavoriteGroup(type, name);
    if (favoriteGroup !== void 0) {
      for (const objectId of favoriteGroup.favoriteMap.keys()) {
        favoriteMap.delete(objectId);
      }

      favoriteGroup.favoriteMap.clear();
    }
  }

  return response;
}

export async function addToFavoriteGroup(
  type: ApiFavoriteGroupType,
  objectId: string,
  tags?: string
) {
  const response = await api<ApiFavorite>({
    method: ApiRequestMethod.POST,
    path: "favorites",
    body: {
      type,
      favoriteId: objectId,
      tags,
    },
  });

  const { status, data: apiFavorite } = response;
  if (status === ApiStatusCode.OK && apiFavorite !== void 0) {
    applyFavorite(apiFavorite);
  }

  return response;
}

export async function removeFromFavoriteGroup(objectId: string) {
  const response = await api<ApiFavorite>({
    method: ApiRequestMethod.DELETE,
    path: `favorites/${objectId}`,
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    const favorite = favoriteMap.get(objectId);
    if (favorite !== void 0) {
      favoriteMap.delete(objectId);
      favorite.favoriteGroup?.favoriteMap.delete(objectId);
    }
  }

  return response;
}

// UPDATE: PUT `favorite/group/${type}/${name}/${userId}`
// CLEAR: DELETE `favorite/group/${type}/${name}/${userId}`

function resetFavoriteGroup() {
  friendFavoriteGroupList.length = 0;
  worldFavoriteGroupList.length = 0;
  avatarFavoriteGroupList.length = 0;

  const favoriteGroupList: FavoriteGroup[] = [];

  for (const [type, name, displayName, capacity] of [
    [ApiFavoriteGroupType.Friend, "group_0", "Group 1", 150],
    [ApiFavoriteGroupType.Friend, "group_1", "Group 2", 150],
    [ApiFavoriteGroupType.Friend, "group_2", "Group 3", 150],
    [ApiFavoriteGroupType.World, "worlds1", "Group 1", 100],
    [ApiFavoriteGroupType.World, "worlds2", "Group 2", 100],
    [ApiFavoriteGroupType.World, "worlds3", "Group 3", 100],
    [ApiFavoriteGroupType.World, "worlds4", "Group 4", 100],
    [ApiFavoriteGroupType.Avatar, "avatars1", "Favorite Avatars", 50],
    [ApiFavoriteGroupType.Avatar, "avatars2", "VRC+ Group 1", 50],
    [ApiFavoriteGroupType.Avatar, "avatars3", "VRC+ Group 2", 50],
    [ApiFavoriteGroupType.Avatar, "avatars4", "VRC+ Group 3", 50],
    [ApiFavoriteGroupType.Avatar, "avatars5", "VRC+ Group 4", 50],
    [ApiFavoriteGroupType.Avatar, "avatars6", "VRC+ Group 5", 50],
  ] as [
    type: ApiFavoriteGroupType,
    name: string,
    displayName: string,
    capacity: number,
  ][]) {
    const favoriteGroup = vue.reactive<FavoriteGroup>({
      type,
      capacity,
      favoriteMap: vue.reactive(new Map<string, Favorite>()),
      apiFavoriteGroup: vue.reactive({
        id: void 0,
        ownerDisplayName: void 0,
        name,
        displayName,
        type,
        visibility: ApiFavoriteGroupVisibility.Private,
        tags: [],
      }),
    });

    switch (type) {
      case ApiFavoriteGroupType.Friend:
        friendFavoriteGroupList.push(favoriteGroup);
        break;

      case ApiFavoriteGroupType.World:
        worldFavoriteGroupList.push(favoriteGroup);
        break;

      case ApiFavoriteGroupType.Avatar:
        avatarFavoriteGroupList.push(favoriteGroup);
        break;
    }

    favoriteGroupList.push(favoriteGroup);
  }

  return favoriteGroupList;
}

async function syncFavoriteGroup() {
  const { status, data } = await fetchFavoriteGroupList();
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  friendFavoriteGroupList.length = 0;
  worldFavoriteGroupList.length = 0;
  avatarFavoriteGroupList.length = 0;

  const favoriteGroupList = resetFavoriteGroup();
  const orphanFavoriteGroupList: ApiFavoriteGroup[] = [];

  L1: for (const apiFavoriteGroup of data) {
    for (const favoriteGroup of favoriteGroupList) {
      if (
        favoriteGroup.type === apiFavoriteGroup.type &&
        favoriteGroup.apiFavoriteGroup.name === apiFavoriteGroup.name
      ) {
        favoriteGroup.apiFavoriteGroup = vue.reactive(apiFavoriteGroup);
        continue L1;
      }
    }

    orphanFavoriteGroupList.push(apiFavoriteGroup);
  }

  L2: for (const apiFavoriteGroup of orphanFavoriteGroupList) {
    for (const favoriteGroup of favoriteGroupList) {
      if (
        favoriteGroup.type === apiFavoriteGroup.type &&
        favoriteGroup.apiFavoriteGroup.id === void 0
      ) {
        favoriteGroup.apiFavoriteGroup = vue.reactive(apiFavoriteGroup);
        continue L2;
      }
    }

    console.log("unhandled favorite group", apiFavoriteGroup);
  }

  return true;
}

export async function syncFavorite() {
  favoriteMap.clear();

  for (let offset = 0; ; offset += 50) {
    const { status, data } = await fetchFavoriteList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    for (const apiFavorite of data) {
      applyFavorite(apiFavorite);
    }

    if (data.length !== 50) {
      break;
    }
  }

  return true;
}

export async function syncFavoriteInternal() {
  try {
    if (!(await syncFavoriteGroup()) || !(await syncFavorite())) {
      return false;
    }

    const avatarTags: string[] = [];

    for (const favoriteGroup of avatarFavoriteGroupList) {
      if (favoriteGroup.favoriteMap.size === 0) {
        continue;
      }

      const { name } = favoriteGroup.apiFavoriteGroup;
      if (name === void 0) {
        continue;
      }

      avatarTags.push(name);
    }

    await Promise.all([syncFavoriteWorld(), syncFavoriteAvatar(avatarTags)]);

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}
