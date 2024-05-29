import * as noty from "noty";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import type { DateTimeString } from "./base";
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchUserIdSet,
  setFetchUserTimer,
} from "./base";
import { applyObject } from "./internal";
import type { ApiLoginUser } from "./endpoint/auth";
import { loginUser, fetchAuthToken } from "./endpoint/auth";
import type { ApiNotification } from "./endpoint/notification";
import {
  ApiNotificationType,
  applyNotification,
  clearFriendRequest,
  notificationMap,
} from "./endpoint/notification";
import type { ApiUser } from "./endpoint/user";
import {
  ApiUserState,
  applyUser,
  fetchFriendStatus,
  userMap,
} from "./endpoint/user";
import type { ApiWorld } from "./endpoint/world";
import { applyWorld } from "./endpoint/world";

let socket: WebSocket | undefined = void 0;
let socketUserId: string | undefined = void 0;

pubsub.subscribe("api:logout", () => {
  closeSocket();
});

pubsub.subscribe("pipeline:clear-notification", () => {
  notificationMap.clear();
});

interface PipelineNotificationV2Delete {
  ids: string[];
  version: number;
}

pubsub.subscribe(
  "pipeline:notification-v2-delete",
  ({ ids }: PipelineNotificationV2Delete) => {
    for (const id of ids) {
      clearFriendRequest(id);
    }
  }
);

interface PipelineFriendActive {
  userId: string;
  user: ApiUser;
  // userId: string;
  // user: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   userIcon: string;
  //   bio: string;
  //   bioLinks: string[];
  //   profilePicOverride: string;
  //   statusDescription: string;
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   state: 'offline'; // always offline
  //   tags: string[];
  //   developerType: string;
  //   last_login: string;
  //   last_platform: string;
  //   allowAvatarCopying: boolean;
  //   status: string;
  //   date_joined: string;
  //   isFriend: boolean;
  //   friendKey: string;
  //   last_activity: string;
  // };
}

pubsub.subscribe(
  "pipeline:friend-active",
  ({ userId, user }: PipelineFriendActive) => {
    setFetchUserTimer(userId, 30 * 1000); // 30s

    user.state = ApiUserState.Active;

    applyUser(user);
  }
);

interface PipelineFriendAdd {
  userId: string;
  user: ApiUser;
  // userId: string;
  // user: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   userIcon: string;
  //   bio: string;
  //   bioLinks: string[];
  //   profilePicOverride: string;
  //   statusDescription: string;
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   state: 'offline'; // always offline
  //   tags: string[];
  //   developerType: string;
  //   last_login: string;
  //   last_platform: string;
  //   allowAvatarCopying: boolean;
  //   status: string;
  //   date_joined: string;
  //   isFriend: boolean;
  //   friendKey: string;
  //   last_activity: string;
  // };
}

pubsub.subscribe(
  "pipeline:friend-add",
  ({ userId, user }: PipelineFriendAdd) => {
    delete user.state; // always offline

    applyUser(user);

    fetchFriendStatus(userId).catch(util.nop);
    lazyFetchUserIdSet.add(userId);
  }
);

interface PipelineFriendDelete {
  userId: string;
}

pubsub.subscribe(
  "pipeline:friend-delete",
  ({ userId }: PipelineFriendDelete) => {
    lazyFetchUserIdSet.add(userId);
  }
);

interface PipelineFriendLocation {
  userId: string;
  user: ApiUser;
  location: string;
  world: ApiWorld;
  canRequestInvite: boolean;
  // userId: string;
  // user: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   userIcon: string;
  //   bio: string;
  //   bioLinks: string[];
  //   profilePicOverride: string;
  //   statusDescription: string;
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   state: string;
  //   tags: string[];
  //   developerType: string;
  //   last_login: string;
  //   last_platform: string;
  //   allowAvatarCopying: boolean;
  //   status: string;
  //   date_joined: string;
  //   isFriend: boolean;
  //   friendKey: string;
  //   last_activity: string;
  // };
  // location: string;
  // travelingToLocation: string;
  // world: {
  //   id: string;
  //   name: string;
  //   description: string;
  //   featured: boolean;
  //   authorId: string;
  //   authorName: string;
  //   capacity: number;
  //   tags: string[];
  //   releaseStatus: string;
  //   imageUrl: string;
  //   thumbnailImageUrl: string;
  //   assetUrl: string;
  //   assetUrlObject: Record<string, unknown>;
  //   pluginUrl: string;
  //   pluginUrlObject: Record<string, unknown>;
  //   unityPackageUrl: string;
  //   unityPackageUrlObject: Record<string, unknown>;
  //   namespace: string;
  //   unityPackages: {
  //     id: string;
  //     assetUrl: string;
  //     assetUrlObject: Record<string, unknown>;
  //     pluginUrl: string;
  //     pluginUrlObject: Record<string, unknown>;
  //     unityVersion: string;
  //     unitySortNumber: number;
  //     assetVersion: number;
  //     platform: string;
  //     created_at: string;
  //   }[];
  //   version: number;
  //   organization: string;
  //   previewYoutubeId: string | null;
  //   favorites: number;
  //   created_at: string;
  //   updated_at: string;
  //   publicationDate: string;
  //   labsPublicationDate: string;
  //   visits: number;
  //   popularity: number;
  //   heat: number;
  // };
  // canRequestInvite: boolean;
}

pubsub.subscribe(
  "pipeline:friend-location",
  ({ user, location, world }: PipelineFriendLocation) => {
    if (world !== void 0) {
      applyWorld(world);
    }

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  }
);

interface PipelineFriendOffline {
  userId: string;
}

pubsub.subscribe(
  "pipeline:friend-offline",
  ({ userId }: PipelineFriendOffline) => {
    setFetchUserTimer(userId, 120 * 1000); // 2m

    const user = userMap.get(userId);
    if (user === void 0) {
      return;
    }

    applyUser({
      id: userId,
      state: ApiUserState.Offline,
    });
  }
);

interface PipelineFriendOnline {
  userId: string;
  user: ApiUser;
  location: string;
  world: ApiWorld;
  // userId: string;
  // user: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   userIcon: string;
  //   bio: string;
  //   bioLinks: string[];
  //   profilePicOverride: string;
  //   statusDescription: string;
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   state: 'offline'; // always offline
  //   tags: string[];
  //   developerType: string;
  //   last_login: string;
  //   last_platform: string;
  //   allowAvatarCopying: boolean;
  //   status: string;
  //   date_joined: string;
  //   isFriend: boolean;
  //   friendKey: string;
  //   last_activity: string;
  // };
  // location: string;
  // travelingToLocation: string;
  // world: Record<string, never>;
  // canRequestInvite: boolean;
}

pubsub.subscribe(
  "pipeline:friend-online",
  ({ user, location, world }: PipelineFriendOnline) => {
    if (world !== void 0) {
      applyWorld(world);
    }

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  }
);

interface PipelineFriendUpdate {
  userId: string;
  user: ApiUser;
  // userId: string;
  // user: {
  //   id: string;
  //   username: string;
  //   displayName: string;
  //   userIcon: string;
  //   bio: string;
  //   bioLinks: string[];
  //   profilePicOverride: string;
  //   statusDescription: string;
  //   currentAvatarImageUrl: string;
  //   currentAvatarThumbnailImageUrl: string;
  //   state: 'offline'; // always offline
  //   tags: string[];
  //   developerType: string;
  //   last_login: string;
  //   last_platform: string;
  //   allowAvatarCopying: boolean;
  //   status: string;
  //   date_joined: string;
  //   isFriend: boolean;
  //   friendKey: string;
  //   last_activity: string;
  // };
}

pubsub.subscribe("pipeline:friend-update", ({ user }: PipelineFriendUpdate) => {
  delete user.state; // always offline

  applyUser(user);
});

pubsub.subscribe("pipeline:hide-notification", (notificationId: string) => {
  clearFriendRequest(notificationId);
});

interface PipelineNotification {
  id: string;
  type: ApiNotificationType;
  senderUserId: string;
  senderUsername: string;
  receiverUserId: string;
  details: Record<string, unknown>;
  created_at: DateTimeString;
}

pubsub.subscribe("pipeline:notification", (data: PipelineNotification) => {
  applyNotification(data as ApiNotification);

  if (data.type === ApiNotificationType.FriendRequest) {
    const user = userMap.get(data.senderUserId);
    if (user !== void 0) {
      user.incomingFriendRequest = true;
    }
  }

  pubsub.publish("app:notify-menu", "notification-list-page");
});

pubsub.subscribe("pipeline:see-notification", (notificationId: string) => {
  notificationId;
});

interface PipelineUserLocation {
  userId: string;
  location: string;
  intance: string;
  world: ApiWorld;
}

pubsub.subscribe(
  "pipeline:user-location",
  ({ userId, location, world }: PipelineUserLocation) => {
    if (world !== void 0) {
      applyWorld(world);
    }

    if (userId !== loginUser.id) {
      return;
    }

    applyUser({
      id: userId,
      location,
    });
  }
);

interface PipelineUserUpdate {
  userId: string;
  user: ApiLoginUser;
}

pubsub.subscribe("pipeline:user-update", ({ user }: PipelineUserUpdate) => {
  if (user.id !== loginUser.id) {
    return;
  }

  const changes = applyObject(loginUser.apiLoginUser, user);
  if (changes.length !== 0) {
    console.log("applyLoginUser", changes);
  }
});

function closeSocket() {
  if (socket === void 0) {
    return;
  }

  try {
    socket.close();
    socket = void 0;
  } catch (err) {
    console.error(err);
  }

  console.log("pipeline:close");
  pubsub.publish("pipeline:close");
}

function onSocketError(this: WebSocket) {
  if (this !== socket) {
    this.close();
    return;
  }

  closeSocket();
}

function onSocketClose(this: WebSocket) {
  if (this !== socket) {
    this.close();
    return;
  }

  closeSocket();
}

function onSocketOpen(this: WebSocket) {
  if (this !== socket) {
    this.close();
    return;
  }

  console.log("pipeline:open");
  pubsub.publish("pipeline:open");
}

function onSocketMessage(this: WebSocket, event: MessageEvent) {
  if (this !== socket) {
    this.close();
    return;
  }

  try {
    const data = JSON.parse(event.data);

    if (data.err !== void 0) {
      console.log("pipeline:data", data);

      new noty({
        type: "error",
        layout: "bottomRight",
        theme: "sunset",
        text: util.escapeHtml(data.err),
        timeout: 6000,
        queue: "api",
      }).show();

      closeSocket();
      return;
    }

    console.log("pipeline:data", data.type, data.content);

    switch (data.type) {
      case "clear-notification":
        pubsub.publish("pipeline:clear-notification");
        break;

      case "friend-active": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-active", content);
        }
        break;
      }

      case "friend-add": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-add", content);
        }
        break;
      }

      case "friend-delete": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-delete", content);
        }
        break;
      }

      case "friend-location": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-location", content);
        }
        break;
      }

      case "friend-offline": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-offline", content);
        }
        break;
      }

      case "friend-online": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-online", content);
        }
        break;
      }

      case "friend-update": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:friend-update", content);
        }
        break;
      }

      case "hide-notification": {
        const { content } = data;
        if (typeof content === "string") {
          pubsub.publish("pipeline:hide-notification", content);
        }
        break;
      }

      case "notification": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:notification", content);
        }
        break;
      }

      case "notification-v2-delete": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:notification-v2-delete", content);
        }
        break;
      }

      case "see-notification": {
        const { content } = data;
        if (typeof content === "string") {
          pubsub.publish("pipeline:see-notification", content);
        }
        break;
      }

      case "user-location": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:user-location", content);
        }
        break;
      }

      case "user-update": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          pubsub.publish("pipeline:user-update", content);
        }
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export async function checkWebSocket() {
  try {
    if (!isLoggedIn.value) {
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

    const { status, data } = await fetchAuthToken();
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
