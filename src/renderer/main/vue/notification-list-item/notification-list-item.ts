import * as vue from "vue";
import * as util from "../../../../common/util";
import * as router from "../../router";
import * as api from "../../game/api";
import * as VueLocation from "../location/index.vue";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  notification: api.Notification;
}

export default {
  name: "NotificationListItem",
  props: {
    notification: Object,
  },
  components: {
    Location: VueLocation.default,
  },
  setup(props: Props) {
    const notificationRef = vue.computed(() => props.notification);

    return {
      notification: notificationRef,
      formatDate: util.formatDate,
      clickSender() {
        const { senderUserId } = notificationRef.value.apiNotification;
        if (senderUserId === void 0) {
          return;
        }

        router.goUserPage(senderUserId);
      },
      async hideNotification() {
        try {
          // eslint-disable-next-line no-alert
          const action = confirm("hideNotification");
          if (!action) {
            return;
          }

          await api.hideNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async acceptFriendRequest() {
        try {
          // eslint-disable-next-line no-alert
          const action = confirm("acceptFriendRequest");
          if (!action) {
            return;
          }

          await api.acceptNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async declineFriendRequest() {
        try {
          // eslint-disable-next-line no-alert
          const action = confirm("declineFriendRequest");
          if (!action) {
            return;
          }

          await api.hideNotification(notificationRef.value.id);
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

          // eslint-disable-next-line no-alert
          const action = confirm(`sendInviteMe: ${worldId}`);
          if (!action) {
            return;
          }

          await api.inviteMe(worldId);
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

          // eslint-disable-next-line no-alert
          const action = confirm(`playGame: ${worldId}`);
          if (!action) {
            return;
          }

          const response = await api.fetchWorldInstanceShortName(worldId);

          await ipcRenderer.invoke(
            "native:playGame",
            `vrchat://launch?id=${worldId}&shortName=${
              response.data?.secureName ?? ""
            }`
          );
        } catch (err) {
          console.error(err);
        }
      },
    };
  },
};
