import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import type { DateTimeString } from "../base";
import { ApiReleaseStatus, ApiStatusCode, notFoundAvatarIdSet } from "../base";
import { api, ApiRequestMethod, applyObject } from "../internal";
import type { ApiUnityPackages } from "./file";

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

export const avatarMap = vue.reactive(new Map<string, Avatar>());

pubsub.subscribe("api:login", () => {
  avatarMap.clear();
});

export function applyAvatar(apiAvatar: ApiAvatar) {
  const { id } = apiAvatar;
  if (id === void 0) {
    return;
  }

  let avatar = avatarMap.get(id);
  if (avatar === void 0) {
    avatar = vue.reactive<Avatar>({
      id,
      apiAvatar: {},
    });
    avatarMap.set(id, avatar);
  }

  const changes = applyObject(avatar.apiAvatar, apiAvatar);
  if (changes.length !== 0) {
    // console.log('applyAvatar', id, changes);
  }
}

export async function fetchAvatar(avatarId: string) {
  const response = await api<ApiAvatar>({
    method: ApiRequestMethod.GET,
    path: `avatars/${avatarId}`,
  });

  const { status, data } = response;
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

export async function fetchAvatarList(n: number, count: number) {
  const response = await api<ApiAvatar[]>({
    method: ApiRequestMethod.GET,
    path: "avatars",
    query: {
      n,
      count,
      user: "me",
      releaseStatus: ApiReleaseStatus.All,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (const apiAvatar of data) {
      const { id } = apiAvatar;
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
) {
  const response = await api<ApiAvatar[]>({
    method: ApiRequestMethod.GET,
    path: "avatars/favorites",
    query: {
      n,
      offset,
      userId,
      tag,
    },
  });

  const { status, data } = response;
  if (status === ApiStatusCode.OK && data !== void 0) {
    for (const apiAvatar of data) {
      const { id } = apiAvatar;
      if (id === void 0) {
        continue;
      }

      notFoundAvatarIdSet.delete(id);

      applyAvatar(apiAvatar);
    }
  }

  return response;
}

export async function syncFavoriteAvatar(tags: string[]) {
  for (const tag of tags) {
    const { status, data } = await fetchFavoriteAvatarList(50, 0, void 0, tag);
    if (status !== ApiStatusCode.OK || data === void 0) {
      return false;
    }

    for (const apiAvatar of data) {
      const { id } = apiAvatar;
      if (id === void 0 || id === "???") {
        continue;
      }

      notFoundAvatarIdSet.delete(id);

      applyAvatar(apiAvatar);
    }
  }

  return true;
}
