const pingMessage = JSON.stringify({ type: 'ping', timestamp: Date.now() });

class WebSocketWithHeartbeat {
    constructor(url, pingInterval = 30000, pongTimeout = 10000) {
        this.url = url;
        this.pingInterval = pingInterval; // Send Ping every 30s
        this.pongTimeout = pongTimeout;   // Wait 10s for Pong
        this.ws = null;
        this.pingTimer = null;
        this.pongTimer = null;
        this.connect();
    }

    connect() {
        this.ws = new WebSocket(this.url);

        // On connection open: start sending Pings
        this.ws.onopen = () => {
            console.log('Connected. Starting heartbeats...');
            this.startPingInterval();
        };

        // On message: check for Pong and reset timeout
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') {
                this.handlePong(message.timestamp);
            } else {
                // Handle regular messages
                this.onMessage(message);
            }
        };

        // On message: check for error messages
        this.ws.addEventListener('message', (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.type === 'error' && message.code === 'UNAUTHORIZED') {
                    console.warn('Unauthorized: Redirecting to login...');
                    this.stopPingInterval();
                    window.location.href = '/login?durl=moderator';
                    return;
                }
            } catch (e) {
                // Not a JSON message, ignore
            }
        });

        // On close/error: check close code for unauthorized
        this.ws.onclose = (event) => {
            this.onClose(event);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    startPingInterval() {
        this.pingTimer = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(pingMessage);
                console.log('Sent Ping');
                // Start Pong timeout timer
                this.startPongTimeout();
            }
        }, this.pingInterval);
    }

    startPongTimeout() {
        this.pongTimer = setTimeout(() => {
            console.error('Pong timeout! Closing connection.');
            this.ws.close(1011, 'Pong timeout'); // Close with error code
        }, this.pongTimeout);
    }

    handlePong(timestamp) {
        clearTimeout(this.pongTimer); // Reset timeout
        const latency = Date.now() - timestamp;
        console.log(`Received Pong. Latency: ${latency}ms`);
    }

    stopPingInterval() {
        clearInterval(this.pingTimer);
        clearTimeout(this.pongTimer);
    }

    // Override this to handle regular messages
    onMessage(message) {
        console.log('Received message:', message);
    }

    onClose(event) {
        console.log('Disconnected. Close code:', event.code, 'Reason:', event.reason);
        this.stopPingInterval();
        setTimeout(() => this.connect(), 5000); // Retry after 5s

    }

    sendMessage(message) {
        this.ws.send(message);
    }

    getState() {
        return this.ws.readyState;
    }
}

//module.exports = WebSocketWithHeartbeat;

// Usage
//const wsClient = new WebSocketWithHeartbeat('wss://your-server.com/ws');
