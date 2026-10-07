import { t } from '@/i18n'

export default {
  get 401() {
    return t('errorCode.401')
  },
  get 403() {
    return t('errorCode.403')
  },
  get 404() {
    return t('errorCode.404')
  },
  get default() {
    return t('errorCode.default')
  }
}
