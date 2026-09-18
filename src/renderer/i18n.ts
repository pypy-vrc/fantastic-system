import { createI18n } from "vue-i18n";
import en from "./locales/en.json" with { type: "json" };
import ko from "./locales/ko.json" with { type: "json" };

export const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en,
    ko,
  },
});
