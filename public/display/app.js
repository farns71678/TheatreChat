const msgBox = document.getElementById('msg-container');
const currentUrl = window.location.href;
const urlObj = new URL(currentUrl);
const domain = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
const socketUrl = `ws://${domain}:${port}/ws/display`;
let socket = null;

class DisplaySocket extends WebSocketWithHeartbeat {
    onMessage(message) {
        console.log(message);

        let row = document.createElement('div');
        row.innerHTML = `<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-msg="${encodeURIComponent(JSON.stringify(message))}"><div class='msg flex-grow-1'>${message.msg}</div></div>`;

        msgBox.appendChild(row);
    }
}


try {
    socket = new DisplaySocket(socketUrl);
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}
