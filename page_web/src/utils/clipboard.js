import Clipboard from 'clipboard'
import {ElMessage} from 'element-plus'
import { t } from '@/i18n'

// 查找最近的按钮元素，保证复制动作绑定在实际按钮上
const findButtonElement = (element) => {
  let node = element
  while (node && !node.matches('button')) {
    node = node.parentElement
  }
  return node || element
}

export function copyClipboard(text, event) {
  const clipboard = new Clipboard(findButtonElement(event.target), {
    text: () => text
  })
  clipboard.on('success', () => {
    ElMessage.success({message: t('clipboard.copySuccess'), type: 'success'});
    clipboard.destroy()
  })
  clipboard.onClick(event)
}
