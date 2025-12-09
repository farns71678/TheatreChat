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

module.exports = { moderators, chatMessages, MsgState, purchases, PurchaseState };