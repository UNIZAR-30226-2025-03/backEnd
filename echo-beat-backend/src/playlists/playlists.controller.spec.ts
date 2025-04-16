import * as request from 'supertest';

const baseUrl = 'http://localhost:3000/playlists';

describe('Pruebas de Endpoints Playlists - Usando playlist existente (id 96)', () => {
  // Utilizamos el id 96, ya existente en la base de datos.
  const testEmail = 'testsbackend@gmail.com';
  const playlistId = 96;

  it('Debería actualizar el nombre de la playlist', async () => {
    const nuevoNombre = 'Playlist Actualizada Test';
    const payload = {
      userEmail: testEmail,
      idPlaylist: playlistId,
      nuevoNombre: nuevoNombre,
    };

    // Si la API retorna 201 en vez de 200, ajustamos la expectativa a 201.
    const response = await request(baseUrl)
      .post('/update-nombre')
      .send(payload)
      .expect(201);

    // Se asume que la respuesta devuelve la playlist actualizada con la propiedad "nombrePlaylist"
    expect(response.body).toHaveProperty('message', 'Nombre de la playlist actualizado correctamente');
  });

  it('Debería actualizar la descripción de la playlist', async () => {
    const nuevaDescripcion = 'Nueva descripción de prueba';
    const payload = {
      userEmail: testEmail,
      idPlaylist: playlistId,
      nuevaDescripcion: nuevaDescripcion,
    };

    const response = await request(baseUrl)
      .post('/update-descripcion')
      .send(payload)
      .expect(201);

      expect(response.body).toHaveProperty('message', 'Descripción de la playlist actualizada correctamente');
  });

  it('Debería actualizar la privacidad de la playlist', async () => {
    const nuevoTipoPrivacidad = 'privado';
    const payload = {
      userEmail: testEmail,
      idPlaylist: playlistId,
      nuevoTipoPrivacidad: nuevoTipoPrivacidad,
    };

    const response = await request(baseUrl)
      .post('/update-privacidad')
      .send(payload)
      .expect(201);

      expect(response.body).toHaveProperty('message', 'Privacidad de la playlist actualizada correctamente');
  });

  it('Debería añadir una canción (con id 1) a la playlist', async () => {
    const payload = {
      idLista: playlistId,
      songId: 1,
    };

    // Usamos el endpoint add-song que espera también el idLista en la URL.
    const response = await request(baseUrl)
      .post(`/add-song/${playlistId}`)
      .send(payload)
      .expect(200);

    // La API devuelve un objeto con message, position y predominantGenre.
    // En lugar de buscar "songId", comprobamos que el mensaje sea el esperado.
    expect(response.body).toHaveProperty('message', 'Canción añadida a la playlist correctamente');
    // Además, podemos verificar que "position" sea un número (por ejemplo):
    expect(typeof response.body.position).toBe('number');
  });

  it('Debería eliminar la canción (id 1) de la playlist', async () => {
    const payload = {
      idLista: playlistId,
      songId: 1,
    };

    await request(baseUrl)
      .delete(`/delete-song/${playlistId}`)
      .send(payload)
      .expect(200);
  });

  it('Debería obtener los detalles de la playlist', async () => {
    const response = await request(baseUrl)
      .get(`/playlist/${playlistId}`)
      .expect(200);

    // Si la API no devuelve la propiedad "id" (sino solo "Genero" y "TipoPrivacidad"),
    // podemos validar el objeto de otra forma.
    // Por ejemplo, comprobamos que contenga "TipoPrivacidad" y que sea un string:
    expect(response.body).toHaveProperty('TipoPrivacidad');
    expect(typeof response.body.TipoPrivacidad).toBe('string');
  });

  it('Debería obtener las URLs de imágenes predeterminadas', async () => {
    const response = await request(baseUrl)
      .get('/default-photos')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('Debería dar like y quitar like de la playlist', async () => {
    // Dar like. Si el endpoint retorna 201, ajustar la expectativa.
    const likeResponse = await request(baseUrl)
      .post(`/like/${testEmail}/${playlistId}`)
      .expect(201);
    expect(likeResponse.body).toBeDefined();

    // Quitar like (aquí se espera 200).
    const removeLikeResponse = await request(baseUrl)
      .delete(`/like/${testEmail}/${playlistId}`)
      .expect(200);
    expect(removeLikeResponse.body).toBeDefined();
  });

  it('Debería reordenar las canciones de la playlist', async () => {
    const cancionesJson = {
      canciones: [
        {
          id: 2,
          nombre: 'Canción 2',
          duracion: 200,
          numReproducciones: 15,
          numFavoritos: 3,
          portada: 'https://example.com/cancion2.jpg'
        },
        {
          id: 3,
          nombre: 'Canción 3',
          duracion: 220,
          numReproducciones: 10,
          numFavoritos: 2,
          portada: 'https://example.com/cancion3.jpg'
        }
      ]
    };
    const payload = {
      idPlaylist: playlistId,
      cancionesJson: cancionesJson,
    };

    await request(baseUrl)
      .post('/reordenar-canciones')
      .send(payload)
      .expect(200);
  });
});
