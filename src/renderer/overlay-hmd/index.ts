import * as vue from 'vue';
import {i18n} from '../i18n';

(function bootstrap(): void {
  let app = vue.createApp(require('./vue/app').default);
  app.use(i18n);
  app.mount('#app');
})();
