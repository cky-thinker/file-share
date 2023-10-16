const uuid = require('uuid');

let subscribers = [];

function registry(request, response) {
    const subscriberId = uuid.v4();
    console.log(`${subscriberId} Connection connected`);
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    };
    response.writeHead(200, headers);
    const data = JSON.stringify({type: 'registry', data: {id: subscriberId}});
    response.write(data);

    subscribers.push({id: subscriberId, response});

    request.on('close', () => {
        console.log(`${subscriberId} Connection closed`);
        subscribers = subscribers.filter(sub => sub.id !== subscriberId);
    });
}

async function sendEvent(data) {
    subscribers.forEach(subscriber => {
        subscriber.response.write(JSON.stringify(data))
    });
}

exports.registry = registry
exports.sendEvent = sendEvent
