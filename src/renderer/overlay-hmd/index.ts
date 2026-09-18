import { createApp } from "vue";
import { i18n } from "../i18n.ts";
import VueApp from "./vue/app/index.vue";

(function main() {
  const app = createApp(VueApp);
  app.use(i18n);
  app.mount("#app");
})();
