import type {ApiResponse} from '../base';
import {api, ApiRequestMethod} from '../internal';

export interface ApiHealth {
  ok?: boolean;
  serverName?: string;
  buildVersionTag?: string;
}

export async function fetchHealth(): Promise<ApiResponse<ApiHealth>> {
  return api<ApiHealth>({
    method: ApiRequestMethod.GET,
    path: 'health'
  });
}

export async function fetchTime(): Promise<ApiResponse<string>> {
  return api<string>({
    method: ApiRequestMethod.GET,
    path: 'time',
    any: true
  });
}

export async function fetchVisits(): Promise<ApiResponse<number>> {
  return api<number>({
    method: ApiRequestMethod.GET,
    path: 'visits',
    any: true
  });
}
