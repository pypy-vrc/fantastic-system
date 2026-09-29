import { computed } from "vue";
import { goUserPage } from "../../router.ts";
import { worldMap, type User } from "../../game/api/index.ts";

type Props = {
  user: User;
};

export default {
  name: "FriendListItem",
  props: {
    user: Object,
  },
  setup(props: Props) {
    const userRef = computed(() => props.user);

    return {
      user: userRef,
      world: computed(() => {
        // console.log('FriendListItem:world', props.user.id);
        const { worldId } = userRef.value.locationInfo;
        if (worldId === void 0) {
          return;
        }

        return worldMap.get(worldId);
      }),
      goUserPage,
    };
  },
};
