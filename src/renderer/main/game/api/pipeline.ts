import * as noty from 'noty';
import * as util from '../../../../util';
import * as pubsub from '../../../../pubsub';
import type {DateTimeString} from './base';
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchUserIdSet,
  setFetchUserTimer
} from './base';
import {applyObject} from './internal';
import type {ApiLoginUser} from './endpoint/auth';
import {loginUser, fetchAuthToken} from './endpoint/auth';
import type {ApiNotification} from './endpoint/notification';
import {
  ApiNotificationType,
  applyNotification,
  clearFriendRequest,
  notificationMap
} from './endpoint/notification';
import type {ApiUser} from './endpoint/user';
import {
  ApiUserState,
  applyUser,
  fetchFriendStatus,
  userMap
} from './endpoint/user';
import type {ApiWorld} from './endpoint/world';
import {applyWorld} from './endpoint/world';

let socket: WebSocket | undefined = void 0;
let socketUserId: string | undefined = void 0;

pubsub.subscribe('api:logout', () => {
  closeSocket();
});

pubsub.subscribe('pipeline:clear-notification', () => {
  notificationMap.clear();
});

interface PipelineFriendActive {
  userId: string;
  user: ApiUser;
}

pubsub.subscribe(
  'pipeline:friend-active',
  ({userId, user}: PipelineFriendActive) => {
    setFetchUserTimer(userId, 30 * 1000); // 30s

    user.state = ApiUserState.Active;

    applyUser(user);
  }
);

interface PipelineFriendAdd {
  userId: string;
  user: ApiUser;
}

pubsub.subscribe('pipeline:friend-add', ({userId, user}: PipelineFriendAdd) => {
  delete user.state; // always offline

  applyUser(user);

  fetchFriendStatus(userId).catch(util.nop);
  lazyFetchUserIdSet.add(userId);
});

interface PipelineFriendDelete {
  userId: string;
}

pubsub.subscribe('pipeline:friend-delete', ({userId}: PipelineFriendDelete) => {
  // {
  //     "userId": "usr_3d8f2631-80b3-4a5a-a424-f1a49a6f4bf0"
  // }

  lazyFetchUserIdSet.add(userId);
});

interface PipelineFriendLocation {
  userId: string;
  user: ApiUser;
  location: string;
  world: ApiWorld;
  canRequestInvite: boolean;
}

pubsub.subscribe(
  'pipeline:friend-location',
  ({user, location, world}: PipelineFriendLocation) => {
    applyWorld(world);

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  }
);

interface PipelineFriendOffline {
  userId: string;
}

pubsub.subscribe(
  'pipeline:friend-offline',
  ({userId}: PipelineFriendOffline) => {
    setFetchUserTimer(userId, 120 * 1000); // 2m

    let user = userMap.get(userId);
    if (user === void 0) {
      return;
    }

    applyUser({
      id: userId,
      state: ApiUserState.Offline
    });
  }
);

interface PipelineFriendOnline {
  userId: string;
  user: ApiUser;
  location: string;
  world: ApiWorld;
}

pubsub.subscribe(
  'pipeline:friend-online',
  ({user, location, world}: PipelineFriendOnline) => {
    applyWorld(world);

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  }
);

interface PipelineFriendUpdate {
  userId: string;
  user: ApiUser;
}

pubsub.subscribe('pipeline:friend-update', ({user}: PipelineFriendUpdate) => {
  delete user.state; // always offline

  applyUser(user);
});

pubsub.subscribe('pipeline:hide-notification', (notificationId: string) => {
  clearFriendRequest(notificationId);
});

interface PipelineNotification {
  id: string;
  type: ApiNotificationType;
  senderUserId: string;
  senderUsername: string;
  receiverUserId: string;
  details: {[key: string]: any};
  created_at: DateTimeString;
}

pubsub.subscribe('pipeline:notification', (data: PipelineNotification) => {
  applyNotification(data as ApiNotification);

  if (data.type === ApiNotificationType.FriendRequest) {
    let user = userMap.get(data.senderUserId);
    if (user !== void 0) {
      user.incomingFriendRequest = true;
    }
  }

  pubsub.publish('app:notify-menu', 'notification-list-page');
});

pubsub.subscribe('pipeline:see-notification', (notificationId: string) => {
  //
});

interface PipelineUserLocation {
  userId: string;
  location: string;
  intance: string;
  world: ApiWorld;
}

pubsub.subscribe(
  'pipeline:user-location',
  ({userId, location, world}: PipelineUserLocation) => {
    applyWorld(world);

    if (userId !== loginUser.id) {
      return;
    }

    applyUser({
      id: userId,
      location
    });
  }
);

interface PipelineUserUpdate {
  userId: string;
  user: ApiLoginUser;
}

pubsub.subscribe('pipeline:user-update', ({user}: PipelineUserUpdate) => {
  if (user.id !== loginUser.id) {
    return;
  }

  let changes = applyObject(loginUser.apiLoginUser, user);
  if (changes.length !== 0) {
    console.log('applyLoginUser', changes);
  }
});

function closeSocket(): void {
  if (socket === void 0) {
    return;
  }

  try {
    socket.close();
    socket = void 0;
  } catch (err) {
    console.error(err);
  }

  console.log('pipeline:close');
  pubsub.publish('pipeline:close');
}

function onSocketError(this: WebSocket): void {
  if (this !== socket) {
    this.close();
    return;
  }

  closeSocket();
}

function onSocketClose(this: WebSocket): void {
  if (this !== socket) {
    this.close();
    return;
  }

  closeSocket();
}

function onSocketOpen(this: WebSocket): void {
  if (this !== socket) {
    this.close();
    return;
  }

  console.log('pipeline:open');
  pubsub.publish('pipeline:open');
}

function onSocketMessage(this: WebSocket, event: MessageEvent): void {
  if (this !== socket) {
    this.close();
    return;
  }

  try {
    let data = JSON.parse(event.data);

    if (data.err !== void 0) {
      console.log('pipeline:data', data);

      new noty({
        type: 'error',
        layout: 'bottomRight',
        theme: 'sunset',
        text: util.escapeHtml(data.err),
        timeout: 6000,
        queue: 'api'
      }).show();

      closeSocket();
      return;
    }

    console.log('pipeline:data', data.type, data.content);

    switch (data.type) {
      case 'clear-notification':
        pubsub.publish('pipeline:clear-notification');
        break;

      case 'friend-active': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-active', content);
        }
        break;
      }

      case 'friend-add': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-add', content);
        }
        break;
      }

      case 'friend-delete': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-delete', content);
        }
        break;
      }

      case 'friend-location': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-location', content);
        }
        break;
      }

      case 'friend-offline': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-offline', content);
        }
        break;
      }

      case 'friend-online': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-online', content);
        }
        break;
      }

      case 'friend-update': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:friend-update', content);
        }
        break;
      }

      case 'hide-notification': {
        let {content} = data;
        if (typeof content === 'string') {
          pubsub.publish('pipeline:hide-notification', content);
        }
        break;
      }

      case 'notification': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:notification', content);
        }
        break;
      }

      case 'see-notification': {
        let {content} = data;
        if (typeof content === 'string') {
          pubsub.publish('pipeline:see-notification', content);
        }
        break;
      }

      case 'user-location': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:user-location', content);
        }
        break;
      }

      case 'user-update': {
        let content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish('pipeline:user-update', content);
        }
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export async function checkWebSocket(): Promise<void> {
  try {
    if (isLoggedIn.value === false) {
      closeSocket();
      return;
    }

    if (socketUserId !== loginUser.id) {
      socketUserId = loginUser.id;
      closeSocket();
    }

    if (socket !== void 0) {
      return;
    }

    let {status, data} = await fetchAuthToken();
    if (
      status !== ApiStatusCode.OK ||
      data === void 0 ||
      data.token === void 0
    ) {
      return;
    }

    socket = new WebSocket(`wss://pipeline.vrchat.cloud/?auth=${data.token}`);
    socket.onerror = onSocketError;
    socket.onclose = onSocketClose;
    socket.onopen = onSocketOpen;
    socket.onmessage = onSocketMessage;
  } catch (err) {
    console.error(err);
  }
}
