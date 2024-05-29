import * as vue from "vue";
import * as api from "../../game/api";
import * as VueNotificationListItem from "../notification-list-item/index.vue";

const notificationListRef = vue.computed(() => {
  const array = [...api.notificationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll() {
  try {
    // eslint-disable-next-line no-alert
    const action = confirm("clearAll");
    if (!action) {
      return;
    }

    await api.clearAllNotification();
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "NotificationListPage",
  components: {
    NotificationListItem: VueNotificationListItem.default,
  },
  setup() {
    return {
      notificationList: notificationListRef,
      refresh: api.refreshNotification,
      clearAll,
      async testInvite() {
        try {
          const location = "wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:0";

          await api.sendInvite(api.loginUser.id, {
            instanceId: location,
            worldId: location,
            worldName: "",
          });
        } catch (err) {
          console.error(err);
        }
      },
      async testRequestInvite() {
        try {
          await api.sendRequestInvite(api.loginUser.id, {
            platform: api.ApiPlatform.UnknownPlatform,
          });
        } catch (err) {
          console.error(err);
        }
      },
    };
  },
};
