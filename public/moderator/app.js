const msgBox = document.getElementById('msg-container');
const purchaseBox = document.getElementById('purchase-container');
const currentUrl = window.location.href;
const urlObj = new URL(currentUrl);
const domain = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
const socketUrl = `ws://${domain}:${port}/ws/moderator`;
let socket = null;

try {
    socket = new WebSocket(socketUrl);

    socket.addEventListener("open", () => {
        console.log("Connected to socket");
    });

    socket.addEventListener("error", (err) => {
        console.log(`WebSocket error: ${err}`);
    });

    socket.addEventListener("close", () => {
        console.log(`WebSocket closed`);
    });

    socket.addEventListener("message", async (event) => {
        let res = JSON.parse(await event.data);
        //console.log(res);

        if (res.type === "chat-msg") {
            if (!res.data || !res.data.msg) return;

            const msg = res.data;

            const row = createElementFromHTML(`<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-id="${msg.id}" data-msg="${encodeURIComponent(JSON.stringify(msg))}"><div class='msg flex-grow-1'>${msg.msg}</div><span class='icon-row'><i class="bi bi-trash-fill trash-btn"></i><i class="bi bi-send-fill send-btn"></i></span></div>`);
            
            row.querySelector(".trash-btn").addEventListener("click", trashMsg);
            row.querySelector(".send-btn").addEventListener("click", sendMsg);

            msgBox.appendChild(row);
        }
        else if (res.type === "purchase") {
            let row = document.createElement('div');
            row.innerHTML = `<div class='purchase-row w-100 p-2 ps-3 mb-2 mt-2'>
                    <div class="d-flex w-100 align-items-center">
                        <div>
                            Purchased by: <span class="purchase-username ms-2">${res.username}</span>
                            <div class="d-flex align-items-center">
                                <div class="purchase-cost me-2">${res.cost}</div>
                                <div class='msg flex-grow-1'>${res.description}</div>
                            </div>
                        </div>
                        <span class='icon-row ms-auto'><i class="bi bi-x-circle clear-purchase-btn"></i></span>
                    </div>
                </div>`;
            
            const clearPurchaseBtn = row.querySelector(".clear-purchase-btn");
            clearPurchaseBtn.addEventListener("click", dismissPurchase);
            clearPurchaseBtn.addEventListener("mouseenter", clearPurchaseBtnEnter);
            clearPurchaseBtn.addEventListener("mouseleave", clearPurchaseBtnLeave);

            purchaseBox.appendChild(row);
        }
        else if (res.type === "display-msg" && res.id) {
            const msgEl = document.querySelector(`.msg-row[data-id='${res.id}']`);
            if (msgEl.parentNode.id === "msg-container") {
                msgEl.remove();
                document.getElementById("purchased-container").appendChild(msgEl);
            }
        }
        else if (res.type === "delete-msg" && res.id) {
            const msgEl = document.querySelector(`.msg-row[data-id='${res.id}'`);
            if (msgEl) msgEl.remove();
        }
    });
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}

function trashMsg() {
    const row = this.closest(".msg-row");
    // row.remove();
    const msg = JSON.parse(decodeURIComponent(row.getAttribute('data-msg')));
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "delete-msg", id: msg.id }));
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
    if (socket && socket.readyState === WebSocket.OPEN) {
        const reply = { type: "display-msg", data: msg };
        socket.send(JSON.stringify(reply));
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