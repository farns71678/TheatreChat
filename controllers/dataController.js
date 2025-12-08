const fs = require('node:fs/promises');
const WebSocket = require('ws');
const uuid = require('uuid');
const { moderators, chatMessages, MsgState } = require('../include/moderator');
const optionsFilePath = './include/data/waystospendyourmoney.csv';
let optionlist = null;

const chatmsg_post = (req, res) => {
    try {
        const body = req.body;
        console.log(body);

        const createdMsg = { id: uuid.v4(), username: body.username, msg: body.msg, state: MsgState.pending };
        const data = { type: "chat-msg", data: createdMsg };
        if (data.data.msg && moderators.size > 0) {
            moderators.forEach((moderator) => {
                if (moderator.socket && moderator.readyState === WebSocket.readyState) {
                    moderator.socket.send(JSON.stringify(data));
                }
            });
            chatMessages.push(createdMsg);
            res.send("success");
            return;
        }
        else {
            res.status(500).send("Unable to process");
        }
    }
    catch (err) {
        console.log(`Error processing /chatmsg: ${err}`);
        res.status(500).send("Unable to process");
    }
};

const purchaseOptions_get =  async (req, res) => {
    try {
        if (optionlist) {
            res.send(JSON.stringify(optionlist));
        }
        else {
            await loadMoneySpendingOptionFile();
            if (optionlist) {
                res.send(JSON.stringify(optionlist));
                return;
            }
            else {
                res.send(JSON.stringify({ options: [] }));
                return;
            }
        }
    }
    catch (err) {
        console.log(`Error occured retreiving btn list: ${err}`);
        res.send(JSON.stringify({ options: [] }));
    }
};

const modifyPurchaseOptions_post = async (req, res) => {
    try {
        const options = req.body.options;
        let fileContent = "Option,Price";
        options.forEach((option) => {
            if (isNaN(option.cost)) {
                res.status(400).json({ error: "Must include a valid cost" });
                return;
            }
            if (!option.description.trim()) {
                res.status(400).json({ error: "Must include a purchase description" });
                return;
            }
            fileContent += `\n${option.description},${option.cost}`;
        });

        // if they passed...
        await fs.writeFile(optionsFilePath, fileContent);
        await loadMoneySpendingOptionFile();
        if (optionlist) {
            res.json(optionlist);
        }
        else {
            res.json({ options: [] });
        }
    }
    catch (err) {
        console.log(`An error occurred while saving modified purchase options: ${err}`);
        res.status(500).json({ error: "Unable to modify purchase options "});
        return;
    }
};

const purchaseItem_post = (req, res) => {
    const purchase = req.body;
    console.log(purchase);

    if (!purchase.username) {
        return res.status(400).json({ error: "Username required to make purchase" });
    }

    if (moderators.size > 0) {
        moderators.forEach(moderator => {
            if (moderator.socket && moderator.socket.readyState == WebSocket.OPEN) {
                moderator.socket.send(JSON.stringify({ type: "purchase", username: purchase.username, description: purchase.description, cost: purchase.cost }));
            }
        });
        res.json({ msg: "Success" });
    }
    else {
        res.status(500).json({ error: "Unable to handle purchase" });
    }
};


async function loadMoneySpendingOptionFile() {
    const data = await fs.readFile(optionsFilePath, { encoding: 'utf8' });
    const lines = data.replaceAll("\r", "").split("\n");
    optionlist = { options: [] };
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.length > 0) {
            const items = line.split(",").map(item => item.trim());
            if (items.length == 2 && items[0].length > 0 && items[1].length > 0) {
                optionlist.options.push({ description: items[0], cost: items[1] });
            }
        }
    }
    if (optionlist.options.length == 0) optionlist = null;
    return optionlist;
}

module.exports = { chatmsg_post, purchaseOptions_get, modifyPurchaseOptions_post, purchaseItem_post };