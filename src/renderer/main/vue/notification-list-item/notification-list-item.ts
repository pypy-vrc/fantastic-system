import { computed } from "vue";
import { formatDate } from "../../../../common/util.ts";
import { goUserPage } from "../../router.ts";
import {
  acceptNotification,
  fetchWorldInstanceShortName,
  hideNotification,
  inviteMe,
  type Notification,
} from "../../game/api/index.ts";
import VueLocation from "../location/index.vue";

const { ipcRenderer } = window;

type Props = {
  notification: Notification;
};

export default {
  name: "NotificationListItem",
  props: {
    notification: Object,
  },
  components: {
    Location: VueLocation,
  },
  setup(props: Props) {
    const notificationRef = computed(() => props.notification);

    return {
      notification: notificationRef,
      formatDate: formatDate,
      clickSender() {
        const { senderUserId } = notificationRef.value.apiNotification;
        if (senderUserId === void 0) {
          return;
        }

        goUserPage(senderUserId);
      },
      async hideNotification() {
        try {
          const action = confirm("hideNotification");
          if (!action) {
            return;
          }

          await hideNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async acceptFriendRequest() {
        try {
          const action = confirm("acceptFriendRequest");
          if (!action) {
            return;
          }

          await acceptNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async declineFriendRequest() {
        try {
          const action = confirm("declineFriendRequest");
          if (!action) {
            return;
          }

          await hideNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async sendInviteMe() {
        try {
          const { details } = notificationRef.value.apiNotification;
          if (typeof details !== "object") {
            return;
          }

          const { worldId } = details;
          if (worldId === void 0) {
            return;
          }

          const action = confirm(`sendInviteMe: ${worldId}`);
          if (!action) {
            return;
          }

          await inviteMe(worldId);
        } catch (err) {
          console.error(err);
        }
      },
      async playGame() {
        try {
          const { details } = notificationRef.value.apiNotification;
          if (typeof details !== "object") {
            return;
          }

          const { worldId } = details;
          if (worldId === void 0) {
            return;
          }

          const action = confirm(`playGame: ${worldId}`);
          if (!action) {
            return;
          }

          const response = await fetchWorldInstanceShortName(worldId);

          await ipcRenderer.invoke(
            "native:playGame",
            `vrchat://launch?id=${worldId}&shortName=${
              response.data?.secureName || ""
            }`,
          );
        } catch (err) {
          console.error(err);
        }
      },
    };
  },
};
