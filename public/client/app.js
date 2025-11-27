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
        purchaseCost.innerText = cost;
        purchaseDescription.innerText = description; 
        purchaseModal.setAttribute('data-item-description', description);
        purchaseModal.setAttribute('data-item-cost', cost);
    });
}

const purchaseButton = document.getElementById("confirm-purchase-btn");
if (purchaseButton) {
    purchaseButton.addEventListener('click', async () => {
        const cost = purchaseModal.getAttribute('data-item-cost');
        const description = purchaseModal.getAttribute('data-item-description');
        const username = document.getElementById("username-input").value.trim();

        fetch('/purchaseitem', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ username, cost, description })
        });
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
        msgBox.value = "";
    }
    catch (err) {
        console.log(`Unable to send message: ${err}`);
    }
}

async function loadOptions() {
    try {
        const optionsContainer = document.getElementById('options-container');
        const res = await fetch('/btnlist');
        const data = await res.json();
        optionsContainer.innerHTML = "";

        data.list.forEach(item => {
            const row = document.createElement('div');
            row.innerHTML = `<div class="option-row d-flex p-1"><div class="price m-1">${item.price}</div><div class="option-text flex-grow-1 m-1">${item.description}</div><div class="m-1"><button type="button" class="icon-btn" data-bs-toggle="modal" data-bs-target="#purchase-modal" data-bs-description="${item.description}" data-bs-cost="${item.price}"><i class="bi bi-bag-heart purchase-btn"></i></button></div></div>`;
            
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