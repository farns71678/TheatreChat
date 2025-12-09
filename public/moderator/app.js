//import WebSocketWithHeartbeat from "./socket";
const msgBox = document.getElementById('msg-container');
const purchaseBox = document.getElementById('purchase-container');
const currentUrl = window.location.href;
const urlObj = new URL(currentUrl);
const domain = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
const socketUrl = `ws://${domain}:${port}/ws/moderator`;
let socket = null;

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

class ModeratorSocket extends WebSocketWithHeartbeat {
    onMessage(message) {
        const data = message.data;
        if (message.type === "chat-msg") {
            if (!data.msg) return;
            addMsgRow(data);
        }
        else if (message.type === "purchase" && data) {
            addPurchaseRow(data);
        }
        else if (message.type === "display-msg" && data) {
            const msgEl = document.querySelector(`.msg-row[data-id='${data.id}']`);
            if (msgEl.parentNode.id === "msg-container") {
                msgEl.remove();
                addSentMsgRow(data);
            }
        }
        else if (message.type === "delete-msg" && message.id) {
            const msgEl = document.querySelector(`.msg-row[data-id='${message.id}'`);
            if (msgEl) msgEl.remove();
        }
        else if (message.type === "update-messages" && data) {
            const messages = message.data.messages;
            const pendingContainer = document.getElementById("msg-container");
            const sentContainer = document.getElementById("sent-msg-container");
            pendingContainer.innerHTML = "";
            sentContainer.innerHTML = "";
            messages.forEach(message => {
                if (message.state === MsgState.pending) {
                    addMsgRow(message);
                }
                else {
                    addSentMsgRow(message);
                }
            })
        }
        else if (message.type === "update-purchase" && data) {
            const purchaseEl = document.querySelector(`.purchase-row[data-id="${data.id}"]`);
            if (purchaseEl) purchaseEl.remove();

            console.log(`Updating purchase: ${JSON.stringify(data)}`);

            if (data.state === PurchaseState.pending) {
                addPurchaseRow(data);
            }
            else if (data.state === PurchaseState.purchased) {
                addConfirmedPurchaseRow(data);
            }
        }
        else if (message.type === "update-purchases" && data && data.purchases) {
            const purchaseContainer = document.getElementById("purchase-container");
            const purchasedContainer = document.getElementById("purchased-container");
            if (purchaseContainer) purchaseContainer.innerHTML = "";
            if (purchasedContainer) purchasedContainer.innerHTML = "";
            data.purchases.forEach(purchase => {
                if (purchase.state === PurchaseState.pending) {
                    addPurchaseRow(purchase);
                }
                else if (purchase.state === PurchaseState.purchased) {
                    addConfirmedPurchaseRow(purchase);
                }
            })
        }
    }

    onClose(event) {
        console.log('Disconnected. Close code:', event.code, 'Reason:', event.reason);
        this.stopPingInterval();
        
        // 1006 is abnormal closure (server destroyed socket during upgrade)
        // 1008 is policy violation code - redirect to login
        if ((event.code === 1006 || event.code === 1008) && event.reason && event.reason.includes('Unauthorized')) {
            console.warn('Unauthorized connection. Redirecting to login...');
            window.location.href = '/login?durl=moderator';
            return;
        }
        
        // If code 1006 with no reason (likely auth failure), also redirect
        if (event.code === 1006) {
            console.warn('Connection rejected. Redirecting to login...');
            window.location.href = '/login?durl=moderator';
            return;
        }
        
        // For other disconnections, reconnect
        setTimeout(() => this.connect(), 5000); // Retry after 5s
    }

    onOpen() {
        this.sendMessage(JSON.stringify({ type: "get-messages" }));
        this.sendMessage(JSON.stringify({ type: "get-purchases" }));
    }
}

try {
    socket = new ModeratorSocket(socketUrl);
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}

function addMsgRow(data) {
    const row = createElementFromHTML(`<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}"><div class='msg flex-grow-1'>${data.msg}</div><span class='icon-row'><button class="btn trash-btn"><i class="bi bi-trash-fill"></i></button><button class="btn send-btn"><i class="bi bi-send-fill send-btn"></i></button></span></div>`);

    row.querySelector(".trash-btn").addEventListener("click", trashMsg);
    row.querySelector(".send-btn").addEventListener("click", sendMsg);

    msgBox.appendChild(row);
    return row;
}

function addSentMsgRow(data) {
    const sentMsgContainer = document.getElementById("sent-msg-container");
    const row = createElementFromHTML(`<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}"><div class='msg flex-grow-1'>${data.msg}</div><span class='icon-row'><button class="btn trash-btn"><i class="bi bi-trash-fill"></i></button></span></div>`);
    
    row.querySelector(".trash-btn").addEventListener("click", trashMsg);

    sentMsgContainer.appendChild(row);
    return row;
}

function addPurchaseRow(data) {
    const row = createElementFromHTML(`<div class='purchase-row w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-purchase="${encodeURIComponent(JSON.stringify(data))}">
            <div class="d-flex w-100 align-items-center">
                <div>
                    Purchased by: <span class="purchase-username ms-2">${data.username}</span>
                    <div class="d-flex align-items-center">
                        <div class="purchase-cost me-2">$${data.cost}</div>
                        <div class='msg flex-grow-1'>${data.description}</div>
                    </div>
                </div>
                <span class='icon-row ms-auto'>
                    <button class="btn confirm-purchase-btn"><i class="bi bi-bag-check"></i></button>
                    <button class="btn clear-purchase-btn"><i class="bi bi-x-lg"></i></button>
                </span>
            </div>
        </div>`);
    
    const clearPurchaseBtn = row.querySelector(".clear-purchase-btn");
    clearPurchaseBtn.addEventListener("click", dismissPurchase);
    const confirmPurchaseBtn = row.querySelector(".confirm-purchase-btn");
    confirmPurchaseBtn.addEventListener("click", confirmPurchase);
    // clearPurchaseBtn.addEventListener("mouseenter", clearPurchaseBtnEnter);
    // clearPurchaseBtn.addEventListener("mouseleave", clearPurchaseBtnLeave);

    purchaseBox.appendChild(row);
}

function addConfirmedPurchaseRow(data) {
    const row = createElementFromHTML(`<div class='purchase-row w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-purchase="${encodeURIComponent(JSON.stringify(data))}">
            <div class="d-flex w-100 align-items-center">
                <div>
                    Purchased by: <span class="purchase-username ms-2">${data.username}</span>
                    <div class="d-flex align-items-center">
                        <div class="purchase-cost me-2">$${data.cost}</div>
                        <div class='msg flex-grow-1'>${data.description}</div>
                    </div>
                </div>
                <span class='icon-row ms-auto'>
                    <button class="btn unconfirm-purchase-btn"><i class="bi bi-bag-x"></i></button>
                    <button class="btn clear-purchase-btn"><i class="bi bi-x-lg"></i></button>
                </span>
            </div>
        </div>`);
    
    const clearPurchaseBtn = row.querySelector(".clear-purchase-btn");
    clearPurchaseBtn.addEventListener("click", dismissPurchase);
    const unconfirmPurchaseBtn = row.querySelector(".unconfirm-purchase-btn");
    unconfirmPurchaseBtn.addEventListener("click", unconfirmPurchase);

    // clearPurchaseBtn.addEventListener("mouseenter", clearPurchaseBtnEnter);
    // clearPurchaseBtn.addEventListener("mouseleave", clearPurchaseBtnLeave);

    const purchasedContainer = document.getElementById("purchased-container");
    purchasedContainer.appendChild(row);
}

function trashMsg() {
    const row = this.closest(".msg-row");
    // row.remove();
    const msg = JSON.parse(decodeURIComponent(row.getAttribute('data-msg')));
    if (socket && socket.getState() === WebSocket.OPEN) {
        socket.sendMessage(JSON.stringify({ type: "delete-msg", id: msg.id }));
    }
    else {
        console.log("Unable to delete message");
    }
}

async function dismissPurchase() {
    const row = this.closest(".purchase-row");
    const id = row.getAttribute('data-id');
    // even though the request is not made through the web socket, the connection should still be open for updates & authentication
    if (socket && socket.getState() === WebSocket.OPEN) {
        fetch('/discardpurchase', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ id })
        });
    }
    else {
        console.log("Unable to discard purchase, socket is closed");
    }
    // row.remove();
}

async function confirmPurchase() {
    const row = this.closest(".purchase-row");
    const id = row.getAttribute('data-id');
    // even though the request is not made through the web socket, the connection should still be open for updates & authentication
    if (socket && socket.getState() === WebSocket.OPEN) {
        fetch('/confirmpurchase', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ id })
        });
    }
    else {
        console.log("Unable to confirm purchase, socket is closed");
    }
}

async function unconfirmPurchase() {
    const row = this.closest(".purchase-row");
    const id = row.getAttribute('data-id');
    // even though the request is not made through the web socket, the connection should still be open for updates & authentication
    if (socket && socket.getState() === WebSocket.OPEN) {
        fetch('/unconfirmpurchase', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ id })
        });
    }
    else {
        console.log("Unable to unconfirm purchase, socket is closed");
    }
}

function clearPurchaseBtnEnter() {
    this.classList.remove('bi-x-circle');
    this.classList.add("bi-x-circle-fill");
}

function clearPurchaseBtnLeave() {
    this.classList.add('bi-x-circle');
    this.classList.remove("bi-x-circle-fill");
}

function sendMsg() {
    const row = this.closest(".msg-row");
    const msg = JSON.parse(decodeURIComponent(row.getAttribute('data-msg')));
    if (socket && socket.getState() === WebSocket.OPEN) {
        const reply = { type: "display-msg", data: msg };
        socket.sendMessage(JSON.stringify(reply));
        console.log(`Sending message: ${msg}`);
        //row.remove();
    }
    else {
        console.log("unable to send message to client")
    }
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}