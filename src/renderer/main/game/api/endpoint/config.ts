import * as vue from 'vue';
import type {ApiResponse} from '../base';
import {ApiStatusCode} from '../base';
import {api, ApiRequestMethod} from '../internal';

export interface ApiConfig {
  clientApiKey?: string;
}

export interface Config {
  apiConfig: ApiConfig;
}

export let config = vue.reactive<Config>({
  apiConfig: {}
});

export async function fetchConfig(): Promise<ApiResponse<ApiConfig>> {
  let response = await api<ApiConfig>({
    method: ApiRequestMethod.GET,
    path: 'config'
  });

  let {status, data: apiConfig} = response;
  if (status === ApiStatusCode.OK && apiConfig !== void 0) {
    config.apiConfig = vue.reactive(apiConfig);
  }

  return response;
}
