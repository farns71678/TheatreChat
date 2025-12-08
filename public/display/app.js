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
        const res = JSON.parse(await event.data);
        const data = res.data;
        console.log(res);

        if (res.type === 'display-msg') {

            const row = createElementFromHTML(`<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}"><div class='msg flex-grow-1'>${data.msg}</div></div>`);

            msgBox.appendChild(row);
        }
        else if (res.type === 'delete-msg' && res.id) {
            const msgEl = document.querySelector(`div.msg-row[data-id="${res.id}"]`);
            if (msgEl) {
                msgEl.remove();
            }
            else {
                console.log(`Unable to remove element with id ${res.id} because it was not found`);
            }
        }
    });
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