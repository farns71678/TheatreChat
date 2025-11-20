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
    // Extract info from data-bs-* attributes
    const description = button.getAttribute('data-bs-description')
    // If necessary, you could initiate an Ajax request here
    // and then do the updating in a callback.

    // Update the modal's content.
    const purchaseDescription = purchaseModal.querySelector('#purchase-description');

    purchaseDescription.innerText = description; 
  })
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
        const row = document.createElement('div');
        row.innerHTML = `<div class="option-row d-flex p-1"><div class="price m-1">${item.price}</div><div class="option-text flex-grow-1 m-1">${item.description}</div><div class="m-1"><i class="bi bi-bag-heart purchase-btn"></i></div></div>`;
        
        const shopIcon = row.querySelector('.purchase-btn');

        if (shopIcon) {
            shopIcon.addEventListener('click', purchaseItemClick);
        }

        data.list.forEach(item => {
            optionsContainer.appendChild(row);
        });
    }
    catch (err) {
        console.log(`Couldn't get option files: ${err}`);
    }
}

function purchaseItemClick() {

}