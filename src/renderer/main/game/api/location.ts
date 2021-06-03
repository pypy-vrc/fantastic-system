export const enum ReservedLocation {
  Offline = 'offline',
  InBetween = 'inbetween',
  Private = 'private'
}

export const enum InstanceAccessType {
  FriendsOfGuests = 'friends+',
  FriendsOnly = 'friends',
  InviteOnly = 'invite',
  InvitePlus = 'invite+',
  Public = 'public'
}

export const enum LocationRegion {
  US = 'us', // default value, omitted
  EU = 'eu',
  JP = 'jp'
}

export interface LocationInfo {
  location: string;
  isOffline?: boolean;
  isPrivate?: boolean;
  worldId?: string;
  instanceId?: string;
  name?: string;
  region?: LocationRegion;
  accessType?: InstanceAccessType;
  ownerId?: string;
}

export function parseLocation(location: string): LocationInfo {
  if (
    typeof location !== 'string' ||
    location.length === 0 ||
    location === ReservedLocation.Offline ||
    location === ReservedLocation.InBetween
  ) {
    return {
      location: ReservedLocation.Offline,
      isOffline: true
    };
  }

  let locationInfo: LocationInfo = {
    location
  };

  if (location === ReservedLocation.Private) {
    locationInfo.isPrivate = true;
    return locationInfo;
  }

  let pos = location.indexOf(':');
  if (pos < 0) {
    locationInfo.worldId = location;
    return locationInfo;
  }

  locationInfo.worldId = location.substr(0, pos);
  locationInfo.instanceId = location.substr(pos + 1);

  let instanceTags = locationInfo.instanceId.split('~');
  locationInfo.name = instanceTags[0];
  locationInfo.region = LocationRegion.US;

  let canRequestInvite = false;
  let privateId: string | undefined = void 0;
  let friendsId: string | undefined = void 0;
  let hiddenId: string | undefined = void 0;

  let {length} = instanceTags;
  for (let i = 1; i < length; ++i) {
    let tagName = instanceTags[i];
    let tagData = '';

    let start = tagName.indexOf('(') + 1;
    if (start > 0) {
      let end = tagName.lastIndexOf(')');
      if (end > start) {
        tagData = tagName.substr(start, end - start);
        tagName = tagName.substr(0, start - 1);
      }
    }

    switch (tagName) {
      case 'canRequestInvite':
        canRequestInvite = true;
        break;

      case 'friends':
        friendsId = tagData;
        break;

      case 'hidden':
        hiddenId = tagData;
        break;

      case 'private':
        privateId = tagData;
        break;

      case 'region':
        locationInfo.region = tagData as LocationRegion;
        break;
    }
  }

  if (privateId !== void 0) {
    if (canRequestInvite === true) {
      locationInfo.accessType = InstanceAccessType.InvitePlus;
      // locationInfo.accessDetail = 'Invite Plus';
    } else {
      locationInfo.accessType = InstanceAccessType.InviteOnly;
      // locationInfo.accessDetail = 'Invite Only';
    }
    locationInfo.ownerId = privateId;
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

  // { name: 'pop', type: 'popcount', accessDetail: '[Internal Use Only] Population Counter' }

  return locationInfo;
}
