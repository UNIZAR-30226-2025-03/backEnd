import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50000,           // Usuarios virtuales concurrentes
  duration: '60s',   // Duración total del test
};

const email = 'aaaaaa%40gmail.com';  // Email válido de prueba

export default function () {
  //const url = 'https://echobeatapi.duckdns.org/users/first-song?Email=aaaaaa%40gmail.com';
  const url = 'https://echobeatapi.duckdns.org/playlists/default-photos';
  //const url = https://nogler.ddns.net/allusers;
  const res = http.get(url);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => r.body.length > 0,
  });
  console.log(`Status: ${res.status} - Body: ${res.body}`);


  sleep(0,5);  // Pausa de 1 segundo entre peticiones por usuario virtual
}