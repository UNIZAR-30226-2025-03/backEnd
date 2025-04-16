import * as request from 'supertest';

const baseUrl = 'http://localhost:3000/genero';

describe('Pruebas de Endpoints Genero', () => {
  const userEmail = 'testsbackend@gmail.com';

  // 1. Obtener los géneros preferidos y sus fotos
  it('Debería obtener los géneros y sus fotos de las preferencias del usuario', async () => {
    const response = await request(baseUrl)
      .get('/preferencia')
      .query({ userEmail })
      .expect(200);

    // Se espera que la respuesta sea un arreglo de objetos
    expect(Array.isArray(response.body)).toBe(true);

    // Se verifica que cada objeto tenga las propiedades "NombreGenero" y "FotoGenero"
    response.body.forEach((item: any) => {
      expect(item).toHaveProperty('NombreGenero');
      expect(item).toHaveProperty('FotoGenero');
    });
  });

  // 2. Obtener todos los géneros existentes con la selección del usuario
  it('Debería obtener todos los géneros y señalar cuáles están seleccionados por el usuario', async () => {
    const response = await request(baseUrl)
      .get('/')
      .query({ userEmail })
      .expect(200);

    // Se espera que la respuesta sea un arreglo
    expect(Array.isArray(response.body)).toBe(true);

    // Se asume que cada objeto incluye una propiedad "seleccionado" (booleano)
    response.body.forEach((genre: any) => {
      expect(genre).toHaveProperty('seleccionado');
      // Puedes agregar validaciones adicionales según la estructura real (por ejemplo, un nombre o un id)
    });
  });

  // 3. Actualizar las preferencias de género del usuario
  it('Debería actualizar las preferencias de género del usuario', async () => {
    const payload = {
      userEmail,
      generos: ["Rock", "Pop", "Jazz"],
    };

    const response = await request(baseUrl)
      .post('/add')
      .send(payload)
      .expect(201);

    // Se espera que la respuesta incluya un mensaje de éxito.
    expect(response.body).toHaveProperty('message');
  });
});
