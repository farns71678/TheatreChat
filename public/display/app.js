const msgBox = document.getElementById('msg-container');
const currentUrl = window.location.href;
const urlObj = new URL(currentUrl);
const domain = urlObj.hostname;
const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
const socketUrl = `ws://${domain}:${port}/ws/display`;
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
        let res = JSON.parse(await event.data.text());
        console.log(res);

        let row = document.createElement('div');
        row.innerHTML = `<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-msg="${encodeURIComponent(JSON.stringify(res))}"><div class='msg flex-grow-1'>${res.msg}</div></div>`;

        msgBox.appendChild(row);
    })
}
catch (err) {
    console.log(`Unable to connect to WebSocket: ${err}`);
}