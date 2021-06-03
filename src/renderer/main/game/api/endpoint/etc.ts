import { api, ApiRequestMethod } from "../internal";

export interface ApiHealth {
  ok?: boolean;
  serverName?: string;
  buildVersionTag?: string;
}

export async function fetchHealth() {
  return api<ApiHealth>({
    method: ApiRequestMethod.GET,
    path: "health",
  });
}

export async function fetchTime() {
  return api<string>({
    method: ApiRequestMethod.GET,
    path: "time",
    any: true,
  });
}

export async function fetchVisits() {
  return api<number>({
    method: ApiRequestMethod.GET,
    path: "visits",
    any: true,
  });
}
