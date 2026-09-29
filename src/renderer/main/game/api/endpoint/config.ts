import { reactive } from "vue";
import { ApiStatusCode } from "../base.ts";
import { api, ApiRequestMethod } from "../internal.ts";

export type ApiConfig = {
  clientApiKey?: string;
};

export type Config = {
  apiConfig: ApiConfig;
};

export const config = reactive<Config>({
  apiConfig: {},
});

export async function fetchConfig() {
  const response = await api<ApiConfig>({
    method: ApiRequestMethod.GET,
    path: "config",
  });

  const { status, data: apiConfig } = response;
  if (status === ApiStatusCode.OK && apiConfig !== void 0) {
    config.apiConfig = reactive(apiConfig);
  }

  return response;
}
