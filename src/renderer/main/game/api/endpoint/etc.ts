import { api, ApiRequestMethod } from "../internal";

export interface ApiHealth {
  ok?: boolean;
  serverName?: string;
  buildVersionTag?: string;
}

export function fetchHealth() {
  return api<ApiHealth>({
    method: ApiRequestMethod.GET,
    path: "health",
  });
}

export function fetchTime() {
  return api<string>({
    method: ApiRequestMethod.GET,
    path: "time",
    any: true,
  });
}

export function fetchVisits() {
  return api<number>({
    method: ApiRequestMethod.GET,
    path: "visits",
    any: true,
  });
}
