const fs = require('node:fs/promises');
const uuid = require('uuid');
const WebSocket = require('ws');
const express = require('express');
const app = express();
const port = 3000;
const wssPort = 5600;
const wssModerator = new WebSocket.Server({ port: wssPort });
const wssDisplay = new WebSocket.Server({ port: 8080 });
let displays = new Map();
let moderator = null;
let optionlist = null;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');

loadMoneySpendingOptionFile();

app.post('/chatmsg', (req, res) => {
    try {
        const body = req.body;
        console.log(body);

        const data = { type: "chat-msg", username: body.username, msg: body.msg };
        if (data.msg && moderator) {
            moderator.send(JSON.stringify(data));
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
});

app.get('/purchaseoptions', async (req, res) => {
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
        res.send(JSON.stringify({ list: [] }));
    }
});

app.post('/modifypurchaseoptions', async (req, res) => {
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
        await fs.writeFile(__dirname + "/data/waystospendyourmoney.csv", fileContent);
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
});

app.post('/purchaseitem', (req, res) => {
    const purchase = req.body;
    console.log(purchase);

    if (moderator && moderator.readyState == WebSocket.OPEN && purchase.username) {
        moderator.send(JSON.stringify({ type: "purchase", username: purchase.username, description: purchase.description, cost: purchase.cost }));
    }
});

app.get('/config', (req, res) => {
    res.render('config');
});

async function loadMoneySpendingOptionFile() {
    const data = await fs.readFile(__dirname + '/data/waystospendyourmoney.csv', { encoding: 'utf8' });
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

// websocket stuff

wssModerator.on('connection', (socket) => {
    if (moderator) {
        socket.close();
    }
    else {
        moderator = socket; 
    }

    socket.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.msg) {
                displays.forEach((display) => {
                    display.send(msg);
                });
            }
        }
        catch (err) {
            console.error('Invalid message', err);
        }
    });

    socket.on('close', () => {
        moderator = null;
    });
});

wssDisplay.on('connection', (socket) => {
    let clientId = uuid.v4();
    displays.set(clientId, socket);
});



app.listen(port, () => {
    console.log(`Client port listening on port ${port}`);
});