const msgBox = document.getElementById('msg-container');
const socketUrl = "ws://localhost:5600";
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

        if (!res.msg) return;

        let row = document.createElement('div');
        row.innerHTML = `<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-msg="${encodeURIComponent(JSON.stringify(res))}"><div class='msg flex-grow-1'>${res.msg}</div><span class='icon-row'><i class="bi bi-trash-fill trash-btn"></i><i class="bi bi-send-fill send-btn"></i></span></div>`;
        
        row.querySelector(".trash-btn").addEventListener("click", trashMsg);
        row.querySelector(".send-btn").addEventListener("click", sendMsg);

        msgBox.appendChild(row);
    })
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}

function trashMsg() {
    const row = this.closest(".msg-row");
    row.remove();
}

function sendMsg() {
    const row = this.closest(".msg-row");
    const msg = decodeURIComponent(row.getAttribute('data-msg'));
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(msg);
        console.log(`Sending message: ${msg}`);
        row.remove();
    }
    else {
        console.log("unable to send message to client")
    }
}