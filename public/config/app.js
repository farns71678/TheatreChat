const createPurchaseBtn = document.getElementById("create-purchase-btn");
const clearPurchaseBtn = document.getElementById("clear-purchase-btn");
const purchaseCostInput = document.getElementById("purchase-cost-input");
const purchaseDescriptionInput = document.getElementById("purchase-description-input");
//const purchaseItems = document.getElementById("purchase-items");
const purchaseSaveBtn = document.getElementById("save-purchases-btn");
const createErr = document.getElementById("create-purchase-err");

const ButtonState = {
    Enabled: 0,
    Disabled: 1,
    Loading: 2
};

loadPurchaseOptions();

clearPurchaseBtn.addEventListener("click", clearPurchaseInput);

createPurchaseBtn.addEventListener("click", () => {
    createErr.innerText = "";
    const cost = parseFloat(purchaseCostInput.value);
    const description = purchaseDescriptionInput.value.trim();

    if (!description) {
        createErr.innerText = "Must include a description";
        return;
    }

    if (isNaN(cost)) {
        createErr.innerText = "Must include a cost";
        return;
    }

    createPurchaseOption({ cost, description });


    clearPurchaseInput();
});

purchaseSaveBtn.addEventListener("click", async () => {
    try {
        createErr.innerText = "";
        setBtnState(purchaseSaveBtn, "Saving", ButtonState.Loading);
        const purchaseItems = document.querySelectorAll(".purchase-item:not(#create-purchase-form)");

        if (purchaseItems.length == 0) {
            setBtnState(purchaseSaveBtn, "Save");
            return;
        }

        let optionData = { options: [] };

        for (let i = 0; i < purchaseItems.length; i++) {
            const item = purchaseItems[i];
            if (item.classList.contains("deleted")) continue;
            let cost = item.getAttribute("data-cost");
            let description = item.getAttribute("data-description");
            if (item.classList.contains("edited")) {
                cost = parseFloat(item.querySelector("input.purchase-cost").value);
                description = item.querySelector("input.purchase-description").value.trim();
            }
            optionData.options.push({ cost, description });
        }

        let res = await fetch('/modifypurchaseoptions', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json; charset=UTF-8'
            },
            body: JSON.stringify(optionData)
        });

        const data = await res.json();
        if (!res.ok) {
            createErr.innerText = data.error;
        }
        else {
            fillPurchaseOptions(data);
        }

    }
    catch (error) {
        console.log(`An error occured saving purchase options: ${error}`);
        createErr.innerText = "Unable to save modified purchase options";
    }
    setBtnState(purchaseSaveBtn, "Save");
});

document.getElementById("revert-changes-btn").addEventListener("click", () => {
    const purchaseItems = document.querySelectorAll(".purchase-item:not(#create-purchase-form)");
    for (let i = 0; i < purchaseItems.length; i++) {
        const purchaseEl = purchaseItems[i];
        purchaseEl.querySelector(".icon-row.revert-icon").classList.add("hidden");
        purchaseEl.querySelector(".icon-row:not(.revert-icon)").classList.remove("hidden");

        if (purchaseEl.classList.contains("edited")) {
            //edited
            const cost = parseFloat(purchaseEl.getAttribute("data-cost"));
            const description = purchaseEl.getAttribute("data-description");
            purchaseEl.querySelector(".purchase-content").innerHTML = `$<span class="purchase-cost me-2">${cost}</span> 
                    Description: <span class="purchase-description ms-1">${description}</span>`;

            purchaseEl.classList.remove("edited");
        }
        else if (purchaseEl.classList.contains("new")) {
            purchaseEl.remove();
        }
        else {
            purchaseEl.classList.remove("deleted");
        }
    }
})

async function loadPurchaseOptions() {
    try {
        setBtnState(purchaseSaveBtn, "Loading", ButtonState.Loading);
        const res = await fetch('/purchaseoptions');
        if (!res.ok) {
            createErr.innerText = "Unable to load purchase options. Try reloading. ";
            return;
        }

        const data = await res.json();
        fillPurchaseOptions(data);
        setBtnState(purchaseSaveBtn, "Save");
    }
    catch (error) {
        console.log(`Error loading purchase options: ${error}`);
        createErr.innerText = "Unable to load purchase options. Try reloading. ";
        setBtnState(purchaseSaveBtn, "Loading", ButtonState.Disabled);
    }
}

function clearPurchaseInput() {
    purchaseCostInput.value = "";
    purchaseDescriptionInput.value = "";
}

function editPurchaseOption() {
    const purchaseEl = this.closest(".purchase-item");
    if (!purchaseEl) return;
    const cost = parseFloat(purchaseEl.getAttribute("data-cost"));
    const description = purchaseEl.getAttribute("data-description");
    purchaseEl.querySelector(".purchase-content").innerHTML = 
            `$<input type="number" class="purchase-cost me-2 ms-1 form-control" value="${cost}" min="0" placeholder="Price">
            Description: <input type="text" class="purchase-description ms-1 form-control" value="${description}" placeholder="Purchase description">`;

    purchaseEl.querySelector(".icon-row.revert-icon").classList.remove("hidden");
    purchaseEl.querySelector(".icon-row:not(.revert-icon)").classList.add("hidden");

    purchaseEl.classList.add("edited");
}

function deletePurchaseOption() {
    const purchaseEl = this.closest(".purchase-item");
    if (!purchaseEl) return;

    purchaseEl.querySelector(".icon-row.revert-icon").classList.remove("hidden");
    purchaseEl.querySelector(".icon-row:not(.revert-icon)").classList.add("hidden");

    purchaseEl.classList.add("deleted");
}

function revertPurchaseChanges() {
    const purchaseEl = this.closest(".purchase-item");
    if (!purchaseEl) return;

    purchaseEl.querySelector(".icon-row.revert-icon").classList.add("hidden");
    purchaseEl.querySelector(".icon-row:not(.revert-icon)").classList.remove("hidden");

    if (purchaseEl.classList.contains("edited")) {
        //edited
        const cost = parseFloat(purchaseEl.getAttribute("data-cost"));
        const description = purchaseEl.getAttribute("data-description");
        purchaseEl.querySelector(".purchase-content").innerHTML = `$<span class="purchase-cost me-2">${cost}</span> 
                Description: <span class="purchase-description ms-1">${description}</span>`;

        purchaseEl.classList.remove("edited");
    }
    else {
        purchaseEl.classList.remove("deleted");
    }

}

function fillPurchaseOptions(data) {
    document.getElementById("purchase-items").innerHTML = "";
    data.options.forEach(option => {
        createPurchaseOption(option, false);
    });
}

function createPurchaseOption(option, created = true) {
    const row = createElementFromHTML(`<div class="purchase-item d-flex w-100 p-2 align-items-center rounded-1 ps-3 mb-1${created ? " new" : ""}" data-cost="${option.cost}" data-description="${option.description}">
            <div class="purchase-content">
            $<span class="purchase-cost me-2">${option.cost}</span> 
            Description: <span class="purchase-description ms-1">${option.description}</span> 
            </div>
            <span class="icon-row">
                <button class="btn purchase-icon-btn rounded-1 edit-purchase-btn"><i class="bi bi-pencil-square"></i></button>
                <button class="btn purchase-icon-btn rounded-1 remove-purchase-btn"><i class="bi bi-trash-fill"></i></button>
            </span>
            <span class="icon-row revert-icon hidden">
                <button class="btn purchase-icon-btn rounded-1 revert-purchase-btn"><i class="bi bi-arrow-counterclockwise"></i></button>
            </span>
        </div>`);

    row.querySelector(".edit-purchase-btn").addEventListener("click", editPurchaseOption);
    row.querySelector(".remove-purchase-btn").addEventListener("click", deletePurchaseOption);
    row.querySelector(".revert-purchase-btn").addEventListener("click", revertPurchaseChanges);

    document.getElementById("purchase-items").appendChild(row);
}

// we recommend this function is used on a button with display: flex and align-items: center
function setBtnState(btn, text, state = ButtonState.Enabled) {
    try {
        if (state == ButtonState.Disabled) {
            btn.disabled = true;
            btn.innerHTML = text;
        }
        else if (state == ButtonState.Loading) {
            btn.disabled = true;
            btn.innerHTML = `<span class="me-1">${text}</span><div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                            </div>`;
        }
        else {
            btn.disabled = false;
            btn.innerHTML = text;
        }
    }
    catch (error) {
        console.log(`Error setting btn state: ${error}`);
    }
}

function createElementFromHTML(htmlString) {
  var div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  // Change this to div.childNodes to support multiple top-level nodes.
  return div.firstChild;
}