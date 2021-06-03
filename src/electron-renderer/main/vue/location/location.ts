import * as vue from 'vue';
import * as api from '../../game/api';
import {LocationRegion} from '../../game/api';
import {goWorldPage} from '../../router';

interface Props {
  location: string;
  worldName?: string;
  clickable: boolean;
  isHideWorldName: boolean;
}

export default {
  name: 'Location',
  props: {
    location: String,
    worldName: {
      type: String,
      required: false
    },
    clickable: {
      type: Boolean,
      default: false
    },
    isHideWorldName: {
      type: Boolean,
      default: false
    }
  },
  setup(props: Props): any {
    let locationInfoRef = vue.computed(() => {
      let location = props.location;
      // console.log('watch location', location);
      return api.parseLocation(location);
    });

    return {
      locationInfo: locationInfoRef,
      worldName: vue.computed(() => props.worldName),
      isHideWorldName: vue.computed(() => props.isHideWorldName),
      world: vue.computed(() => {
        let {worldId} = locationInfoRef.value;
        if (worldId === void 0) {
          return;
        }

        return api.worldMap.get(worldId);
      }),
      regionClass: vue.computed(() => {
        let {region} = locationInfoRef.value;

        if (region === LocationRegion.EU) {
          return 'europeanunion';
        }

        if (region === LocationRegion.JP) {
          return 'jp';
        }

        return 'us';
      }),
      clickLocation(): void {
        if (props.clickable !== true) {
          return;
        }

        let {worldId} = locationInfoRef.value;
        if (worldId === void 0) {
          return;
        }

        goWorldPage(worldId);
      }
    };
  }
};
