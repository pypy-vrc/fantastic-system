import * as vue from 'vue';
import * as util from '../../../../util';
import * as router from '../../router';
import * as api from '../../game/api';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

interface Props {
  notification: api.Notification;
}

export default {
  name: 'NotificationListItem',
  props: {
    notification: Object
  },
  components: {
    Location: require('../location').default
  },
  setup(props: Props): any {
    let notificationRef = vue.computed(() => props.notification);

    return {
      notification: notificationRef,
      formatDate: util.formatDate,
      clickSender(): void {
        let {senderUserId} = notificationRef.value.apiNotification;
        if (senderUserId === void 0) {
          return;
        }

        router.goUserPage(senderUserId);
      },
      async hideNotification(): Promise<void> {
        try {
          // eslint-disable-next-line no-alert
          let action = confirm('hideNotification');
          if (action === false) {
            return;
          }

          await api.hideNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async acceptFriendRequest(): Promise<void> {
        try {
          // eslint-disable-next-line no-alert
          let action = confirm('acceptFriendRequest');
          if (action === false) {
            return;
          }

          await api.acceptNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async declineFriendRequest(): Promise<void> {
        try {
          // eslint-disable-next-line no-alert
          let action = confirm('declineFriendRequest');
          if (action === false) {
            return;
          }

          await api.hideNotification(notificationRef.value.id);
        } catch (err) {
          console.error(err);
        }
      },
      async sendInviteMe(): Promise<void> {
        try {
          let {details} = notificationRef.value.apiNotification;
          if (typeof details !== 'object') {
            return;
          }

          let {worldId, worldName} = details;
          if (worldId === void 0) {
            return;
          }

          // eslint-disable-next-line no-alert
          let action = confirm(`inviteMe: ${worldId}`);
          if (action === false) {
            return;
          }

          await api.sendInvite(api.loginUser.id, {
            instanceId: worldId,
            worldId,
            worldName
          });
        } catch (err) {
          console.error(err);
        }
      },
      async playGame(): Promise<void> {
        try {
          let {details} = notificationRef.value.apiNotification;
          if (typeof details !== 'object') {
            return;
          }

          let {worldId, worldName} = details;
          if (worldId === void 0) {
            return;
          }

          // eslint-disable-next-line no-alert
          let action = confirm(`playGame: ${worldId}`);
          if (action === false) {
            return;
          }

          await ipcRenderer.invoke(
            'native:playGame',
            `vrchat://launch?id=${worldId}`
          );
        } catch (err) {
          console.error(err);
        }
      }
    };
  }
};
