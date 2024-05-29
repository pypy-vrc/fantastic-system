import * as vueI18n from "vue-i18n";
import en from "./locales/en.json";
import ko from "./locales/ko.json";

export const i18n = vueI18n.createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
    ko,
  },
});

console.log(i18n);
