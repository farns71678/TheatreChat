const WebSocket = require('ws');
// I think this is a terrible way to create a global variable
// somebody please tell be a better way to do this

//const moderator = { socket: null };

const moderators = new Map();

const MsgState = {
    pending: 'pending',
    displayed: 'displayed',
    deleted: 'deleted'
};

const PurchaseState = {
    pending: 'pending',
    purchased: 'purchased',
    discarded: 'discarded'
};

let chatMessages = [];
let purchases = [];
let flaggedUsernames = [];
//const displays = new Map();

const Display = {
    displays: new Map(),
    broadcastMessage: function (msg) {
        this.displays.forEach(display => {
            if (display && display.readyState === WebSocket.OPEN) {
                display.send(msg);
            }
        });
    }
};


const updateState = (data, state) => {
    data.state = state;
    data.updated_timestamp = Date.now();
}

module.exports = { moderators, Display, chatMessages, MsgState, purchases, PurchaseState, flaggedUsernames, updateState };