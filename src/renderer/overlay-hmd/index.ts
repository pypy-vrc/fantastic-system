import * as vue from "vue";
import { i18n } from "../i18n";
import * as VueApp from "./vue/app/index.vue";

(function main() {
  const app = vue.createApp(VueApp.default);
  app.use(i18n);
  app.mount("#app");
})();
