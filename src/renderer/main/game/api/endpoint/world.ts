import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import type { ApiReleaseStatus, DateTimeString } from "../base";
import {
  ApiStatusCode,
  lazyFetchWorldIdSet,
  notFoundWorldIdSet,
} from "../base";
import { api, ApiRequestMethod, applyObject } from "../internal";
import type { Favorite } from "./favorite";
import { ApiFavoriteGroupType, favoriteMap } from "./favorite";
import type { ApiUnityPackages } from "./file";
import type { User } from "./user";

export interface ApiWorld {
  id?: string;
  name?: string;
  description?: string;
  featured?: boolean;
  authorId?: string;
  authorName?: string;
  capacity?: number;
  tags?: string[];
  releaseStatus?: ApiReleaseStatus;
  imageUrl?: string;
  thumbnailImageUrl?: string;
  assetUrl?: string;
  assetUrlObject?: object;
  pluginUrlObject?: object;
  unityPackageUrlObject?: object;
  namespace?: string;
  unityPackages?: ApiUnityPackages[];
  version?: number;
  organization?: string;
  previewYoutubeId?: string | null;
  favorites?: number;
  created_at?: DateTimeString;
  updated_at?: DateTimeString;
  publicationDate?: DateTimeString;
  labsPublicationDate?: DateTimeString | "none";
  visits?: number;
  popularity?: number;
  heat?: number;
  publicOccupants?: number;
  privateOccupants?: number;
  occupants?: number;
  instances?: [instanceId: string, occupants: number][];
  favoriteId?: string;
}

export interface ApiWorldInstance {
  id?: string;
  location?: string;
  instanceId?: string;
  name?: string;
  worldId?: string;
  type?: "public" | "hidden" | "friends" | "private" | "group";
  ownerId?: string | null;
  tags?: string[];
  active?: boolean;
  full?: boolean;
  n_users?: number;
  capacity?: number;
  userCount?: number;
  platforms?: {
    standalonewindows?: number;
    android?: number;
  };
  shortName?: string | null;
  secureName?: string;
  clientNumber?: string;
  photonRegion?: string;
  region?: string;
  canRequestInvite?: boolean;
  permanent?: boolean;
  groupAccessType?: string;
  public?: string;
  hidden?: string;
  friends?: string;
  private?: string;
  // id: string;
  // location: string;
  // instanceId: string;
  // name: string;
  // worldId: string;
  // type: string;
  // ownerId: string;
  // tags: string[];
  // active: boolean;
  // full: boolean;
  // n_users: number;
  // capacity: number;
  // platforms: {
  //   standalonewindows: number;
  //   android: number;
  // };
  // secureName: string;
  // shortName: string;
  // world: {
  //   id: string;
  //   tags: string[];
  //   name: string;
  //   description: string;
  //   authorId: string;
  //   authorName: string;
  //   releaseStatus: string;
  //   imageUrl: string;
  //   thumbnailImageUrl: string;
  //   capacity: number;
  //   version: number;
  //   created_at: string;
  //   updated_at: string;
  // };
  // users: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   bio: string;
  //   bioLinks: string[];
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   fallbackAvatar: string;
  //   userIcon: string;
  //   profilePicOverride: string;
  //   last_platform: string;
  //   tags: string[];
  //   developerType: string;
  //   isFriend: boolean;
  //   statusDescription: string;
  // }[];
  // nonce: string;
  // clientNumber: string;
  // photonRegion: string;
  // region: string;
  // canRequestInvite: boolean;
  // permanent: boolean;
  // friends: string;
  // strict: boolean;
}

export interface World {
  id: string;
  apiWorld: ApiWorld;
  instances: Map<string, Instance>;
}

export interface Instance {
  id: string;
  users: Set<User>;
}

export const worldMap = vue.reactive(new Map<string, World>());

pubsub.subscribe("api:login", () => {
  worldMap.clear();
});

export function applyWorld(apiWorld: ApiWorld) {
  const { id } = apiWorld;
  if (id === void 0) {
    return;
  }

  let world = worldMap.get(id);
  if (world === void 0) {
    world = vue.reactive<World>({
      id,
      apiWorld: {},
      instances: new Map(),
    });
    worldMap.set(id, world);
  }

  const changes = applyObject(world.apiWorld, apiWorld);
  if (changes.length !== 0) {
    // console.log('applyWorld', id, changes);
  }

  return world;
}

export async function fetchWorld(worldId: string) {
  const response = await api<ApiWorld>({
    method: ApiRequestMethod.GET,
    path: `worlds/${worldId}`,
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK) {
    if (data !== void 0) {
      applyWorld(data);
      notFoundWorldIdSet.delete(worldId);
    }
  } else if (status === ApiStatusCode.NotFound) {
    notFoundWorldIdSet.add(worldId);
  }

  return response;
}

export async function fetchWorldList(
  search: string,
  n: number,
  offset: number
) {
  // worlds/active
  // worlds/recent
  const response = await api<ApiWorld[]>({
    method: ApiRequestMethod.GET,
    path: "worlds",
    query: {
      search,
      n,
      offset,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (const apiWorld of data) {
      const { id } = apiWorld;
      if (id === void 0) {
        continue;
      }

      notFoundWorldIdSet.delete(id);

      applyWorld(apiWorld);
    }
  }

  return response;
}

export async function fetchFavoriteWorldList(
  n: number,
  offset: number,
  userId?: string,
  tag?: string
) {
  const response = await api<ApiWorld[]>({
    method: ApiRequestMethod.GET,
    path: "worlds/favorites",
    query: {
      n,
      offset,
      userId,
      tag,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (const apiWorld of data) {
      const { id } = apiWorld;
      if (id === void 0) {
        continue;
      }

      notFoundWorldIdSet.delete(id);

      applyWorld(apiWorld);
    }
  }

  return response;
}

export async function fetchWorldInstance(location: string) {
  return api<ApiWorldInstance>({
    method: ApiRequestMethod.GET,
    path: `instances/${location}`,
  });
}

export async function fetchWorldInstanceShortName(location: string) {
  return api<Pick<ApiWorldInstance, "shortName" | "secureName">>({
    method: ApiRequestMethod.GET,
    path: `instances/${location}/shortName`,
    query: {
      permanentify: "false",
    },
  });
}

export async function fetchWorldInstanceFromShortName(shortName: string) {
  return api<ApiWorldInstance>({
    method: ApiRequestMethod.GET,
    path: `instances/s/${encodeURIComponent(shortName)}`,
    query: {
      permanentify: "false",
    },
  });
}

export async function syncFavoriteWorld() {
  const missingFavoriteWorldMap = new Map<string, Favorite>();

  for (const favorite of favoriteMap.values()) {
    if (
      favorite.apiFavorite.id === void 0 ||
      favorite.apiFavorite.type !== ApiFavoriteGroupType.World
    ) {
      continue;
    }

    missingFavoriteWorldMap.set(favorite.apiFavorite.id, favorite);
  }

  for (let offset = 0; missingFavoriteWorldMap.size !== 0; offset += 50) {
    const { status, data } = await fetchFavoriteWorldList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    for (const apiWorld of data) {
      const { favoriteId } = apiWorld;
      if (favoriteId !== void 0) {
        missingFavoriteWorldMap.delete(favoriteId);
      }

      const { id } = apiWorld;
      if (id === void 0 || id === "???") {
        continue;
      }

      notFoundWorldIdSet.delete(id);

      applyWorld(apiWorld);
    }

    if (data.length !== 50) {
      break;
    }
  }

  for (const favorite of missingFavoriteWorldMap.values()) {
    lazyFetchWorldIdSet.add(favorite.objectId);
  }

  return true;
}
