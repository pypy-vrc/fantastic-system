import * as vue from 'vue';
import * as lazyload from 'vue3-lazyload';
import {i18n} from '../i18n';
import {router} from './router';

function showWarningMessage(): void {
  for (let i = 0; i < 3; ++i) {
    setTimeout(() => {
      console.log(
        '%cCareful! This might not do what you think.',
        'background-color: red; color: yellow; font-size: 32px; font-weight: bold'
      );
      console.log(
        '%cIf someone told you to copy-paste something here, it will give them access to your account.',
        'font-size: 20px;'
      );
    }, i * 1500);
  }
}

(function bootstrap(): void {
  let app = vue.createApp(require('./vue/app').default);
  app.use(lazyload.default, {
    log: false
  });
  app.use(i18n);
  app.use(router);
  app.mount('#app');

  // var warn = new Function();
  // // @ts-ignore
  // warn.toString = showWarningMessage;
  // console.log(warn);
})();
