const uuid = require('uuid');
const WebSocket = require('ws');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const { sessions, authedUsers, maxSessionAge } = require('./include/session');
const { checkUser, requireAuth, requireAdminAuth } = require('./middleware/authMiddleware');
const moderator = require('./include/moderator');
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const express = require('express');
const app = express();
const port = 3000;
const wssPort = 5600;
const wssModerator = new WebSocket.Server({ port: wssPort });
const wssDisplay = new WebSocket.Server({ port: 8080 });
let displays = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');


// big TODO: handle chat and purchase state on server

app.get('/config', checkUser, requireAdminAuth, (req, res) => {
    res.render('config');
});

app.get('/moderator', checkUser, requireAuth, (req, res) => {
    res.render('moderator');
});

// routes
app.use(authRoutes);
app.use(dataRoutes);


// websocket stuff

wssModerator.on('connection', (socket, req, client) => {
    try {

        const sessionId = cookie.parse(req.headers.cookie || '').sessionId;
        if (!sessionId) {
            socket.close(1008, "Unauthorized");
            return;
        }

        const session = sessions.get(sessionId);
        if (!session || new Date().getTime() >= session.timestamp + maxSessionAge * 1000) {
            return socket.close(1008, "Unauthorized");
        }
        
        if (moderator.socket) {
            socket.close();
        }
        else {
            moderator.socket = socket; 
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
            moderator.socket = null;
        });
    }
    catch (error) {
        console.log(`An Error occured on moderator connection: ${error}`);
    }
});

wssDisplay.on('connection', (socket) => {
    let clientId = uuid.v4();
    displays.set(clientId, socket);
});



app.listen(port, () => {
    console.log(`Client port listening on port ${port}`);
});