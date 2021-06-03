import * as vue from 'vue';
import * as util from '../../../../util';
import * as pubsub from '../../../../pubsub';
import {goUserPage, router} from '../../router';
import * as api from '../../game/api';
import * as loading from '../loading';

// @ts-expect-error sex
let ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

let routeButtonState = vue.reactive({
  back: false,
  forward: false
});

let currentMenuRef = vue.ref('game-log-list-page');
let notifyMenuSet = vue.reactive(new Set<string>());

pubsub.subscribe('router:button-state', (state: any) => {
  routeButtonState.back = state.back;
  routeButtonState.forward = state.forward;
});

function historyBack(): void {
  window.history.back();
}

function historyForward(): void {
  window.history.forward();
}

function changeMenu(menu: string): void {
  notifyMenuSet.delete(currentMenuRef.value);
  notifyMenuSet.delete(menu);
  currentMenuRef.value = menu;
}

function selectMenu(menu: string): void {
  changeMenu(menu);

  router
    .push({
      name: menu
    })
    .catch(util.nop);
}

function notifyMenu(menu: string): void {
  notifyMenuSet.add(menu);
}

pubsub.subscribe('app:notify-menu', notifyMenu);

vue.watch(api.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn === false) {
    selectMenu('login-user-page');
  }
});

router.afterEach(({name}) => {
  if (typeof name === 'string') {
    changeMenu(name);
  } else {
    changeMenu('');
  }
});

function getMenuClass(menu: string): string {
  if (currentMenuRef.value === menu) {
    return 'active';
  }

  if (notifyMenuSet.has(menu) === true) {
    return 'notify';
  }

  return '';
}

async function onLoginUserMenuCommand(command: string): Promise<void> {
  try {
    switch (command) {
      case 'myInfo':
        goUserPage(api.loginUser.id);
        break;

      case 'logout':
        loading.increment();

        try {
          await api.logout();
        } catch (err) {
          console.error(err);
        }

        loading.decrement();
        break;
    }
  } catch (err) {
    console.error(err);
  }
}

function close(): void {
  ipcRenderer.send('mainWindow:close');
}

function minimize(): void {
  ipcRenderer.send('mainWindow:minimize');
}

function maximize(): void {
  ipcRenderer.send('mainWindow:maximize');
}

export default {
  name: 'App',
  setup(): any {
    setTimeout(() => {
      (async function sex(): Promise<void> {
        loading.increment();

        try {
          await api.fetchLoginUser();
        } catch (err) {
          console.error(err);
        }

        loading.decrement();
      })();
    }, 69);

    return {
      isLoggedIn: api.isLoggedIn,
      loginUser: api.loginUser,
      routeButtonState,
      currentMenu: currentMenuRef,
      notifyMenuSet,
      historyBack,
      historyForward,
      getMenuClass,
      selectMenu,
      onLoginUserMenuCommand,
      close,
      minimize,
      maximize
      /*
            async onChangeFile(event: Event) {
                try {
                    var {files} = event.target as HTMLInputElement;
                    if (files !== null) {
                        var [file] = files;
                        // file.name, file.path, file.size, file.type
                        console.log('file', file);
                        var arrayBuffer = await file.arrayBuffer();
                        console.log('arrayBuffer', arrayBuffer);
                        // ipc로 보내고 받으면 됨
                    }
                } catch (err) {
                    console.error(err);
                }
            },
            */
    };
  }
};
