import { createRequire } from "node:module";

export type RunningApp = {
  vrchat: boolean;
  steamvr: boolean;
};

export type VRDevice = {
  deviceClass: number;
  isConnected: boolean;
  isCharging: boolean;
  batteryPercentage: number;
  controllerRole: number;
  buttonPressedMask: number;
  buttonTouchedMask: number;
};

export const OverlayTarget = {
  HMD: 0,
  Wrist: 1,
};

export type OverlayTargetValue =
  (typeof OverlayTarget)[keyof typeof OverlayTarget];

export const VRDeviceClass = {
  Invalid: 0,
  HMD: 1,
  Controller: 2,
  GenericTracker: 3,
  TrackingReference: 4,
  DisplayRedirect: 5,
};

export type VRDeviceClassValue =
  (typeof VRDeviceClass)[keyof typeof VRDeviceClass];

export const VRDeviceControllerRole = {
  Invalid: 0,
  LeftHand: 1,
  RightHand: 2,
  OptOut: 3,
  Treadmill: 4,
  Stylus: 5,
};

export type VRDeviceControllerRoleValue =
  (typeof VRDeviceControllerRole)[keyof typeof VRDeviceControllerRole];

export const VRDeviceButton = {
  System: 0,
  ApplicationMenu: 1,
  Grip: 2,
  DPad_Left: 3,
  DPad_Up: 4,
  DPad_Right: 5,
  DPad_Down: 6,
  A: 7,
};

export type VRDeviceButtonValue =
  (typeof VRDeviceButton)[keyof typeof VRDeviceButton];

const binding = (
  process.platform === "win32"
    ? createRequire(import.meta.url)("../build/Release/native.node")
    : {}
) as {
  getRunningApp: () => RunningApp;
  playGame: (arg: string) => boolean;
  startOverlay: () => boolean;
  stopOverlay: () => void;
  setOverlayFrameBuffer: (
    target: number,
    x: number,
    y: number,
    width: number,
    height: number,
    data: Uint8Array,
  ) => void;
  getVRDeviceList: () => VRDevice[];
};

export const {
  getRunningApp,
  playGame,
  startOverlay,
  stopOverlay,
  setOverlayFrameBuffer,
  getVRDeviceList,
} = binding;

export default binding;
