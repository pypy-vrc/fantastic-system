import * as vue from 'vue';
import * as api from '../../game/api';

let notificationListRef = vue.computed(() => {
  let array = [...api.notificationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll(): Promise<void> {
  try {
    // eslint-disable-next-line no-alert
    let action = confirm('clearAll');
    if (action === false) {
      return;
    }

    await api.clearAllNotification();
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: 'NotificationListPage',
  components: {
    NotificationListItem: require('../notification-list-item').default
  },
  setup(): any {
    return {
      notificationList: notificationListRef,
      refresh: api.refreshNotification,
      clearAll,
      async testInvite(): Promise<void> {
        try {
          let location = 'wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:0';

          await api.sendInvite(api.loginUser.id, {
            instanceId: location,
            worldId: location,
            worldName: ''
          });
        } catch (err) {
          console.error(err);
        }
      },
      async testRequestInvite(): Promise<void> {
        try {
          await api.sendRequestInvite(api.loginUser.id, {
            platform: api.ApiPlatform.UnknownPlatform
          });
        } catch (err) {
          console.error(err);
        }
      }
    };
  }
};
