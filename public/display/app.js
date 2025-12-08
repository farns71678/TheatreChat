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
        const data = message.data;

        if (message.type === 'display-msg') {

            const row = createElementFromHTML(`<div class='msg-row d-flex w-100 p-2 ps-3 mb-2 mt-2' data-id="${data.id}" data-msg="${encodeURIComponent(JSON.stringify(data))}"><div class='msg flex-grow-1'>${data.msg}</div></div>`);

            msgBox.appendChild(row);
        }
        else if (message.type === 'delete-msg' && message.id) {
            const msgEl = document.querySelector(`div.msg-row[data-id="${message.id}"]`);
            if (msgEl) {
                msgEl.remove();
            }
            else {
                console.log(`Unable to remove element with id ${message.id} because it was not found`);
            }
        }
    }
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