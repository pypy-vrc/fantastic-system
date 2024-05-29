import * as vue from "vue";
import { ApiStatusCode } from "../base";
import { api, ApiRequestMethod } from "../internal";

export interface ApiConfig {
  clientApiKey?: string;
}

export interface Config {
  apiConfig: ApiConfig;
}

export const config = vue.reactive<Config>({
  apiConfig: {},
});

export async function fetchConfig() {
  const response = await api<ApiConfig>({
    method: ApiRequestMethod.GET,
    path: "config",
  });

  const { status, data: apiConfig } = response;
  if (status === ApiStatusCode.OK && apiConfig !== void 0) {
    config.apiConfig = vue.reactive(apiConfig);
  }

  return response;
}
