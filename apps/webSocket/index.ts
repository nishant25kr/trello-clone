import { WebSocketServer } from 'ws';
import type { WebSocket } from "ws"
import { IssueManager } from './src/Managers/IssueManager';
import { User } from './src/Managers/User';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws: WebSocket) {

  const user = new User(ws)

  ws.on('error', console.error);

  ws.on('close', () => {
    user?.destroy();
  });

}); 