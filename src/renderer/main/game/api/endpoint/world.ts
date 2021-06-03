import * as vue from 'vue';
import * as pubsub from '../../../../../pubsub';
import type {ApiResponse, ApiReleaseStatus, DateTimeString} from '../base';
import {ApiStatusCode, lazyFetchWorldIdSet, notFoundWorldIdSet} from '../base';
import {api, ApiRequestMethod, applyObject} from '../internal';
import type {Favorite} from './favorite';
import {ApiFavoriteGroupType, favoriteMap} from './favorite';
import type {ApiUnityPackages} from './file';
import type {User} from './user';

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
  labsPublicationDate?: DateTimeString | 'none';
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
  type?: 'public' | 'hidden' | 'friends' | 'private';
  ownerId?: string | null;
  tags?: string[];
  active?: boolean;
  full?: boolean;
  n_users?: number;
  capacity?: number;
  platforms?: {
    standalonewindows?: number;
    android?: number;
  };
  shortName?: string;
  clientNumber?: string;
  photonRegion?: string;
  region?: string;
  canRequestInvite?: boolean;
  permanent?: boolean;
  public?: string;
  hidden?: string;
  friends?: string;
  private?: string;
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

export let worldMap = vue.reactive(new Map<string, World>());

pubsub.subscribe('api:login', () => {
  worldMap.clear();
});

export function applyWorld(apiWorld: ApiWorld): World | undefined {
  let {id} = apiWorld;
  if (id === void 0) {
    return;
  }

  let world = worldMap.get(id);
  if (world === void 0) {
    world = vue.reactive<World>({
      id,
      apiWorld: {},
      instances: new Map()
    });
    worldMap.set(id, world);
  }

  let changes = applyObject(world.apiWorld, apiWorld);
  if (changes.length !== 0) {
    // console.log('applyWorld', id, changes);
  }

  return world;
}

export async function fetchWorld(
  worldId: string
): Promise<ApiResponse<ApiWorld>> {
  let response = await api<ApiWorld>({
    method: ApiRequestMethod.GET,
    path: `worlds/${worldId}`
  });

  let {status, data} = response;
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
): Promise<ApiResponse<ApiWorld[]>> {
  // worlds/active
  // worlds/recent
  let response = await api<ApiWorld[]>({
    method: ApiRequestMethod.GET,
    path: 'worlds',
    query: {
      search,
      n,
      offset
    }
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (let apiWorld of data) {
      let {id} = apiWorld;
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
): Promise<ApiResponse<ApiWorld[]>> {
  let response = await api<ApiWorld[]>({
    method: ApiRequestMethod.GET,
    path: 'worlds/favorites',
    query: {
      n,
      offset,
      userId,
      tag
    }
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (let apiWorld of data) {
      let {id} = apiWorld;
      if (id === void 0) {
        continue;
      }

      notFoundWorldIdSet.delete(id);

      applyWorld(apiWorld);
    }
  }

  return response;
}

export async function fetchWorldInstance(
  location: string
): Promise<ApiResponse<ApiWorldInstance>> {
  return api<ApiWorldInstance>({
    method: ApiRequestMethod.GET,
    path: `instances/${location}`
  });
}

export async function fetchWorldInstanceShortName(
  location: string
): Promise<ApiResponse<string>> {
  return api<string>({
    method: ApiRequestMethod.GET,
    path: `instances/${location}/shortName`,
    query: {
      permanentify: 'false'
    }
  });
}

export async function fetchWorldInstanceFromShortName(
  shortName: string
): Promise<ApiResponse<ApiWorldInstance>> {
  return api<ApiWorldInstance>({
    method: ApiRequestMethod.GET,
    path: `instances/s/${encodeURIComponent(shortName)}`,
    query: {
      permanentify: 'false'
    }
  });
}

export async function syncFavoriteWorld(): Promise<boolean> {
  let missingFavoriteWorldMap = new Map<string, Favorite>();

  for (let favorite of favoriteMap.values()) {
    if (favorite.apiFavorite.type !== ApiFavoriteGroupType.World) {
      continue;
    }

    missingFavoriteWorldMap.set(favorite.apiFavorite.id!, favorite);
  }

  for (let offset = 0; missingFavoriteWorldMap.size !== 0; offset += 50) {
    let {status, data} = await fetchFavoriteWorldList(50, offset);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    for (let apiWorld of data) {
      let {favoriteId} = apiWorld;
      if (favoriteId !== void 0) {
        missingFavoriteWorldMap.delete(favoriteId);
      }

      let {id} = apiWorld;
      if (id === void 0 || id === '???') {
        continue;
      }

      notFoundWorldIdSet.delete(id);

      applyWorld(apiWorld);
    }

    if (data.length !== 50) {
      break;
    }
  }

  for (let favorite of missingFavoriteWorldMap.values()) {
    lazyFetchWorldIdSet.add(favorite.objectId);
  }

  return true;
}
