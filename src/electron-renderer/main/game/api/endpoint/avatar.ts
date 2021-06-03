import * as vue from 'vue';
import * as pubsub from '../../../../../pubsub';
import type {ApiResponse, DateTimeString} from '../base';
import {
  ApiReleaseStatus,
  ApiStatusCode,
  lazyFetchAvatarIdSet,
  notFoundAvatarIdSet
} from '../base';
import {api, ApiRequestMethod, applyObject} from '../internal';
import {ApiFavoriteGroupType, Favorite, favoriteMap} from './favorite';
import type {ApiUnityPackages} from './file';

export interface ApiAvatar {
  id?: string;
  name?: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  tags?: string[];
  assetUrl?: string;
  assetUrlObject?: object;
  imageUrl?: string;
  thumbnailImageUrl?: string;
  releaseStatus?: ApiReleaseStatus;
  version?: number;
  featured?: boolean;
  unityPackages?: ApiUnityPackages[];
  unityPackageUrl?: string;
  unityPackageUrlObject?: object;
  created_at?: DateTimeString;
  updated_at?: DateTimeString;
}

export interface Avatar {
  id: string;
  apiAvatar: ApiAvatar;
}

export let avatarMap = vue.reactive(new Map<string, Avatar>());

pubsub.subscribe('api:login', () => {
  avatarMap.clear();
});

export function applyAvatar(apiAvatar: ApiAvatar): void {
  let {id} = apiAvatar;
  if (id === void 0) {
    return;
  }

  let avatar = avatarMap.get(id);
  if (avatar === void 0) {
    avatar = vue.reactive<Avatar>({
      id,
      apiAvatar: {}
    });
    avatarMap.set(id, avatar);
  }

  let changes = applyObject(avatar.apiAvatar, apiAvatar);
  if (changes.length !== 0) {
    // console.log('applyAvatar', id, changes);
  }
}

export async function fetchAvatar(
  avatarId: string
): Promise<ApiResponse<ApiAvatar>> {
  let response = await api<ApiAvatar>({
    method: ApiRequestMethod.GET,
    path: `avatars/${avatarId}`
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK) {
    if (data !== void 0) {
      applyAvatar(data);
      notFoundAvatarIdSet.delete(avatarId);
    }
  } else if (status === ApiStatusCode.NotFound) {
    notFoundAvatarIdSet.add(avatarId);
  }

  return response;
}

export async function fetchAvatarList(
  n: number,
  count: number
): Promise<ApiResponse<ApiAvatar[]>> {
  let response = await api<ApiAvatar[]>({
    method: ApiRequestMethod.GET,
    path: 'avatars',
    query: {
      n,
      count,
      user: 'me',
      releaseStatus: ApiReleaseStatus.All
    }
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (let apiAvatar of data) {
      let {id} = apiAvatar;
      if (id === void 0) {
        continue;
      }

      notFoundAvatarIdSet.delete(id);

      applyAvatar(apiAvatar);
    }
  }

  return response;
}

export async function fetchFavoriteAvatarList(
  n: number,
  offset: number,
  userId?: string,
  tag?: string
): Promise<ApiResponse<ApiAvatar[]>> {
  let response = await api<ApiAvatar[]>({
    method: ApiRequestMethod.GET,
    path: 'avatars/favorites',
    query: {
      n,
      offset,
      userId,
      tag
    }
  });

  let {status, data} = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (let apiAvatar of data) {
      let {id} = apiAvatar;
      if (id === void 0) {
        continue;
      }

      notFoundAvatarIdSet.delete(id);

      applyAvatar(apiAvatar);
    }
  }

  return response;
}

export async function syncFavoriteAvatar(tags: string[]): Promise<boolean> {
  for (let tag of tags) {
    let {status, data} = await fetchFavoriteAvatarList(50, 0, void 0, tag);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    for (let apiAvatar of data) {
      let {id} = apiAvatar;
      if (id === void 0 || id === '???') {
        continue;
      }

      notFoundAvatarIdSet.delete(id);

      applyAvatar(apiAvatar);
    }
  }

  return true;
}
