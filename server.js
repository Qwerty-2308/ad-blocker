const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto');

// Configuration
const PROXY_PORT = 41242;
const REAL_SERVER_PORT = 41243;

// Start the real A2A server
console.log('Starting Gemini A2A Server...');
const a2aServer = spawn('npm', ['run', 'start', '--workspace', '@google/gemini-cli-a2a-server'], {
    cwd: __dirname + '/gemini-cli',
    env: { ...process.env, CODER_AGENT_PORT: REAL_SERVER_PORT.toString() },
    stdio: 'inherit'
});

a2aServer.on('error', (err) => {
    console.error('Failed to start A2A server:', err);
});

// Create Proxy Server
const server = http.createServer((req, res) => {
    // Handle Shutdown
    if (req.method === 'POST' && req.url === '/shutdown') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Shutting down server...' }));

        console.log('Shutdown requested. Terminating A2A server...');
        a2aServer.kill();
        setTimeout(() => {
            console.log('Exiting proxy.');
            process.exit(0);
        }, 500);
        return;
    }

    // Proxy everything else
    const options = {
        hostname: 'localhost',
        port: REAL_SERVER_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers,
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (e) => {
        console.error(`Proxy error: ${e.message}`);
        res.writeHead(502);
        res.end('Bad Gateway: Could not connect to A2A server');
    });

    req.pipe(proxyReq, { end: true });
});

server.listen(PROXY_PORT, () => {
    console.log(`Proxy server listening on http://localhost:${PROXY_PORT}`);
    console.log(`Forwarding to A2A server on port ${REAL_SERVER_PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
    a2aServer.kill();
    process.exit();
});
