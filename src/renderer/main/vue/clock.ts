import { ref } from "vue";

export const now = ref(Date.now());

setInterval(() => {
  now.value = Date.now();
}, 1000);
