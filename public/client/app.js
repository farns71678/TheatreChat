const chatForm = document.getElementById("chat-form");

const purchaseMap = {
    'pending': 'Pending...',
    'purchased': 'Confirmed <i class="bi bi-check-lg"></i>',
    'discarded': 'Discarded <i class="bi bi-trash"></i>'
};

let purchaseUpdateInterval = null;

loadOptions();

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    console.log("submit");
    sendChatMsg();
});

initUsernameModal();

const purchaseModal = document.getElementById('purchase-modal');
if (purchaseModal) {
    purchaseModal.addEventListener('show.bs.modal', event => {
        // Button that triggered the modal
        const button = event.relatedTarget;
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
        
        purchaseButton.disabled = true;

        const res = await fetch('/purchaseitem', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ username, cost, description })
        });

        purchaseButton.disabled = false;
        const data = await res.json();

        if (res.ok) {
            purchaseModal.querySelector("#purchase-modal-close-btn").click();
            const purchase = data.purchase;
            if (purchase) {
                const purchasedContainer = document.getElementById("purchased-container");
                purchasedContainer.appendChild(createElementFromHTML(`<div class="purchase-row w-100 p-2 ps-3 mb-2 mt-2" data-state="${purchase.state}" data-id="${purchase.id}" data-purchase="${encodeURIComponent(JSON.stringify(purchase))}">
                    <div class="d-flex me-2">
                        <div class="d-flex align-items-center">
                            <div class="purchase-cost me-2">$${purchase.cost}</div>
                            <div class='msg flex-grow-1'>${purchase.description}</div>
                        </div>
                        <div class="flex-grow-1 text-end purchase-state fw-bold">${purchaseMap[purchase.state || "pending"]}</div>
                    </div>
                </div>`));
                startPurchaseUpdates();
            }
        }
        else {
            purchaseErr.innerText = data.error || "Sorry, we couldn't process the purchase";
        }

    });
}

function sendChatMsg() {
    try {
        const msgBox = document.getElementById("chat-input");
        const usernameInput = document.getElementById("username-input");
        const errorBox = document.getElementById("form-err");
        let msg = msgBox.value.trim();
        let username = usernameInput.value.trim();
        if (msg == '') return;

        errorBox.innerText = "";
        if (!username) {
            errorBox.innerText = "Username required";
            return;
        }

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

function initUsernameModal() {
    const usernameModal = new bootstrap.Modal("#username-modal");
    const usernameSubmit = document.getElementById("confirm-username-btn");
    const usernameModalInput = document.getElementById("username-modal-input");
    usernameSubmit.addEventListener("click", () => {
        const usernameErr = document.getElementById("username-modal-err");
        const username = usernameModalInput.value.trim();

        usernameErr.innerText = "";
        if (!username) {
            usernameErr.innerText = "Username required";
            return;
        }

        const usernameInput = document.getElementById("username-input");
        usernameInput.value = username;
        usernameModal.hide();
    });

    const usernameModalForm = document.getElementById("username-modal-form");
    usernameModalForm.addEventListener("submit", (event) => {
        event.preventDefault();
        usernameSubmit.click();
    });

    const usernameModalEl = document.getElementById("username-modal");
    usernameModalEl.addEventListener("shown.bs.modal", () => {
        usernameModalInput.focus();
    });

    usernameModal.show();
}

function startPurchaseUpdates() {
    if (purchaseUpdateInterval) return;
    purchaseUpdateInterval = setInterval(async () => {
        const purchases = Array.from(document.querySelectorAll(".purchase-row")).map(row => row.getAttribute("data-id"));
        if (purchases.length === 0) {
            clearInterval(purchaseUpdateInterval);
            return;
        }

        const res = await fetch('/getpurchasestate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify({ purchaseIds: purchases })
        });

        if (res.ok) {
            const data = await res.json();
            data.purchases.forEach(purchase => {
                const row = document.querySelector(`.purchase-row[data-id='${purchase.id}']`);
                if (row) {
                    row.setAttribute('data-state', purchase.state);
                    const stateDiv = row.querySelector(`.purchase-state`);
                    if (stateDiv) {
                        stateDiv.innerHTML = purchaseMap[purchase.state || "pending"];
                    }
                }
            });
        }
        else {
            console.log("Unable to get purchase updates");
        }
    }, 15000);
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}