import Clipboard from 'clipboard'
import {Message} from 'element-ui'

export function copyClipboard(text, event) {
  const clipboard = new Clipboard(event.target, {
    text: () => text
  })
  clipboard.on('success', () => {
    Message.success({message: '复制成功', type: 'success'});
  })
  clipboard.onClick(event)
}
