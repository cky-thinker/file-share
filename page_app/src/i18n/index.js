import { reactive } from "vue";
import zh from "./locales/zh";
import en from "./locales/en";

// 支持的语言，默认语言规则：系统语言为中文时使用中文，其它一律使用英文
export const SUPPORTED_LOCALES = ["zh", "en"];
export const DEFAULT_LOCALE = "en";

const messages = { zh, en };

// 将任意语言标识归一化为受支持的语言，无法识别时返回空字符串
export function normalizeLocale(locale) {
  if (!locale) {
    return "";
  }
  const value = String(locale).toLowerCase();
  if (value.startsWith("zh")) {
    return "zh";
  }
  if (value.startsWith("en")) {
    return "en";
  }
  return "";
}

// 读取系统语言作为默认语言
export function detectSystemLocale() {
  const lang =
    (typeof navigator !== "undefined" &&
      (navigator.language || navigator.userLanguage)) ||
    "";
  return normalizeLocale(lang) || DEFAULT_LOCALE;
}

// 当前语言（响应式，语言切换后自动触发视图更新）
export const i18nState = reactive({
  locale: detectSystemLocale(),
});

export function getLocale() {
  return i18nState.locale;
}

export function setLocale(locale) {
  i18nState.locale = normalizeLocale(locale) || DEFAULT_LOCALE;
  if (typeof document !== "undefined") {
    document.documentElement.lang = i18nState.locale;
  }
}

// 翻译函数：t('a.b', { name: 'xx' })
export function t(key, params) {
  const dict = messages[i18nState.locale] || messages[DEFAULT_LOCALE];
  let value = dict;
  for (const segment of String(key).split(".")) {
    if (value == null) {
      break;
    }
    value = value[segment];
  }
  if (typeof value !== "string") {
    return key;
  }
  if (params) {
    Object.keys(params).forEach((param) => {
      value = value.split(`{${param}}`).join(String(params[param]));
    });
  }
  return value;
}

const i18n = {
  install(app) {
    app.config.globalProperties.$t = t;
    app.config.globalProperties.$locale = i18nState;
    app.config.globalProperties.$setLocale = setLocale;
  },
};

export default i18n;
