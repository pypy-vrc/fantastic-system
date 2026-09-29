import { computed } from "vue";
import { formatDate } from "../../../../common/util.ts";
import { goUserPage } from "../../router.ts";
import {
  deletePlayerModeration,
  type ApiPlayerModerationTypeValue,
  type PlayerModeration,
} from "../../game/api/index.ts";

type Props = {
  playerModeration: PlayerModeration;
};

async function doDeletePlayerModeration(
  moderated: string,
  type: ApiPlayerModerationTypeValue,
) {
  try {
    const action = confirm("deletePlayerModeration");
    if (!action) {
      return;
    }

    await deletePlayerModeration(moderated, type);
  } catch (err) {
    console.error(err);
  }
}

export default {
  name: "PlayerModerationListItem",
  props: {
    playerModeration: Object,
  },
  components: {},
  setup(props: Props) {
    const playerModerationRef = computed(() => props.playerModeration);

    return {
      playerModeration: playerModerationRef,
      goUserPage: goUserPage,
      formatDate: formatDate,
      deletePlayerModeration: doDeletePlayerModeration,
    };
  },
};
