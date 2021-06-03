import * as path from 'path';
import * as electron from 'electron';

export interface Ref<T> {
  value: T;
}

export let isAppQuit: Ref<boolean> = {value: false};

export let appIcon = electron.nativeImage.createFromPath(
  path.join(electron.app.getAppPath(), './dist/icons/app.ico')
);
