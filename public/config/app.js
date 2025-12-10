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

const downloadFile = (filename, content, type = "text/plain") => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: type });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    element.remove();
}

// if page links need to be absolute, set urlType to "absolute"
const pages = [
    { name: "Moderator", url: "/moderator", icon: "bi-shield-lock-fill" },
    { name: "Confi", url: "/config", icon: "bi-gear-fill" },
    { name: "Client", url: "/client", icon: "bi-person-fill" },
    { name: "Display", url: "/display", icon: "bi-tv-fill"}
];

try {
    loadPurchaseOptions();

    loadPages();

    const qrCodeBtns = document.querySelectorAll(".qr-code-btn");
    qrCodeBtns.forEach(btn => {
        btn.addEventListener("click", function () {
            const url = this.getAttribute("data-url");
            const page = this.getAttribute("data-page");
            const qrCodeModal = new bootstrap.Modal(document.getElementById("qr-code-modal"));
            document.getElementById("qr-code-modal-label").innerHTML = `QR Code for <span style="color: lightskyblue">${page}</span>`;
            const qrCodeContainer = document.getElementById("qr-code-container");
            qrCodeContainer.innerHTML = "";
            const qrCode = new QRCode({
                content: url,
                container: "svg-viewbox",
                padding: 2,
                join: true
            });
            const svg = qrCode.svg();
            qrCodeContainer.innerHTML = svg;

            const saveBtn = document.getElementById("qr-code-save-btn");
            $(saveBtn).off("click");
            saveBtn.addEventListener("click", () => {
                downloadFile(`theatrechat-qrcode-${page}.svg`, qrCodeContainer.innerHTML, "image/svg+xml");
            });

            qrCodeModal.show();
        });
    })
}
catch (error) {
    console.log(`Error on page load: ${error}`);
}

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

function loadPages() {
    const container = document.getElementById("page-links-container");
    const currentUrl = window.location.href;
    const urlObj = new URL(currentUrl);
    const domain = urlObj.hostname;
    const port = urlObj.port || (urlObj.protocol === "https:" ? "443" : "80");
    pages.forEach(page => {
        let url = page.url;
        if (page.urlType !== "absolute") {
            url = `${urlObj.protocol}//${domain}:${port}${page.url}`;
        }
        const pageEl = createElementFromHTML(`<p><i class="bi ${page.icon} me-2" style="color: orange;"></i><strong>${page.name} Page: </strong><a href="${url}" target="_blank">${url}</a>
            <span class="icon-row" style="display: inline;"><button class="btn qr-code-btn bx-svg-btn ms-2" data-url="${url}" data-page="${page.name.toLowerCase()}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: white;transform: ;msFilter:;"><path d="M3 11h8V3H3zm2-6h4v4H5zM3 21h8v-8H3zm2-6h4v4H5zm8-12v8h8V3zm6 6h-4V5h4zm-5.99 4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm2 2h2v2h-2zm-4 0h2v2h-2zm2-6h2v2h-2zm2 2h2v2h-2z"></path></svg>
            </button></span></p>`);
        container.appendChild(pageEl);
    });
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