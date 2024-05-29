declare module 'native' {
  export interface RunningApp {
    vrchat: boolean;
    steamvr: boolean;
  }
  export const enum OverlayTarget {
    HMD = 0,
    Wrist = 1,
  }
  export const enum VRDeviceClass {
    Invalid = 0,
    HMD = 1,
    Controller = 2,
    GenericTracker = 3,
    TrackingReference = 4,
    DisplayRedirect = 5,
  }
  export const enum VRDeviceControllerRole {
    Invalid = 0,
    LeftHand = 1,
    RightHand = 2,
    OptOut = 3,
    Treadmill = 4,
    Stylus = 5,
  }
  export const enum VRDeviceButton {
    System = 0,
    ApplicationMenu = 1,
    Grip = 2,
    DPad_Left = 3,
    DPad_Up = 4,
    DPad_Right = 5,
    DPad_Down = 6,
    A = 7,
  }
  export interface VRDevice {
    deviceClass: number;
    isConnected: boolean;
    isCharging: boolean;
    batteryPercentage: number;
    controllerRole: number;
    buttonPressedMask: number;
    buttonTouchedMask: number;
  }
  export function getRunningApp(): RunningApp;
  export function playGame(arg: string): boolean;
  export function startOverlay(): boolean;
  export function stopOverlay(): void;
  export function setOverlayFrameBuffer(
    target: OverlayTarget,
    x: number,
    y: number,
    width: number,
    height: number,
    data: Uint8Array
  ): void;
  export function getVRDeviceList(): VRDevice[];
}
