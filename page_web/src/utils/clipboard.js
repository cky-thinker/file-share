import Clipboard from 'clipboard'
import {ElMessage} from 'element-plus'

export function copyClipboard(text, event) {
  const clipboard = new Clipboard("copy", {
    text: () => text
  })
  clipboard.on('success', () => {
    ElMessage.success({message: '复制成功', type: 'success'});
    clipboard.destroy()
  })
  clipboard.onClick(event)
}
