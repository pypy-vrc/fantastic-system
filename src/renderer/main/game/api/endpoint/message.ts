import * as pubsub from "../../../../../common/pubsub";
import type { DateTimeString } from "../base";
import { api, ApiRequestMethod } from "../internal";
import { loginUser } from "./auth";

export const enum ApiMessageType {
  Message = "message",
  Response = "response",
  Request = "request",
  RequestResponse = "requestResponse",
}

export const enum ApiMessageReservedId {
  Default = "default",
}

export interface ApiMessage {
  id?: string;
  slot?: number;
  message?: string;
  messageType?: ApiMessageType;
  updatedAt?: DateTimeString;
  remainingCooldownMinutes?: number;
  canBeUpdated?: boolean;
}

pubsub.subscribe("api:login", () => {
  //
});

export async function fetchMessageList(type: ApiMessageType) {
  return api<ApiMessage[]>({
    method: ApiRequestMethod.GET,
    path: `message/${loginUser.id}/${type}`,
  });
}

export async function setMessageInSlot(
  type: ApiMessageType,
  slot: number,
  message: string
) {
  return api<ApiMessage>({
    method: ApiRequestMethod.PUT,
    path: `message/${loginUser.id}/${type}/${slot}`,
    body: {
      message,
    },
  });
}
