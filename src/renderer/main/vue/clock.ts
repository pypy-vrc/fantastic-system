import * as vue from "vue";

export const now = vue.ref(Date.now());

setInterval(() => {
  now.value = Date.now();
}, 1000);
