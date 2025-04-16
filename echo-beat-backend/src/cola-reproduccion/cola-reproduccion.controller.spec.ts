import * as request from 'supertest';

const baseUrl = 'http://localhost:3000/cola-reproduccion';

describe('Pruebas de Endpoints Cola de Reproducción (módulo único)', () => {
  const userEmail = 'testsbackend@gmail.com';

  // JSON de ejemplo para la cola de reproducción (simula la playlist con id 96).
  const sampleQueue = {
    canciones: [
      {
        id: 1,
        nombre: "J'm'e FPM",
        duracion: 183,
        numReproducciones: 0,
        numFavoritos: 0,
        portada: "https://cdn/portada.jpg",
      },
      {
        id: 2,
        nombre: "Trio HxC",
        duracion: 200,
        numReproducciones: 0,
        numFavoritos: 0,
        portada: "https://cdn/portada2.jpg",
      },
    ],
  };

  let firstSongId: number;
  let currentQueue: any;

  // 1. Inicializar la cola de reproducción sin posición personalizada
  it('Debería iniciar la cola de reproducción (play-list)', async () => {
    const payload = {
      userEmail,
      reproduccionAleatoria: true,
      colaReproduccion: sampleQueue,
    };

    const response = await request(baseUrl)
      .post('/play-list')
      .send(payload)
      .expect(200);

      expect(response.body).toHaveProperty('message', 'Cola de reproducción actualizada correctamente');   
    firstSongId = response.body.firstSongId;
  });

  // 2. Inicializar la cola de reproducción con posición personalizada
  it('Debería iniciar la cola con posición personalizada (play-list-by-position)', async () => {
    const payload = {
      userEmail,
      reproduccionAleatoria: false,
      posicionCola: 1,
      colaReproduccion: sampleQueue,
    };

    const response = await request(baseUrl)
      .post('/play-list-by-position')
      .send(payload)
      .expect(200);

    // Se espera que la respuesta incluya el id de la canción en la posición indicada.
    expect(response.body).toHaveProperty('message', 'Cola de reproducción actualizada correctamente');
  });

  // 3. Obtener la cola de reproducción y la posición actual
  it('Debería obtener la cola de reproducción y la posición actual del usuario', async () => {
    const response = await request(baseUrl)
      .get('/get-user-queue')
      .query({ userEmail })
      .expect(200);

    // Se espera que la respuesta contenga "colaReproduccion" y "posicionCola"
    expect(response.body).toHaveProperty('ColaReproduccion');
    expect(response.body).toHaveProperty('PosicionCola');
    currentQueue = response.body.colaReproduccion;
  });

  // 4. Obtener la siguiente canción de la cola
  it('Debería obtener la siguiente canción de la cola', async () => {
    const response = await request(baseUrl)
      .get('/siguiente-cancion')
      .query({ userEmail })
      .expect(200);

    // Se espera que la respuesta contenga "nextSongId" de tipo number
    expect(response.body).toHaveProperty('siguienteCancionId', 1);
  });

  // 5. Obtener la canción anterior de la cola
  it('Debería obtener la canción anterior de la cola', async () => {
    const response = await request(baseUrl)
      .get('/anterior')
      .query({ userEmail })
      .expect(200);

    // Se espera que la respuesta contenga "previousSongId" de tipo number
    expect(response.body).toHaveProperty('cancionAnteriorId', 1);
  });

  // 6. Añadir una nueva canción a la cola de reproducción
  it('Debería añadir una nueva canción a la cola de reproducción', async () => {
    // Agregamos la canción con id 3
    const payload = {
      userEmail,
      songId: 3,
    };

    const response = await request(baseUrl)
      .post('/add-song-to-queue')
      .send(payload)
      .expect(201);

    // Se espera que la respuesta contenga un mensaje y la propiedad "nuevaCola"
    expect(response.body).toHaveProperty('message', 'Canción añadida correctamente');
    expect(response.body).toHaveProperty('nuevaCola');
    currentQueue = response.body.nuevaCola;
  });

  // 7. Eliminar una canción de la cola en una posición específica
  it('Debería eliminar una canción de la cola de reproducción', async () => {
    // Eliminamos la canción en la posición 0
    const payload = {
      userEmail,
      posicionCola: 0,
    };

    const response = await request(baseUrl)
      .post('/delete-song-from-queue')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('message', 'Canción eliminada correctamente');
    expect(response.body).toHaveProperty('nuevaCola');
    currentQueue = response.body.nuevaCola;
  });

  // 8. Vaciar completamente la cola de reproducción
  it('Debería vaciar la cola de reproducción', async () => {
    const payload = { userEmail };

    const response = await request(baseUrl)
      .post('/clear')
      .send(payload)
      .expect(200);

    // Se espera un mensaje de confirmación
    expect(response.body).toHaveProperty('message');
  });
});
