import { subscribe } from "../../../../../common/pubsub.ts";
import type { ApiPlatformValue, DateTimeString } from "../base.ts";
import { api, ApiRequestMethod } from "../internal.ts";

export type ApiUnityPackages = {
  id?: string;
  assetUrl?: string;
  assetUrlObject?: object;
  pluginUrl?: string;
  pluginUrlObject?: object;
  unityVersion?: string;
  unitySortNumber?: number;
  assetVersion?: number;
  platform?: ApiPlatformValue;
  created_at?: DateTimeString;
};

export const ApiFileStatus = {
  None: "none",
  Waiting: "waiting",
  Queued: "queued",
  Complete: "complete",
  Error: "error",
};

export type ApiFileStatusValue =
  (typeof ApiFileStatus)[keyof typeof ApiFileStatus];

export const ApiFileCategory = {
  Simple: "simple",
  Multipart: "multipart",
  Queued: "queued",
};

export type ApiFileCategoryValue =
  (typeof ApiFileCategory)[keyof typeof ApiFileCategory];

export type ApiFileDescriptor = {
  fileName?: string;
  url?: string;
  md5?: string;
  sizeInBytes?: number;
  status?: ApiFileStatusValue;
  category?: ApiFileCategoryValue;
  uploadId?: string;
};

export type ApiFileVersion = {
  version?: number;
  status?: ApiFileStatusValue;
  created_at?: DateTimeString;
  file?: ApiFileDescriptor;
  delta?: ApiFileDescriptor;
  signature?: ApiFileDescriptor;
};

export type ApiFile = {
  id?: string;
  name?: string;
  ownerId?: string;
  mimeType?: string;
  extension?: string;
  tags?: string[];
  versions?: ApiFileVersion[];
};

subscribe("api:login", () => {
  //
});

export function fetchFile(fileId: string) {
  return api<ApiFile>({
    method: ApiRequestMethod.GET,
    path: `files/${fileId}`,
  });
}

export function fetchFileList(n: number, offset: number, tag?: string) {
  return api<ApiFile[]>({
    method: ApiRequestMethod.GET,
    path: "files",
    query: {
      n,
      offset,
      tag,
    },
  });
}
