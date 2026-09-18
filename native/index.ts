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

export declare function getRunningApp(): RunningApp;

export declare function playGame(arg: string): boolean;

export declare function startOverlay(): boolean;

export declare function stopOverlay(): void;

export declare function setOverlayFrameBuffer(
  target: number,
  x: number,
  y: number,
  width: number,
  height: number,
  data: Uint8Array,
): void;

export declare function getVRDeviceList(): VRDevice[];

import bindings from "bindings";
export default bindings("native.node");
