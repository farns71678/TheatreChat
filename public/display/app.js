const msgBox = document.getElementById('msg-container');
const currentUrl = window.location.href;
const urlObj = new URL(currentUrl);
const domain = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
const socketUrl = `ws://${domain}:${port}/ws/display`;
let socket = null;

// TODO: add qr codes to page
// TODO: make purchases visible

const PurchaseState = {
    pending: 'pending',
    purchased: 'purchased',
    discarded: 'discarded'
};

class DisplaySocket extends WebSocketWithHeartbeat {
    onMessage(message) {
        console.log(message);
        const data = message.data;

        if (message.type === 'display-msg') {
            addMsgRow(data);
        }
        else if (message.type === 'delete-msg' && message.id) {
            const msgEl = document.querySelector(`.msg[data-id="${message.id}"]`);
            if (msgEl) {
                const row = msgEl.closest(".msg-row");
                if (row && row.querySelectorAll(".msg").length === 1) {
                    row.remove();
                }
                else {
                    msgEl.remove();
                }
            }
            else {
                console.log(`Unable to remove element with id ${message.id} because it was not found`);
            }
        }
        else if (message.type === 'update-messages' && data) {
            msgBox.innerHTML = "";
            data.messages.sort((a, b) => (a.updated_timestamp || 0) - (b.updated_timestamp || 0));
            data.messages.forEach(message => {
                addMsgRow(message);
            })
        }
        else if (message.type === "update-purchase" && data) {
            const purchaseEl = document.querySelector(`.purchase-row[data-id="${data.id}"]`);
            if (purchaseEl) {
                purchaseEl.remove();
            }

            console.log(`Updating purchase: ${JSON.stringify(data)}`);

            if (data.state === PurchaseState.purchased) {
                addPurchaseRow(data);
            }
        }
        else if (message.type === "update-purchases" && data && data.purchases) {
            // buggy append child
            const purchaseContainer = document.getElementById("purchase-container");
            if (purchaseContainer) purchaseContainer.innerHTML = "";
            data.purchases.forEach(purchase => {
                if (purchase.state === PurchaseState.purchased) {
                    addPurchaseRow(purchase);
                }
            })
        }
    }

    onOpen() {
        this.sendMessage(JSON.stringify({ type: "get-messages" }));
    }
}

function addMsgRow(data) {
    const msgRows = document.querySelectorAll(".msg-row");

    if (msgRows.length > 0 && msgRows[msgRows.length - 1].getAttribute("data-username") === data.username) {
        const msg = createElementFromHTML(`<p class='msg flex-grow-1 mb-0' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}">${data.msg}</p>`);
        msgRows[msgRows.length - 1].appendChild(msg);
    }
    else {
        const row = createElementFromHTML(`<div class='msg-row w-100 p-2 ps-3 mb-2 mt-2' data-username="${data.username}">
            <div class="msg-username ms-2">${data.username}</div>
            <p class='msg flex-grow-1 mb-0' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}">${data.msg}</p>
        </div>`);
        msgBox.appendChild(row);
    }
}

function addPurchaseRow(data) {
    const purchaseContainer = document.getElementById("#purchase-container");
    const row = createElementFromHTML(`<div class='purchase-row w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-purchase="${encodeURIComponent(JSON.stringify(data))}">
            <div class="d-flex w-100 align-items-center">
                <div>
                    Purchased by: <span class="purchase-username ms-2">${data.username}</span>
                    <div class="d-flex align-items-center">
                        <div class="purchase-cost me-2">$${data.cost}</div>
                        <div class='msg flex-grow-1'>${data.description}</div>
                    </div>
                </div>
            </div>
        </div>`);
    
    // const clearPurchaseBtn = row.querySelector(".clear-purchase-btn");
    // clearPurchaseBtn.addEventListener("click", dismissPurchase);
    // const confirmPurchaseBtn = row.querySelector(".confirm-purchase-btn");
    // confirmPurchaseBtn.addEventListener("click", confirmPurchase);
    // // clearPurchaseBtn.addEventListener("mouseenter", clearPurchaseBtnEnter);
    // // clearPurchaseBtn.addEventListener("mouseleave", clearPurchaseBtnLeave);
    // updateBadgeCount("#purchase-tab", 1);
    purchaseContainer.appendChild(row);
}

try {
    socket = new DisplaySocket(socketUrl);
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}