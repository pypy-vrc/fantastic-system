import * as vue from "vue";
import * as api from "../../game/api";
import { NetworkRegion } from "../../game/api";
import { goWorldPage } from "../../router";

interface Props {
  location: string;
  worldName?: string;
  clickable: boolean;
  isHideWorldName: boolean;
}

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
    const locationInfoRef = vue.computed(() => {
      const location = props.location;
      // console.log('watch location', location);
      return api.parseLocation(location);
    });

    return {
      locationInfo: locationInfoRef,
      worldName: vue.computed(() => props.worldName),
      isHideWorldName: vue.computed(() => props.isHideWorldName),
      world: vue.computed(() => {
        const { worldId } = locationInfoRef.value;
        if (worldId === void 0) {
          return;
        }

        return api.worldMap.get(worldId);
      }),
      regionClass: vue.computed(() => {
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
