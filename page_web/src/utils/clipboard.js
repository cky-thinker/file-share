import Clipboard from 'clipboard'
import {ElMessage} from 'element-plus'
import { t } from '@/i18n'

export function copyClipboard(text, event) {
  const clipboard = new Clipboard("copy", {
    text: () => text
  })
  clipboard.on('success', () => {
    ElMessage.success({message: t('clipboard.copySuccess'), type: 'success'});
    clipboard.destroy()
  })
  clipboard.onClick(event)
}
