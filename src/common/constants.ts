export const VRChatLogType = {
  Init: 1,
  Quit: 2,
  JoiningRoom: 3,
  LeftRoom: 4,
  PlayerJoined: 5,
  PlayerLeft: 6,
};

export type VRChatLogTypeValue =
  (typeof VRChatLogType)[keyof typeof VRChatLogType];
