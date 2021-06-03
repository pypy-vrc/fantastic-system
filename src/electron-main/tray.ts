import * as electron from 'electron';
import * as pubsub from '../pubsub';
import * as global from './global';

let tray: electron.Tray | undefined = void 0;

export function create(): void {
  if (tray !== void 0) {
    return;
  }

  tray = new electron.Tray(global.appIcon);
  tray.on('double-click', () => {
    pubsub.publish('tray:double-click');
  });

  tray.setContextMenu(
    electron.Menu.buildFromTemplate([
      {
        label: 'Open',
        click: (): void => {
          pubsub.publish('tray:open');
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit VRCX',
        click: (): void => {
          pubsub.publish('tray:quit');
        }
      }
    ])
  );

  tray.setToolTip('VRCX');
}

export function destroy(): void {
  if (tray === void 0) {
    return;
  }

  try {
    tray.destroy();
  } catch (err) {
    console.error(err);
  }

  tray = void 0;
}
