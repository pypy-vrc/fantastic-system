import * as vue from "vue";
import { goUserPage } from "../../router";
import * as api from "../../game/api";

interface Props {
  user: api.User;
}

export default {
  name: "FriendListItem",
  props: {
    user: Object,
  },
  setup(props: Props) {
    const userRef = vue.computed(() => props.user);

    return {
      user: userRef,
      world: vue.computed(() => {
        // console.log('FriendListItem:world', props.user.id);
        const { worldId } = userRef.value.locationInfo;
        if (worldId === void 0) {
          return;
        }

        return api.worldMap.get(worldId);
      }),
      goUserPage,
    };
  },
};
