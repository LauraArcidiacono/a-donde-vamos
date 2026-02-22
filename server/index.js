import http from 'http';
import os from 'os';
import { WebSocketServer } from 'ws';

import { serveStaticFile } from './httpServer.js';
import { handleMessage } from './wsHandler.js';
import { handleDisconnection } from './gameFlow.js';
import { startRoomCleanup, stopRoomCleanup } from './rooms.js';

const PORT = parseInt(process.env.PORT, 10) || 3000;
const RATE_LIMIT_MAX = 10; // max messages per second
const RATE_LIMIT_WINDOW = 1000; // 1 second in ms

const httpServer = http.createServer(serveStaticFile);

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  ws._msgTimestamps = [];

  ws.on('message', (rawData) => {
    const now = Date.now();
    ws._msgTimestamps = ws._msgTimestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (ws._msgTimestamps.length >= RATE_LIMIT_MAX) {
      ws.close(1008, 'Rate limit exceeded');
      return;
    }
    ws._msgTimestamps.push(now);
    handleMessage(ws, rawData.toString());
  });

  ws.on('close', () => {
    handleDisconnection(ws);
  });

  ws.on('error', (err) => {
    console.error(`[WS] Connection error: ${err.message}`);
    handleDisconnection(ws);
  });
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ipAddresses = [];

  for (const [, interfaceAddresses] of Object.entries(interfaces)) {
    for (const interfaceAddress of interfaceAddresses) {
      if (interfaceAddress.family === 'IPv4' && !interfaceAddress.internal) {
        ipAddresses.push(interfaceAddress.address);
      }
    }
  }

  return ipAddresses;
}

startRoomCleanup();

httpServer.listen(PORT, () => {
  const localIPs = getLocalIPs();

  console.log('');
  console.log('  A Donde Vamos server running!');
  console.log('');
  console.log(`  Local:    http://localhost:${PORT}`);

  for (const ip of localIPs) {
    console.log(`  Network:  http://${ip}:${PORT}`);
  }

  console.log('');
  console.log('  Share the network URL with the other player!');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n  Shutting down...');
  stopRoomCleanup();
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  httpServer.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  stopRoomCleanup();
  wss.clients.forEach((ws) => {
    ws.close(1001, 'Server shutting down');
  });
  httpServer.close(() => {
    process.exit(0);
  });
});
