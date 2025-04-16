import * as request from 'supertest';

const baseUrl = 'http://127.0.0.1:3000/artistas';

describe('Pruebas de Endpoints Artistas', () => {
  it('Debería obtener el perfil del artista TriFace', async () => {
    const response = await request(baseUrl)
      .get('/perfil')
      .query({ artistName: 'TriFace' })
      .expect(200);

    // Verifica que la respuesta sea un objeto.
    expect(response.body).toBeDefined();
    expect(typeof response.body).toBe('object');

    // Validamos que la respuesta contenga las propiedades que devuelve la API.
    expect(response.body).toHaveProperty('artista');
    expect(response.body).toHaveProperty('discografia');
    expect(response.body).toHaveProperty('topCanciones');

    // Validamos que "discografia" y "topCanciones" sean arrays.
    expect(Array.isArray(response.body.discografia)).toBe(true);
    expect(Array.isArray(response.body.topCanciones)).toBe(true);

    // Como la propiedad "artistName" no existe, podemos verificar que la biografía contenga "TriFace".
    const biografia = response.body.artista.Biografia;
    expect(typeof biografia).toBe('string');
    expect(biografia).toContain('TriFace');
  });
});
