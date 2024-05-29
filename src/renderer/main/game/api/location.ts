export const enum ReservedLocation {
  Offline = "offline",
  InBetween = "inbetween",
  Private = "private",
  Traveling = "traveling",
}

export const enum InstanceAccessType {
  FriendsOfGuests = "friends+",
  FriendsOnly = "friends",
  InviteOnly = "invite",
  InvitePlus = "invite+",
  Public = "public",
  Group = "group",
}

export const enum GroupAccessType {
  Members = "members",
  Plus = "plus",
  Public = "public",
}

export const enum NetworkRegion {
  US_West = "us", // default value, omitted
  US_Ease = "use",
  Japan = "jp",
  Europe = "eu",
}

export interface LocationInfo {
  location: string;
  isOffline?: boolean;
  isPrivate?: boolean;
  isTraveling?: boolean;
  worldId?: string;
  instanceId?: string;
  name?: string;
  region?: NetworkRegion;
  accessType?: InstanceAccessType;
  groupAccessType?: GroupAccessType;
  displayAccessType?: string;
  ownerId?: string;
}

export function parseLocation(location: string): LocationInfo {
  if (
    typeof location !== "string" ||
    location.length === 0 ||
    location === ReservedLocation.Offline ||
    location === ReservedLocation.InBetween
  ) {
    return {
      location: ReservedLocation.Offline,
      isOffline: true,
    };
  }

  const locationInfo: LocationInfo = {
    location,
  };

  if (location === ReservedLocation.Private) {
    locationInfo.isPrivate = true;
    return locationInfo;
  }

  if (location === ReservedLocation.Traveling) {
    locationInfo.isTraveling = true;
    return locationInfo;
  }

  const pos = location.indexOf(":");
  if (pos < 0) {
    locationInfo.worldId = location;
    return locationInfo;
  }

  locationInfo.worldId = location.slice(0, pos);
  locationInfo.instanceId = location.slice(pos + 1);

  const instanceTags = locationInfo.instanceId.split("~");
  locationInfo.name = instanceTags[0];
  locationInfo.region = NetworkRegion.US_West;

  let canRequestInvite = false;
  let friendsId: string | undefined = void 0;
  let groupId: string | undefined = void 0;
  let hiddenId: string | undefined = void 0;
  let privateId: string | undefined = void 0;

  const { length } = instanceTags;
  for (let i = 1; i < length; ++i) {
    let tagName = instanceTags[i];
    let tagData = "";

    const start = tagName.indexOf("(") + 1;
    if (start > 0) {
      const end = tagName.lastIndexOf(")");
      if (end > start) {
        tagData = tagName.slice(start, end);
        tagName = tagName.slice(0, start - 1);
      }
    }

    switch (tagName) {
      case "canRequestInvite":
        canRequestInvite = true;
        break;

      case "friends":
        friendsId = tagData;
        break;

      case "group":
        groupId = tagData;
        break;

      case "groupAccessType":
        locationInfo.groupAccessType = tagData as GroupAccessType;
        break;

      case "hidden":
        hiddenId = tagData;
        break;

      case "private":
        privateId = tagData;
        break;

      case "region":
        locationInfo.region = tagData as NetworkRegion;
        break;
    }
  }

  if (privateId !== void 0) {
    if (canRequestInvite) {
      locationInfo.accessType = InstanceAccessType.InvitePlus;
      // locationInfo.accessDetail = 'Invite Plus';
    } else {
      locationInfo.accessType = InstanceAccessType.InviteOnly;
      // locationInfo.accessDetail = 'Invite Only';
    }
    locationInfo.ownerId = privateId;
  } else if (groupId !== void 0) {
    locationInfo.accessType = InstanceAccessType.Group;
    // locationInfo.accessDetail = 'Group Only';
    locationInfo.ownerId = groupId;
  } else if (friendsId !== void 0) {
    locationInfo.accessType = InstanceAccessType.FriendsOnly;
    // locationInfo.accessDetail = 'Friends Only';
    locationInfo.ownerId = friendsId;
  } else if (hiddenId !== void 0) {
    locationInfo.accessType = InstanceAccessType.FriendsOfGuests;
    // locationInfo.accessDetail = 'Friends of Guests';
    locationInfo.ownerId = hiddenId;
  } else {
    locationInfo.accessType = InstanceAccessType.Public;
    // locationInfo.accessDetail = 'Public';
  }

  if (locationInfo.accessType === InstanceAccessType.Group) {
    if (locationInfo.groupAccessType === GroupAccessType.Public) {
      locationInfo.displayAccessType = "group public";
    } else if (locationInfo.groupAccessType === GroupAccessType.Plus) {
      locationInfo.displayAccessType = "group+";
    } else {
      locationInfo.displayAccessType = "group";
    }
  } else {
    locationInfo.displayAccessType = locationInfo.accessType;
  }

  // { name: 'pop', type: 'popcount', accessDetail: '[Internal Use Only] Population Counter' }

  return locationInfo;
}
