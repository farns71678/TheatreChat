const fs = require('fs');
const logDir = process.env.LOG_DIR || "./logs";

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logToFile = (file, content) => {
    const timestamp = new Date().toISOString();
    fs.appendFile(logDir + file, timestamp + ": \t" + content + "\r\n", (err) => {
        if (err) {
            console.log(`Error logging to ${file}: ${err}`);
        }
    });
}

const logMessage = (type, msg) => {
    const file = "/messageLogs.txt";
    const content = JSON.stringify({ type, data: msg }).replaceAll("\n", "\\n");
    logToFile(file, content);
}

const logPurchase = (type, purchase) => {
    const file = "/purchaseLogs.txt";
    const content = JSON.stringify({ type, data: purchase }).replaceAll("\n", "\\n");
    logToFile(file, content);
}

module.exports = { logMessage, logPurchase, logToFile };