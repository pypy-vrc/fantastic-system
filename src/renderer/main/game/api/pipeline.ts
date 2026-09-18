import noty from "noty";
import { escapeHtml, nop } from "../../../../common/util.ts";
import { publish, subscribe } from "../../../../common/pubsub.ts";
import {
  ApiStatusCode,
  isLoggedIn,
  lazyFetchUserIdSet,
  setFetchUserTimer,
  type DateTimeString,
} from "./base.ts";
import { applyObject } from "./internal.ts";
import {
  loginUser,
  fetchAuthToken,
  type ApiLoginUser,
} from "./endpoint/auth.ts";
import {
  ApiNotificationType,
  applyNotification,
  clearFriendRequest,
  notificationMap,
  type ApiNotification,
  type ApiNotificationTypeValue,
} from "./endpoint/notification.ts";
import {
  ApiUserState,
  applyUser,
  fetchFriendStatus,
  userMap,
  type ApiUser,
} from "./endpoint/user.ts";
import { applyWorld, type ApiWorld } from "./endpoint/world.ts";

let socket: WebSocket | undefined = void 0;
let socketUserId: string | undefined = void 0;

subscribe("api:logout", () => {
  closeSocket();
});

subscribe("pipeline:clear-notification", () => {
  notificationMap.clear();
});

type PipelineNotificationV2Delete = {
  ids: string[];
  version: number;
};

subscribe(
  "pipeline:notification-v2-delete",
  ({ ids }: PipelineNotificationV2Delete) => {
    for (const id of ids) {
      clearFriendRequest(id);
    }
  },
);

type PipelineFriendActive = {
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
};

subscribe(
  "pipeline:friend-active",
  ({ userId, user }: PipelineFriendActive) => {
    setFetchUserTimer(userId, 30 * 1000); // 30s

    user.state = ApiUserState.Active;

    applyUser(user);
  },
);

type PipelineFriendAdd = {
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
};

subscribe("pipeline:friend-add", ({ userId, user }: PipelineFriendAdd) => {
  delete user.state; // always offline

  applyUser(user);

  fetchFriendStatus(userId).catch(nop);
  lazyFetchUserIdSet.add(userId);
});

type PipelineFriendDelete = {
  userId: string;
};

subscribe("pipeline:friend-delete", ({ userId }: PipelineFriendDelete) => {
  lazyFetchUserIdSet.add(userId);
});

type PipelineFriendLocation = {
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
};

subscribe(
  "pipeline:friend-location",
  ({ user, location, world }: PipelineFriendLocation) => {
    if (world !== void 0) {
      applyWorld(world);
    }

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  },
);

type PipelineFriendOffline = {
  userId: string;
};

subscribe("pipeline:friend-offline", ({ userId }: PipelineFriendOffline) => {
  setFetchUserTimer(userId, 120 * 1000); // 2m

  const user = userMap.get(userId);
  if (user === void 0) {
    return;
  }

  applyUser({
    id: userId,
    state: ApiUserState.Offline,
  });
});

type PipelineFriendOnline = {
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
};

subscribe(
  "pipeline:friend-online",
  ({ user, location, world }: PipelineFriendOnline) => {
    if (world !== void 0) {
      applyWorld(world);
    }

    user.state = ApiUserState.Online;
    user.location = location;

    applyUser(user);
  },
);

type PipelineFriendUpdate = {
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
};

subscribe("pipeline:friend-update", ({ user }: PipelineFriendUpdate) => {
  delete user.state; // always offline

  applyUser(user);
});

subscribe("pipeline:hide-notification", (notificationId: string) => {
  clearFriendRequest(notificationId);
});

type PipelineNotification = {
  id: string;
  type: ApiNotificationTypeValue;
  senderUserId: string;
  senderUsername: string;
  receiverUserId: string;
  details: Record<string, unknown>;
  created_at: DateTimeString;
};

subscribe("pipeline:notification", (data: PipelineNotification) => {
  applyNotification(data as ApiNotification);

  if (data.type === ApiNotificationType.FriendRequest) {
    const user = userMap.get(data.senderUserId);
    if (user !== void 0) {
      user.incomingFriendRequest = true;
    }
  }

  publish("app:notify-menu", "notification-list-page");
});

subscribe("pipeline:see-notification", (notificationId: string) => {
  //
});

type PipelineUserLocation = {
  userId: string;
  location: string;
  intance: string;
  world: ApiWorld;
};

subscribe(
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
  },
);

type PipelineUserUpdate = {
  userId: string;
  user: ApiLoginUser;
};

subscribe("pipeline:user-update", ({ user }: PipelineUserUpdate) => {
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
  publish("pipeline:close");
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
  publish("pipeline:open");
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
        text: escapeHtml(data.err),
        timeout: 6000,
        queue: "api",
      }).show();

      closeSocket();
      return;
    }

    console.log("pipeline:data", data.type, data.content);

    switch (data.type) {
      case "clear-notification":
        publish("pipeline:clear-notification");
        break;

      case "friend-active": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-active", content);
        }
        break;
      }

      case "friend-add": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-add", content);
        }
        break;
      }

      case "friend-delete": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-delete", content);
        }
        break;
      }

      case "friend-location": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-location", content);
        }
        break;
      }

      case "friend-offline": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-offline", content);
        }
        break;
      }

      case "friend-online": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-online", content);
        }
        break;
      }

      case "friend-update": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:friend-update", content);
        }
        break;
      }

      case "hide-notification": {
        const { content } = data;
        if (typeof content === "string") {
          publish("pipeline:hide-notification", content);
        }
        break;
      }

      case "notification": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:notification", content);
        }
        break;
      }

      case "notification-v2-delete": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:notification-v2-delete", content);
        }
        break;
      }

      case "see-notification": {
        const { content } = data;
        if (typeof content === "string") {
          publish("pipeline:see-notification", content);
        }
        break;
      }

      case "user-location": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:user-location", content);
        }
        break;
      }

      case "user-update": {
        const content = JSON.parse(data.content);
        if (content === Object(content)) {
          publish("pipeline:user-update", content);
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
    socket.addEventListener("error", onSocketError);
    socket.addEventListener("close", onSocketClose);
    socket.addEventListener("open", onSocketOpen);
    socket.addEventListener("message", onSocketMessage);
  } catch (err) {
    console.error(err);
  }
}
