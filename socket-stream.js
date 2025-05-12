import ws from 'k6/ws';
import { check } from 'k6';

export const options = { vus: 50000, duration: '30s' };

const URL = 'wss://echobeatapi.duckdns.org/socket.io/?EIO=4&transport=websocket';

export default function () {
  const res = ws.connect(URL, {}, (socket) => {
    let chunks = 0;
    let opened = false;

    socket.on('open', () => {
      /* nada aún: esperamos el paquete "0{…}" del servidor */
    });

    socket.on('message', (msg) => {
      // 0{…}  → paquete open con sid
      if (msg.startsWith('0')) {
        socket.send('40');  // abre namespace una vez recibido el "0"
      }
      // 41     → ack de namespace, ahora emitimos nuestro evento
      else if (msg === '40') {
        socket.send('42["startStream",{"songId":42,"userId":10}]');
        opened = true;
      }
      // 42[…]
      else if (msg.startsWith('42')) {
        const [event, payload] = JSON.parse(msg.slice(2));
        if (event === 'audioChunk') chunks++;
        if (event === 'streamComplete') socket.close();
      }
      // 2 → ping   → respondemos 3
      else if (msg === '2') {
        socket.send('3');
      }
    });

    socket.on('close', () => {
      console.log(`VU ${__VU} chunks=${chunks}`);
    });

    socket.on('error', (e) => console.log('ws error:', e.error()));

    /* safety-net: 25 s */
    socket.setTimeout(() => {
      if (opened) socket.close();
    }, 25000);
  });

  check(res, { 'status 101': (r) => r && r.status === 101 });
}
