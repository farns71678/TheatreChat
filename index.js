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
const createPongMessage = (timestamp) => JSON.stringify({ type: 'pong', timestamp });

server.on('upgrade', (request, socket, head) => {
    const { url } = request;

    if (url === '/ws/moderator') {
        const sessionId = cookie.parse(request.headers.cookie || '').sessionId;
        if (!sessionId) {
            // Send error message before closing
            socket.write('HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\nContent-Length: 58\r\n\r\n');
            socket.write(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED', message: 'No session found' }));
            socket.destroy();
            return;
        }

        const session = sessions.get(sessionId);
        if (!session || new Date().getTime() >= session.timestamp + maxSessionAge * 1000) {
            socket.write('HTTP/1.1 401 Unauthorized\r\nContent-Type: application/json\r\nContent-Length: 60\r\n\r\n');
            socket.write(JSON.stringify({ type: 'error', code: 'UNAUTHORIZED', message: 'Session expired' }));
            socket.destroy();
            return;
        }
        wss.handleUpgrade(request, socket, head, handleModeratorConnection);
    }
    else if (url === '/ws/display') {
        wss.handleUpgrade(request, socket, head, handleDisplayConnection);
    }
    else {
        socket.destroy();
    }
});


function handleModeratorConnection(socket, req) {
    try {
        
        if (moderator.socket) {
            socket.close();
        }
        else {
            moderator.socket = socket; 
        }

        socket.on('message', (msg) => {
            try {
                const data = JSON.parse(Buffer.isBuffer(msg) ? msg.toString() : msg);

                if (data.type === 'ping') {
                    socket.send(createPongMessage(msg.timestamp));
                }
                else if (data.msg) {
                    displays.forEach((display) => {
                        display.send(JSON.stringify(data));
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
    const clientId = uuid.v4();
    socket.isAlive = true;

    socket.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.type === 'ping') {
                socket.send(createPongMessage(msg.timestamp));
            }
        }
        catch (err) {
            console.log(`Invalid socket display message: ${err}`);
        }
    })

    socket.on("close", () => {
        displays.delete(clientId);
    });
    displays.set(clientId, socket);
}


server.listen(port, () => {
    console.log(`Client port listening on port ${port}`);
});