import {getCurrentInstance} from "vue";

export function useVue() {
  const instance = getCurrentInstance();

  if (instance) {
    const { appContext: { app: { config: { globalProperties } } } } = instance;
    return { ...globalProperties };
  }

  return {};
}
