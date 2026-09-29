import { computed } from "vue";
import {
  ApiPlatform,
  clearAllNotification,
  loginUser,
  notificationMap,
  refreshNotification,
  sendInvite,
  sendRequestInvite,
} from "../../game/api/index.ts";
import VueNotificationListItem from "../notification-list-item/index.vue";

const notificationListRef = computed(() => {
  const array = [...notificationMap.values()];
  array.sort((a, b) => b.time - a.time);
  return array;
});

async function clearAll() {
  try {
    const action = confirm("clearAll");
    if (!action) {
      return;
    }

    await clearAllNotification();
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "NotificationListPage",
  components: {
    NotificationListItem: VueNotificationListItem,
  },
  setup() {
    return {
      notificationList: notificationListRef,
      refresh: refreshNotification,
      clearAll,
      async testInvite() {
        try {
          const location = "wrld_4432ea9b-729c-46e3-8eaf-846aa0a37fdd:0";
          await sendInvite(loginUser.id, {
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
          await sendRequestInvite(loginUser.id, {
            platform: ApiPlatform.UnknownPlatform,
          });
        } catch (err) {
          console.error(err);
        }
      },
    };
  },
};
