import { computed } from "vue";
import { parseLocation, worldMap } from "../../game/api/index.ts";
import { NetworkRegion } from "../../game/api/index.ts";
import { goWorldPage } from "../../router.ts";

type Props = {
  location: string;
  worldName?: string;
  clickable: boolean;
  isHideWorldName: boolean;
};

export default {
  name: "Location",
  props: {
    location: String,
    worldName: {
      type: String,
      required: false,
    },
    clickable: {
      type: Boolean,
      default: false,
    },
    isHideWorldName: {
      type: Boolean,
      default: false,
    },
  },
  setup(props: Props) {
    const locationInfoRef = computed(() => {
      const location = props.location;
      // console.log('watch location', location);
      return parseLocation(location);
    });

    return {
      locationInfo: locationInfoRef,
      worldName: computed(() => props.worldName),
      isHideWorldName: computed(() => props.isHideWorldName),
      world: computed(() => {
        const { worldId } = locationInfoRef.value;
        if (worldId === void 0) {
          return;
        }

        return worldMap.get(worldId);
      }),
      regionClass: computed(() => {
        const { region } = locationInfoRef.value;

        if (region === NetworkRegion.Europe) {
          return "europeanunion";
        }

        if (region === NetworkRegion.Japan) {
          return "jp";
        }

        return "us";
      }),
      clickLocation() {
        if (props.clickable !== true) {
          return;
        }

        const { worldId } = locationInfoRef.value;
        if (worldId === void 0) {
          return;
        }

        goWorldPage(worldId);
      },
    };
  },
};
