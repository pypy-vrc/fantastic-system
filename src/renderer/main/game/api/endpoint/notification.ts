import * as vue from "vue";
import * as pubsub from "../../../../../common/pubsub";
import type { ApiSuccess, DateTimeString } from "../base";
import { ApiStatusCode, lazyFetchUserIdSet } from "../base";
import { api, ApiRequestMethod } from "../internal";
import { userMap } from "./user";

export const enum ApiNotificationType {
  Message = "message",
  FriendRequest = "friendRequest",
  Invite = "invite",
  ReqeustInvite = "requestInvite",
  InviteResponse = "inviteResponse",
  ReqeustInviteResponse = "requestInviteResponse",
}

export interface ApiNotification {
  id?: string;
  type?: ApiNotificationType;
  senderUserId?: string;
  senderUsername?: string;
  receiverUserId?: string;
  message?: string;
  details?: {
    platform?: string;
    worldId?: string;
    worldName?: string;
    inviteMessage?: string;
    inResponseTo?: string;
    responseMessage?: string;
    imageUrl?: string;
  };
  seen?: boolean;
  created_at?: DateTimeString;
}

export interface Notification {
  id: string;
  time: number;
  apiNotification: ApiNotification;
}

export const notificationMap = vue.reactive(new Map<string, Notification>());
export const friendRequestMap = vue.reactive(new Map<string, Notification>());

pubsub.subscribe("api:login", () => {
  notificationMap.clear();
  friendRequestMap.clear();
});

export function applyNotification(apiNotification: ApiNotification) {
  const { id, type, senderUserId, details, created_at } = apiNotification;
  if (id === void 0) {
    return;
  }

  let notification = notificationMap.get(id);
  if (notification === void 0) {
    notification = vue.reactive<Notification>({
      id,
      time: 0,
      apiNotification: {},
    });

    notificationMap.set(id, notification);

    if (senderUserId !== void 0) {
      if (type === ApiNotificationType.FriendRequest) {
        friendRequestMap.set(senderUserId, notification);
      }

      if (!userMap.has(senderUserId)) {
        lazyFetchUserIdSet.add(senderUserId);
      }
    }
  }

  if (created_at !== void 0) {
    notification.time = new Date(created_at).getTime();
  }

  try {
    if (typeof details === "string") {
      apiNotification.details = JSON.parse(details);
    }
  } catch {
    //
  }

  notification.apiNotification = vue.reactive(apiNotification);
}

export async function fetchNotificationList(n: number) {
  return api<ApiNotification[]>({
    method: ApiRequestMethod.GET,
    path: "auth/user/notifications",
    query: {
      n,
    },
  });
}

export async function clearAllNotification() {
  const response = await api<ApiNotification>({
    method: ApiRequestMethod.PUT,
    path: "auth/user/notifications/clear",
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    notificationMap.clear();
    pubsub.publish("notification:clearAllNotification");
  }

  return response;
}

export async function acceptNotification(notificationId: string) {
  const response = await api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: `auth/user/notifications/${notificationId}/accept`,
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    clearFriendRequest(notificationId);
  }

  return response;
}

export async function hideNotification(notificationId: string) {
  const response = await api<ApiNotification>({
    method: ApiRequestMethod.PUT,
    path: `auth/user/notifications/${notificationId}/hide`,
  });

  const { status } = response;
  if (status === ApiStatusCode.OK) {
    clearFriendRequest(notificationId);
  }

  return response;
}

export function clearFriendRequest(notificationId: string) {
  const notification = notificationMap.get(notificationId);
  if (notification === void 0) {
    return;
  }

  notificationMap.delete(notificationId);

  const { type, senderUserId } = notification.apiNotification;
  if (type === ApiNotificationType.FriendRequest && senderUserId !== void 0) {
    friendRequestMap.delete(senderUserId);
  }
}

export async function sendInvite(
  receiverUserId: string,
  data: Record<string, unknown>
) {
  return api<ApiNotification>({
    method: ApiRequestMethod.POST,
    path: `invite/${receiverUserId}`,
    body: data,
  });
}

export async function sendRequestInvite(
  receiverUserId: string,
  data: Record<string, unknown>
) {
  return api<ApiNotification>({
    method: ApiRequestMethod.POST,
    path: `requestInvite/${receiverUserId}`,
    body: data,
  });
}

export async function inviteMe(location: string) {
  return api<ApiNotification>({
    method: ApiRequestMethod.POST,
    path: `invite/myself/to/${location}`,
  });
}

export async function syncNotificationInternal() {
  const { status, data } = await fetchNotificationList(100);
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  notificationMap.clear();
  friendRequestMap.clear();

  for (const apiNotification of data) {
    applyNotification(apiNotification);
  }

  return true;
}
