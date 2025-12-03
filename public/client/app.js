const chatForm = document.getElementById("chat-form");

loadOptions();

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log("submit");
    sendChatMsg();
});

const purchaseModal = document.getElementById('purchase-modal')
if (purchaseModal) {
    purchaseModal.addEventListener('show.bs.modal', event => {
        // Button that triggered the modal
        const button = event.relatedTarget
        const description = button.getAttribute('data-bs-description');
        const cost = button.getAttribute('data-bs-cost');

        const purchaseCost = purchaseModal.querySelector('#purchase-cost');
        const purchaseDescription = purchaseModal.querySelector('#purchase-description');
        purchaseCost.innerText = "$" + cost;
        purchaseDescription.innerText = description; 
        purchaseModal.setAttribute('data-item-description', description);
        purchaseModal.setAttribute('data-item-cost', cost);

        const purchaseErr = purchaseModal.querySelector("#purchase-modal-err");
        purchaseErr.innerText = "";
    });
}

const purchaseButton = document.getElementById("confirm-purchase-btn");
if (purchaseButton) {
    purchaseButton.addEventListener('click', async () => {

        const cost = purchaseModal.getAttribute('data-item-cost');
        const description = purchaseModal.getAttribute('data-item-description');
        const username = document.getElementById("username-input").value.trim();
        const purchaseErr = purchaseModal.querySelector("#purchase-modal-err");
        purchaseErr.innerText = "";

        if (!username) {
            purchaseErr.innerText = "You must provide a username to make a purchase. ";
            return;
        }
        purchaseButton.disabled = true;

        const res = await fetch('/purchaseitem', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ username, cost, description })
        });

        purchaseButton.disabled = false;

        if (res.ok) {
            purchaseModal.hide();
        }
        else {
            purchaseErr.innerText = "Sorry, we couldn't process the purchase";
        }

    });
}

function sendChatMsg() {
    try {
        const msgBox = document.getElementById("chat-input");
        const usernameInput = document.getElementById("username-input");
        let msg = msgBox.value.trim();
        let username = usernameInput.value.trim();
        if (msg == '') return;

        // if (socket && socket.readyState === WebSocket.OPEN) {
        //     socket.send(JSON.stringify({ username, msg }));
        // }
        // else {
        //     console.log("unable to send message to client")
        // }
        fetch("/chatmsg", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ username, msg })
        });

        const msgContainer = document.getElementById("msg-container");
        msgContainer.appendChild(createElementFromHTML(`<div class='msg-row d-flex w-100 mt-1 mb-1 p-0 ps-1 p3-1' data-msg="${encodeURIComponent(msg)}"><div class='msg flex-grow-1'>${msg}</div><span class='icon-row'></span></div>`))
        const last = msgContainer.querySelector(".msg-row:last-child");
        last.scrollIntoView({ behavior: 'smooth' });
        msgBox.value = "";
    }
    catch (err) {
        console.log(`Unable to send message: ${err}`);
    }
}

async function loadOptions() {
    try {
        const optionsContainer = document.getElementById('options-container');
        const res = await fetch('/purchaseoptions');
        const data = await res.json();
        optionsContainer.innerHTML = "";

        data.options.forEach(item => {
            const row = document.createElement('div');
            row.innerHTML = `<div class="option-row d-flex p-1"><div class="price m-1">$${item.cost}</div><div class="option-text flex-grow-1 m-1">${item.description}</div><div class="m-1"><button type="button" class="icon-btn" data-bs-toggle="modal" data-bs-target="#purchase-modal" data-bs-description="${item.description}" data-bs-cost="${item.cost}"><i class="bi bi-bag-heart purchase-btn"></i></button></div></div>`;
            
            // const shopIcon = row.querySelector('.purchase-btn');

            // if (shopIcon) {
            //     shopIcon.addEventListener('click', purchaseItemClick);
            // }

            optionsContainer.appendChild(row);
        });
    }
    catch (err) {
        console.log(`Couldn't get option files: ${err}`);
    }
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}