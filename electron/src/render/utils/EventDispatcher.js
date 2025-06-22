// ----- 事件分发器 -----

// 事件处理回调
const eventListeners = {}
// 注册事件处理回调
const registryEventListener = (type, listener) => {
    eventListeners[type] ||= []
    eventListeners[type].push(listener)
}
// 触发事件，事件结构 {type: '', data: {}}
const triggerEvent = (event) => {
    let listeners = eventListeners[event.type]
    if (!listeners) {
        return;
    }
    for (let listener of listeners) {
        listener(event)
    }
}


exports.registryEventListener = registryEventListener
exports.triggerEvent = triggerEvent