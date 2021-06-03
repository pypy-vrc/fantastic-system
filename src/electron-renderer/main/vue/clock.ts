import * as vue from 'vue';

export let now = vue.ref(Date.now());

setInterval(() => {
  now.value = Date.now();
}, 1000);
