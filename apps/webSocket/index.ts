import { WebSocketServer } from 'ws';
import { IssueManager } from './src/Managers/IssueManager';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', function connection(ws) {

  const manager = new IssueManager()
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('Hello from server');
}); 