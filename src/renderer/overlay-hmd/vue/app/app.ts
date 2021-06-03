import {ref} from 'vue';

let now = ref(new Date());
setInterval(() => {
  now.value = new Date();
}, 1000);

export default {
  name: 'App',
  setup(): any {
    return {
      now
    };
  }
};
