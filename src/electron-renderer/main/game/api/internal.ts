import * as noty from 'noty';
import * as util from '../../../../util';
import type {ApiResponse} from './base';
import {ApiStatusCode} from './base';
import {ReservedLocation} from './location';
import * as sanitize from './sanitize';

export const enum ApiRequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
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
  body?: any;
  any?: boolean;
}

export async function api<T>(request: ApiRequest): Promise<ApiResponse<T>> {
  try {
    let headers: HeadersInit = {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json'
    };

    let options: RequestInit = {
      method: request.method,
      headers,
      credentials: 'include',
      cache: 'no-cache',
      redirect: 'follow',
      referrer: 'no-referrer'
    };

    let {auth} = request;
    if (auth !== void 0) {
      // two encodeURIComponents are intended for special characters
      let username = unescape(
        encodeURIComponent(encodeURIComponent(auth.username))
      );
      let password = unescape(
        encodeURIComponent(encodeURIComponent(auth.password))
      );
      headers.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    let {body} = request;
    if (body !== void 0) {
      // Blob | BufferSource | FormData | URLSearchParams | ReadableStream<Uint8Array> | string
      if (Object(body) === body) {
        let {constructor} = body;
        if (constructor === FormData) {
          // multipart/form-data
          // setting content-type leads boundary broken
          options.body = body;
        } else if (constructor === Blob || constructor === ArrayBuffer) {
          headers['Content-Type'] = 'application/octet-stream';
          options.body = body;
        } else {
          headers['Content-Type'] = 'application/json; charset=utf-8';
          options.body = JSON.stringify(body);
        }
      } else {
        headers['Content-Type'] = 'application/json; charset=utf-8';
        options.body = JSON.stringify(body);
      }
    }

    let url = new URL(`/api/1/${request.path}`, 'https://api.vrchat.cloud');

    let {query} = request;
    if (query !== void 0) {
      let {searchParams} = url;
      for (let name of Object.keys(query)) {
        let value = query[name];
        if (value === void 0) {
          continue;
        }
        searchParams.set(name, String(value));
      }
    }

    let response = await fetch(url.toString(), options);
    let {status} = response;

    let data: any = void 0;

    try {
      data = await response.text();
      if (
        response.headers.get('content-type')?.startsWith('application/json') ===
        true
      ) {
        data = JSON.parse(data);
      }
    } catch (err) {
      console.error('api', err);
    }

    if (data !== Object(data) && request.any !== true) {
      console.error('api error', {status, data});
      return {
        status: 0,
        data: void 0
      };
    }

    // TODO: general success, general error

    let errorMessage = 'An unknown error occurred';
    if (data === Object(data)) {
      try {
        let {error} = data;
        if (error === Object(error)) {
          status = parseInt(error.status_code, 10);
          errorMessage = String(error.message);
          let json = JSON.parse(error.message);
          if (json === Object(json)) {
            errorMessage = String(json.message);
          } else {
            errorMessage = String(json);
          }
        } else if (data.code !== void 0) {
          status = parseInt(data.code, 10);
          errorMessage = String(error);
        }
      } catch {}
    }

    if (status !== ApiStatusCode.OK) {
      console.error('api error', {
        status,
        errorMessage
      });
      new noty({
        type: 'error',
        layout: 'bottomRight',
        theme: 'sunset',
        text: `${util.escapeHtml(
          errorMessage
        )}<br><span style="font-size: 11px;">${status} ${response.url}</span>`,
        timeout: 6000,
        queue: 'api'
      }).show();
    }

    return {
      status,
      data
    };
  } catch (err) {
    console.error('api error', err);
    return {
      status: 0,
      data: void 0
    };
  }
}

export function applyObject(
  target: {[key: string]: any},
  source: {[key: string]: any}
): any[] {
  let changes = [];

  for (let key of Object.keys(source)) {
    let value = source[key];

    switch (key) {
      case 'bio':
        value = sanitize.replacePunctuation(value);
        break;

      case 'statusDescription':
        value = sanitize.replacePunctuation(value).substr(0, 32);
        break;

      case 'location':
        if (value === '') {
          value = ReservedLocation.Offline;
        }
        break;

      case 'tags':
        if (Array.isArray(value) === true) {
          value = [...new Set(value)].sort();
        }
        break;
    }

    let oldValue = target[key];
    if (oldValue !== void 0 && util.isEquals(oldValue, value) === true) {
      continue;
    }

    target[key] = value;
    changes.push([key, value, oldValue]);
  }

  return changes;
}

export function replaceObject(
  target: {[key: string]: any},
  source: {[key: string]: any}
): any[] {
  let changes = [];

  let deleteKeySet = new Set(Object.keys(target));

  for (let key of Object.keys(source)) {
    let value = source[key];

    switch (key) {
      case 'bio':
        value = sanitize.replacePunctuation(value);
        break;

      case 'statusDescription':
        value = sanitize.replacePunctuation(value);
        break;

      case 'location':
        if (value === '') {
          value = ReservedLocation.Offline;
        }
        break;

      case 'tags':
        if (Array.isArray(value) === true) {
          value = [...new Set(value)].sort();
        }
        break;
    }

    let oldValue = target[key];
    if (oldValue !== void 0 && util.isEquals(oldValue, value) === true) {
      continue;
    }

    target[key] = value;
    changes.push([key, value, oldValue]);
  }

  for (let key of deleteKeySet) {
    changes.push([key, void 0, target[key]]);
    delete target[key];
  }

  return changes;
}
