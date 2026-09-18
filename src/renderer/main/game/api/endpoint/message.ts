import { subscribe } from "../../../../../common/pubsub.ts";
import type { DateTimeString } from "../base.ts";
import { api, ApiRequestMethod } from "../internal.ts";
import { loginUser } from "./auth.ts";

export const ApiMessageType = {
  Message: "message",
  Response: "response",
  Request: "request",
  RequestResponse: "requestResponse",
};

export type ApiMessageTypeValue =
  (typeof ApiMessageType)[keyof typeof ApiMessageType];

export const ApiMessageReservedId = {
  Default: "default",
};

export type ApiMessageReservedIdValue =
  (typeof ApiMessageReservedId)[keyof typeof ApiMessageReservedId];

export type ApiMessage = {
  id?: string;
  slot?: number;
  message?: string;
  messageType?: ApiMessageTypeValue;
  updatedAt?: DateTimeString;
  remainingCooldownMinutes?: number;
  canBeUpdated?: boolean;
};

subscribe("api:login", () => {
  //
});

export function fetchMessageList(type: ApiMessageTypeValue) {
  return api<ApiMessage[]>({
    method: ApiRequestMethod.GET,
    path: `message/${loginUser.id}/${type}`,
  });
}

export function setMessageInSlot(
  type: ApiMessageTypeValue,
  slot: number,
  message: string,
) {
  return api<ApiMessage>({
    method: ApiRequestMethod.PUT,
    path: `message/${loginUser.id}/${type}/${slot}`,
    body: {
      message,
    },
  });
}
