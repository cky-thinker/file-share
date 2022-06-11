// ----- 事件分发器 -----

// 事件处理回调
const eventCallbacks = {}
// 注册事件处理回调
const registryFailCallback = (type, callback) => {
    eventCallbacks[type] ||= []
    eventCallbacks[type].push(callback)
}
// 触发事件，事件结构 {type: '', data: {}}
const triggerEvent = (event) => {
    let callbacks = eventCallbacks[event.type]
    if (!callbacks) {
        return;
    }
    for (let callback of callbacks) {
        callback(event)
    }
}


exports.registryFailCallback = registryFailCallback
exports.triggerEvent = triggerEvent