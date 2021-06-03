import * as vue from 'vue';
import * as pubsub from '../../../../../pubsub';
import type {ApiResponse, ApiSuccess, DateTimeString} from '../base';
import {ApiStatusCode, lazyFetchUserIdSet} from '../base';
import {api, ApiRequestMethod} from '../internal';
import {userMap} from './user';

export const enum ApiNotificationType {
  Message = 'message',
  FriendRequest = 'friendRequest',
  Invite = 'invite',
  ReqeustInvite = 'requestInvite',
  InviteResponse = 'inviteResponse',
  ReqeustInviteResponse = 'requestInviteResponse'
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

export let notificationMap = vue.reactive(new Map<string, Notification>());
export let friendRequestMap = vue.reactive(new Map<string, Notification>());

pubsub.subscribe('api:login', () => {
  notificationMap.clear();
  friendRequestMap.clear();
});

export function applyNotification(apiNotification: ApiNotification): void {
  let {id, type, senderUserId, details, created_at} = apiNotification;
  if (id === void 0) {
    return;
  }

  let notification = notificationMap.get(id);
  if (notification === void 0) {
    notification = vue.reactive<Notification>({
      id,
      time: 0,
      apiNotification: {}
    });

    notificationMap.set(id, notification);

    if (senderUserId !== void 0) {
      if (type === ApiNotificationType.FriendRequest) {
        friendRequestMap.set(senderUserId, notification);
      }

      if (userMap.has(senderUserId) === false) {
        lazyFetchUserIdSet.add(senderUserId);
      }
    }
  }

  if (created_at !== void 0) {
    notification.time = new Date(created_at).getTime();
  }

  try {
    if (typeof details === 'string') {
      apiNotification.details = JSON.parse(details);
    }
  } catch {}

  notification.apiNotification = vue.reactive(apiNotification);
}

export async function fetchNotificationList(
  n: number
): Promise<ApiResponse<ApiNotification[]>> {
  return api<ApiNotification[]>({
    method: ApiRequestMethod.GET,
    path: 'auth/user/notifications',
    query: {
      n
    }
  });
}

export async function clearAllNotification(): Promise<
  ApiResponse<ApiNotification>
> {
  let response = await api<ApiNotification>({
    method: ApiRequestMethod.PUT,
    path: 'auth/user/notifications/clear'
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    notificationMap.clear();
    pubsub.publish('notification:clearAllNotification');
  }

  return response;
}

export async function acceptNotification(
  notificationId: string
): Promise<ApiResponse<ApiSuccess>> {
  let response = await api<ApiSuccess>({
    method: ApiRequestMethod.PUT,
    path: `auth/user/notifications/${notificationId}/accept`
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    clearFriendRequest(notificationId);
  }

  return response;
}

export async function hideNotification(
  notificationId: string
): Promise<ApiResponse<ApiNotification>> {
  let response = await api<ApiNotification>({
    method: ApiRequestMethod.PUT,
    path: `auth/user/notifications/${notificationId}/hide`
  });

  let {status} = response;
  if (status === ApiStatusCode.OK) {
    clearFriendRequest(notificationId);
  }

  return response;
}

export function clearFriendRequest(notificationId: string): void {
  let notification = notificationMap.get(notificationId);
  if (notification === void 0) {
    return;
  }

  notificationMap.delete(notificationId);

  let {type, senderUserId} = notification.apiNotification;
  if (type === ApiNotificationType.FriendRequest && senderUserId !== void 0) {
    friendRequestMap.delete(senderUserId);
  }
}

export async function sendInvite(
  receiverUserId: string,
  data: {[key: string]: any}
): Promise<ApiResponse<ApiNotification>> {
  return api<ApiNotification>({
    method: ApiRequestMethod.POST,
    path: `invite/${receiverUserId}`,
    body: data
  });
}

export async function sendRequestInvite(
  receiverUserId: string,
  data: {[key: string]: any}
): Promise<ApiResponse<ApiNotification>> {
  return api<ApiNotification>({
    method: ApiRequestMethod.POST,
    path: `requestInvite/${receiverUserId}`,
    body: data
  });
}

export async function syncNotificationInternal(): Promise<boolean> {
  let {status, data} = await fetchNotificationList(100);
  if (status !== ApiStatusCode.OK || data === void 0) {
    return false;
  }

  notificationMap.clear();
  friendRequestMap.clear();

  for (let apiNotification of data) {
    applyNotification(apiNotification);
  }

  return true;
}
