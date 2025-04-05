const WebSocket = require('ws');
const debug = require("debug");
let channels = {}

function init(server, port) {
    console.log('ws init invoked, port:' + port)
    const wss = new WebSocket.Server({server});

    wss.on('connection', (socket) => {
        console.log('A client has connected!');

        socket.on('error', debug);
        socket.on('message', message => onMessage(wss, socket, message));
        socket.on('close', message => onClose(wss, socket, message));
    })
    console.log(wss.address())
}

function send(wsClient, type, body) {
    debug('ws send', body);
    wsClient.send(JSON.stringify({
        type,
        body,
    }))
}

function clearClient(wss, socket) {
    // clear client by channel name and user id
    Object.keys(channels).forEach((cname) => {
        Object.keys(channels[cname]).forEach((uid) => {
            if (channels[cname][uid] === socket) {
                delete channels[cname][uid]
            }
        })
    })
}

function onMessage(wss, socket, message) {
    debug(`onMessage ${message}`);
    const parsedMessage = JSON.parse(message)
    const type = parsedMessage.type
    const body = parsedMessage.body
    const channelName = body.gameID
    const userId = body.userId

    switch (type) {
        case 'join': {
            console.log("JOIN MESSAGE RECIEVED: " + JSON.stringify(body));
            // join channel
            if (channels[channelName]) {
                const userIds = Object.keys(channels[channelName])
                if (userIds.length < 2) {
                    channels[channelName][userId] = {'socket': socket}
                } else if (userIds.length >= 2) {
                    send(socket, 'joined', ["ERROR"])
                }
            } else {
                channels[channelName] = {}
                channels[channelName][userId] = {'socket': socket}
            }
            const userIds = Object.keys(channels[channelName])
            userIds.forEach(id => {
                send(channels[channelName][id]['socket'], 'joined', userIds)
            })
            break;
        }
        case 'quit': {
            // quit channel
            if (channels[channelName]) {
                channels[channelName][userId] = null
                const userIds = Object.keys(channels[channelName])
                if (userIds.length === 0) {
                    delete channels[channelName]
                }
            }
            break;
        }
        case 'start' : {
            // when two members send their playertypes
            console.log("START MESSAGE RECIEVED: " + JSON.stringify(body));
            const isChicken = body.playerType;
            if (channels[channelName]) {
                let userIds = Object.keys(channels[channelName])
                if (channels[channelName][userId]) {
                    channels[channelName][userId]['isChicken'] = isChicken;
                }
                userIds.forEach(id => {
                    if (userId.toString() !== id.toString()) {
                        console.log(id);
                        const wsClient = channels[channelName][id]['socket']
                        if (channels[channelName][id]['isChicken']) {
                            if (channels[channelName][id]['isChicken'] === !isChicken) {
                                send(wsClient, 'game_start', [true]);
                                send(socket, 'game_start', [true]);
                            } else if (channels[channelName][id]['isChicken'] === isChicken) {
                                send(socket, 'game_start', ["ERROR", isChicken])
                                channels[channelName][userId]['isChicken'] = !isChicken;
                            }
                        }
                        else send(socket, 'game_start', [false]);
                    }
                })
            }
            break;
        }
        case 'seed': {
            let userIds = Object.keys(channels[channelName])
            let seed = body.driverSeed
            // code to move for chicken
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]['socket']
                    send(wsClient, 'driver_seed', seed);
                }
            })
            break;
        }
        case 'move': {
            let userIds = Object.keys(channels[channelName])
            let pos = body.position
            console.log(pos);
            // code to move for chicken
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]['socket']
                    send(wsClient, 'chicken_position_update', pos);
                }
            })
            break;
        }
        case 'addcar': {
            let userIds = Object.keys(channels[channelName])
            let pos = body.car
            console.log(pos);
            // code to move for chicken
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]['socket']
                    send(wsClient, 'car_add', pos);
                }
            })
            break;
        }
        case
        'send_offer'
        : {
            // exchange sdp to peer
            const sdp = body.sdp
            let userIds = Object.keys(channels[channelName])
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]
                    send(wsClient, 'offer_sdp_received', sdp)
                }
            })
            break;
        }
        case
        'send_answer'
        : {
            // exchange sdp to peer
            const sdp = body.sdp
            let userIds = Object.keys(channels[channelName])
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]
                    send(wsClient, 'answer_sdp_received', sdp)
                }
            })
            break;
        }
        case
        'send_ice_candidate'
        : {
            const candidate = body.candidate
            let userIds = Object.keys(channels[channelName])
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelName][id]
                    send(wsClient, 'ice_candidate_received', candidate)
                }
            })
        }
        default:
            break;
    }
}

function onClose(wss, socket, message) {
    debug('onClose', message);
    clearClient(wss, socket)
}

module.exports = {
    init,
}