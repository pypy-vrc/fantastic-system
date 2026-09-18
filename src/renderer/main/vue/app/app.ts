import { reactive, ref, watch } from "vue";
import { nop, throttle } from "../../../../common/util.ts";
import { subscribe } from "../../../../common/pubsub.ts";
import { goUserPage, router } from "../../router.ts";
import {
  fetchLoginUser,
  isLoggedIn,
  loginUser,
  logout,
} from "../../game/api/index.ts";
import { decrementLoading, incrementLoading } from "../loading.ts";

const { ipcRenderer } = window;

const routeButtonState = reactive({
  back: false,
  forward: false,
});

const currentMenuRef = ref("game-log-list-page");
const notifyMenuSet = reactive(new Set<string>());

subscribe("router:button-state", (state: typeof routeButtonState) => {
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
    .catch(nop);
}

function notifyMenu(menu: string) {
  notifyMenuSet.add(menu);
}

subscribe("app:notify-menu", notifyMenu);

watch(isLoggedIn, (_isLoggedIn) => {
  if (!_isLoggedIn) {
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
        goUserPage(loginUser.id);
        break;

      case "logout":
        incrementLoading();

        try {
          await logout();
        } catch (err) {
          console.error(err);
        }

        decrementLoading();
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

const handleViewScroll = throttle((e: Event) => {
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
    document.title,
  );
}, 100);

export default {
  name: "App",
  setup() {
    setTimeout(async () => {
      incrementLoading();

      try {
        await fetchLoginUser();
      } catch (err) {
        console.error(err);
      }

      decrementLoading();
    }, 69);

    return {
      isLoggedIn: isLoggedIn,
      loginUser: loginUser,
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
