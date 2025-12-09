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

class ModeratorSocket extends WebSocketWithHeartbeat {
    onMessage(message) {
        if (message.type === "chat-msg") {
            const data = message.data;
            if (!data.msg) return;
            addMsgRow(data);
        }
        else if (message.type === "purchase") {
            const row = createElementFromHTML(`<div class='purchase-row w-100 p-2 ps-3 mb-2 mt-2'>
                    <div class="d-flex w-100 align-items-center">
                        <div>
                            Purchased by: <span class="purchase-username ms-2">${message.username}</span>
                            <div class="d-flex align-items-center">
                                <div class="purchase-cost me-2">${message.cost}</div>
                                <div class='msg flex-grow-1'>${message.description}</div>
                            </div>
                        </div>
                        <span class='icon-row ms-auto'><button class="btn clear-purchase-btn"><i class="bi bi-x-lg"></i></button></span>
                    </div>
                </div>`);
            
            const clearPurchaseBtn = row.querySelector(".clear-purchase-btn");
            clearPurchaseBtn.addEventListener("click", dismissPurchase);
            // clearPurchaseBtn.addEventListener("mouseenter", clearPurchaseBtnEnter);
            // clearPurchaseBtn.addEventListener("mouseleave", clearPurchaseBtnLeave);

            purchaseBox.appendChild(row);
        }
        else if (message.type === "display-msg" && message.id) {
            const msgEl = document.querySelector(`.msg-row[data-id='${message.id}']`);
            if (msgEl.parentNode.id === "msg-container") {
                msgEl.remove();
                document.getElementById("purchased-container").appendChild(msgEl);
            }
        }
        else if (message.type === "delete-msg" && message.id) {
            const msgEl = document.querySelector(`.msg-row[data-id='${message.id}'`);
            if (msgEl) msgEl.remove();
        }
        else if (message.type === "update-messages" && message.data) {
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
                    // TODO: support sent message viewing
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

function dismissPurchase() {
    const row = this.closest(".purchase-row");
    row.remove();
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