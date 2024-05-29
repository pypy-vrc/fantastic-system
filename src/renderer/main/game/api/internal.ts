import * as noty from "noty";
import * as util from "../../../../common/util";
import type { ApiResponse } from "./base";
import { ApiStatusCode } from "./base";
import { ReservedLocation } from "./location";
import * as sanitize from "./sanitize";

export const enum ApiRequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export interface ApiRequestAuth {
  username: string;
  password: string;
}

export interface ApiReqeustQuery {
  [key: string]: string | number | undefined;
}

export interface ApiRequest {
  method: ApiRequestMethod;
  path: string;
  auth?: ApiRequestAuth;
  query?: ApiReqeustQuery;
  body?: unknown;
  any?: boolean;
}

export async function api<T>(request: ApiRequest): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
    };

    const options: RequestInit = {
      method: request.method,
      headers,
      credentials: "include",
      cache: "no-cache",
      redirect: "follow",
      referrer: "no-referrer",
    };

    const { auth } = request;
    if (auth !== void 0) {
      // two encodeURIComponents are intended for special characters
      const username = unescape(
        encodeURIComponent(encodeURIComponent(auth.username))
      );
      const password = unescape(
        encodeURIComponent(encodeURIComponent(auth.password))
      );
      headers.Authorization = "Basic " + btoa(username + ":" + password);
    }

    const { body } = request;
    // Blob | BufferSource | FormData | URLSearchParams | ReadableStream<Uint8Array> | string
    if (body && typeof body === "object") {
      const { constructor } = body;
      if (constructor === FormData) {
        // multipart/form-data
        // setting content-type leads boundary broken
        options.body = body as BodyInit;
      } else if (constructor === Blob || constructor === ArrayBuffer) {
        headers["Content-Type"] = "application/octet-stream";
        options.body = body as BodyInit;
      } else {
        headers["Content-Type"] = "application/json; charset=utf-8";
        options.body = JSON.stringify(body);
      }
    } else {
      headers["Content-Type"] = "application/json; charset=utf-8";
      options.body = JSON.stringify(body);
    }

    const url = new URL(`/api/1/${request.path}`, "https://api.vrchat.cloud");

    const { query } = request;
    if (query !== void 0) {
      const { searchParams } = url;
      for (const name of Object.keys(query)) {
        const value = query[name];
        if (value === void 0) {
          continue;
        }
        searchParams.set(name, String(value));
      }
    }

    const response = await fetch(url.toString(), options);
    let { status } = response;

    let data;

    try {
      data = await response.text();
      if (
        response.headers.get("content-type")?.startsWith("application/json") ===
        true
      ) {
        data = JSON.parse(data);
      }
    } catch (err) {
      console.error("api", err);
    }

    if (data !== Object(data) && request.any !== true) {
      console.error("api error", { status, data });
      return {
        status: 0,
        data: void 0,
      };
    }

    // TODO: general success, general error

    let errorMessage = "An unknown error occurred";
    if (data === Object(data)) {
      try {
        const { error } = data;
        if (error === Object(error)) {
          status = parseInt(error.status_code, 10);
          errorMessage = String(error.message);
          const json = JSON.parse(error.message);
          if (json === Object(json)) {
            errorMessage = String(json.message);
          } else {
            errorMessage = String(json);
          }
        } else if (data.code !== void 0) {
          status = parseInt(data.code, 10);
          errorMessage = String(error);
        }
      } catch {
        //
      }
    }

    if (status !== ApiStatusCode.OK) {
      console.error("api error", {
        status,
        errorMessage,
      });
      new noty({
        type: "error",
        layout: "bottomRight",
        theme: "sunset",
        text: `${util.escapeHtml(
          errorMessage
        )}<br><span style="font-size: 11px;">${status} ${response.url}</span>`,
        timeout: 6000,
        queue: "api",
      }).show();
    }

    return {
      status,
      data,
    };
  } catch (err) {
    console.error("api error", err);
    return {
      status: 0,
      data: void 0,
    };
  }
}

export function applyObject(target: object, source: object) {
  const changes: [key: string, value: unknown, oldValue: unknown][] = [];

  for (const key of Object.keys(source)) {
    let value = source[key as keyof unknown] as unknown;

    switch (key) {
      case "bio":
        value = sanitize.replacePunctuation(String(value));
        break;

      case "statusDescription":
        value = sanitize.replacePunctuation(String(value)).slice(0, 32);
        break;

      case "location":
        if (value === "") {
          value = ReservedLocation.Offline;
        }
        break;

      case "tags":
        if (Array.isArray(value)) {
          value = [...new Set(value as [])].sort();
        }
        break;
    }

    const oldValue = target[key as keyof object] as unknown;
    if (oldValue !== void 0 && util.isEquals(oldValue, value)) {
      continue;
    }

    (target as Record<string, unknown>)[key] = value;
    changes.push([key, value, oldValue]);
  }

  return changes;
}

export function replaceObject(target: object, source: object) {
  const changes: [key: string, value: unknown, oldValue: unknown][] = [];

  const deleteKeySet = new Set(Object.keys(target));

  for (const key of Object.keys(source)) {
    let value = source[key as keyof unknown] as unknown;

    switch (key) {
      case "bio":
        value = sanitize.replacePunctuation(String(value));
        break;

      case "statusDescription":
        // 얘는 slice 없음
        value = sanitize.replacePunctuation(String(value));
        break;

      case "location":
        if (value === "") {
          value = ReservedLocation.Offline;
        }
        break;

      case "tags":
        if (Array.isArray(value)) {
          value = [...new Set(value as [])].sort();
        }
        break;
    }

    const oldValue = target[key as keyof object] as unknown;
    if (oldValue !== void 0 && util.isEquals(oldValue, value)) {
      continue;
    }

    (target as Record<string, unknown>)[key] = value;
    changes.push([key, value, oldValue]);
  }

  for (const key of deleteKeySet) {
    changes.push([key, void 0, target[key as keyof object] as unknown]);
    delete target[key as keyof object]; // 이거 이건좀 아닌듯??
  }

  return changes;
}
