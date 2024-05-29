import * as vueI18n from "vue-i18n";

const messages: Record<string, Record<string, string>> = {};

for (const locale of ["en", "ko"]) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  messages[locale] = require(`./locales/${locale}.json`).default;
}

export const i18n = vueI18n.createI18n({
  locale: "en",
  fallbackLocale: "en",
  messages,
});
