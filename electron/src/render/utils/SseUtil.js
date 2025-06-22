const uuid = require('uuid');

let subscribers = [];

function registry(req, res) {
    const subscriberId = uuid.v4();
    console.log(`${subscriberId} Connection connected`);
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
    const value = JSON.stringify({type: 'registry', data: {id: subscriberId}});
    res.write(`data: ${value}\n\n`);

    subscribers.push({id: subscriberId, res: res});

    req.on('close', () => {
        console.log(`${subscriberId} Connection closed`);
        subscribers = subscribers.filter(sub => sub.id !== subscriberId);
    });
}

async function sendEvent(data) {
    subscribers.forEach(subscriber => {
        const value = JSON.stringify(data);
        subscriber.res.write(`data: ${value}\n\n`);
    });
}

exports.registry = registry
exports.sendEvent = sendEvent
