import * as vue from "vue";
import * as util from "../../../../common/util";
import * as pubsub from "../../../../common/pubsub";
import { goUserPage, router } from "../../router";
import * as api from "../../game/api";
import * as loading from "../loading";

// @ts-expect-error sex
const ipcRenderer = window.ipcRenderer as Electron.IpcRenderer;

const routeButtonState = vue.reactive({
  back: false,
  forward: false,
});

const currentMenuRef = vue.ref("game-log-list-page");
const notifyMenuSet = vue.reactive(new Set<string>());

pubsub.subscribe("router:button-state", (state: typeof routeButtonState) => {
  routeButtonState.back = state.back;
  routeButtonState.forward = state.forward;
});

function historyBack() {
  window.history.back();
}

function historyForward() {
  window.history.forward();
}

function changeMenu(menu: string) {
  notifyMenuSet.delete(currentMenuRef.value);
  notifyMenuSet.delete(menu);
  currentMenuRef.value = menu;
}

function selectMenu(menu: string) {
  changeMenu(menu);

  router
    .push({
      name: menu,
    })
    .catch(util.nop);
}

function notifyMenu(menu: string) {
  notifyMenuSet.add(menu);
}

pubsub.subscribe("app:notify-menu", notifyMenu);

vue.watch(api.isLoggedIn, (isLoggedIn) => {
  if (!isLoggedIn) {
    selectMenu("login-user-page");
  }
});

router.afterEach(({ name }) => {
  if (typeof name === "string") {
    changeMenu(name);
  } else {
    changeMenu("");
  }
});

function getMenuClass(menu: string) {
  if (currentMenuRef.value === menu) {
    return "active";
  }

  if (notifyMenuSet.has(menu)) {
    return "notify";
  }

  return "";
}

async function onLoginUserMenuCommand(command: string) {
  try {
    switch (command) {
      case "myInfo":
        goUserPage(api.loginUser.id);
        break;

      case "logout":
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

function close() {
  ipcRenderer.send("main:close");
}

function minimize() {
  ipcRenderer.send("main:minimize");
}

function maximize() {
  ipcRenderer.send("main:maximize");
}

const handleViewScroll = util.throttle((e: Event) => {
  const el = e.target as HTMLElement | null;
  if (el === null) {
    return;
  }

  window.history.replaceState(
    {
      ...window.history.state,
      viewScrollLeft: el.scrollLeft,
      viewScrollTop: el.scrollTop,
    },
    document.title
  );
}, 100);

export default {
  name: "App",
  setup() {
    setTimeout(() => {
      (async function sex() {
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
      maximize,
      handleViewScroll,
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
  },
};
