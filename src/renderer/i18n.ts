import * as vueI18n from 'vue-i18n';

let messages: vueI18n.LocaleMessages<vueI18n.VueMessageType> = {};

for (let locale of ['en', 'ko']) {
  messages[locale] = require(`./locales/${locale}.json`).default;
}

export let i18n = vueI18n.createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages
});
