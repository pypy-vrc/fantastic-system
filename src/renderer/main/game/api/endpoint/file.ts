import * as pubsub from "../../../../../common/pubsub";

import type { ApiPlatform, DateTimeString } from "../base";
import { api, ApiRequestMethod } from "../internal";

export interface ApiUnityPackages {
  id?: string;
  assetUrl?: string;
  assetUrlObject?: object;
  pluginUrl?: string;
  pluginUrlObject?: object;
  unityVersion?: string;
  unitySortNumber?: number;
  assetVersion?: number;
  platform?: ApiPlatform;
  created_at?: DateTimeString;
}

export const enum ApiFileStatus {
  None = "none",
  Waiting = "waiting",
  Queued = "queued",
  Complete = "complete",
  Error = "error",
}

export const enum ApiFileCategory {
  Simple = "simple",
  Multipart = "multipart",
  Queued = "queued",
}

export interface ApiFileDescriptor {
  fileName?: string;
  url?: string;
  md5?: string;
  sizeInBytes?: number;
  status?: ApiFileStatus;
  category?: ApiFileCategory;
  uploadId?: string;
}

export interface ApiFileVersion {
  version?: number;
  status?: ApiFileStatus;
  created_at?: DateTimeString;
  file?: ApiFileDescriptor;
  delta?: ApiFileDescriptor;
  signature?: ApiFileDescriptor;
}

export interface ApiFile {
  id?: string;
  name?: string;
  ownerId?: string;
  mimeType?: string;
  extension?: string;
  tags?: string[];
  versions?: ApiFileVersion[];
}

pubsub.subscribe("api:login", () => {
  //
});

export async function fetchFile(fileId: string) {
  return api<ApiFile>({
    method: ApiRequestMethod.GET,
    path: `files/${fileId}`,
  });
}

export async function fetchFileList(n: number, offset: number, tag?: string) {
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
