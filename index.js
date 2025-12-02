const uuid = require('uuid');
const WebSocket = require('ws');
const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const { sessions, authedUsers, maxSessionAge } = require('./include/session');
const { checkUser, requireAuth, requireAdminAuth } = require('./middleware/authMiddleware');
const moderator = require('./include/moderator');
const authRoutes = require('./routes/authRoutes');
const dataRoutes = require('./routes/dataRoutes');
const http = require('http');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
let displays = new Map();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set('view engine', 'ejs');


// big TODO: handle chat and purchase state on server

app.get('/', (req, res) => {
    res.redirect('/client');
});

app.get('/config', checkUser, requireAdminAuth, (req, res) => {
    res.render('config');
});

app.get('/moderator', checkUser, requireAuth, (req, res) => {
    res.render('moderator');
});

// routes
app.use(authRoutes);
app.use(dataRoutes);

// incase of 404 redirect to client page
app.use((req, res) => {
    res.redirect("/client");
});

// websocket stuff
const server = http.createServer(app);

const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
    const { url } = request;

    if (url === '/ws/moderator') {
        wss.handleUpgrade(request, socket, head, handleModeratorConnection);
    }
    else if (url === '/ws/display') {
        wss.handleUpgrade(request, socket, head, handleDisplayConnection);
    }
    else {
        socket.destroy();
    }
})

function handleModeratorConnection(socket, req) {
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
}


function handleDisplayConnection(socket, req) {
    let clientId = uuid.v4();
    displays.set(clientId, socket);
}


server.listen(port, () => {
    console.log(`Client port listening on port ${port}`);
});