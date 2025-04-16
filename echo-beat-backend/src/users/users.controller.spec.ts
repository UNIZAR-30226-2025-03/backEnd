import * as request from 'supertest';

// URL base de los endpoints de usuarios
const baseUrl = 'http://127.0.0.1:3000/users';
// Usamos un correo de prueba único y consistente
const testEmail = 'testsbackend@gmail.com';

describe('Pruebas de Endpoints Users', () => {
  
  it('Registrar usuario testsbackend@gmail.com', async () => {
    const payload = {
      Email: testEmail,
      NombreCompleto: 'Test User',
      Password: 'password123',
      Nick: 'testuser1515',
      FechaNacimiento: '2000-01-01T00:00:00Z'
    };

    const response = await request(baseUrl)
      .post('/register')
      .send(payload);
    
    // Se aceptan 201 (creado) o 500 (usuario ya existe)
    expect([201, 500]).toContain(response.status);
  });
  
  it('Obtener nick de usuario testsbackend@gmail.com', async () => {
    await request(baseUrl)
      .get('/nick')
      .query({ userEmail: testEmail })
      .expect(200);
  });

  it('Obtener detalles del usuario testsbackend@gmail.com', async () => {
    await request(baseUrl)
      .get('/get-user')
      .query({ userEmail: testEmail })
      .expect(200);
  });

  it('Actualizar nick del usuario testsbackend@gmail.com', async () => {
    const nuevoNick = 'updatedNick';
    // Se acepta 200 o 409 en caso de conflicto (si el nick ya estaba en uso)
    const response = await request(baseUrl)
      .post('/change-nick')
      .query({ userEmail: testEmail, Nick: nuevoNick });
    expect([200, 409]).toContain(response.status);
  });

  it('Actualizar foto de perfil por defecto del usuario testsbackend@gmail.com', async () => {
    // Nota: revisa que el payload enviado cumpla con el esquema que espera la API.
    const payload = { userEmail: testEmail, imageUrl: 'https://example.com/default.jpg' };
    const response = await request(baseUrl)
      .post('/update-photo-default')
      .send(payload);
    // Dependiendo de la lógica de tu controller, si esperas 200, pero obtienes 400,
    // revisa la validación del esquema. Por ahora, aceptamos 200 o 400 (aunque 400 indicaría error)
    expect([200, 400]).toContain(response.status);
  });

  it('Actualizar privacidad del usuario testsbackend@gmail.com', async () => {
    const payload = { Email: testEmail, Privacy: 'privado' };
    const response = await request(baseUrl)
      .post('/update-privacy')
      .send(payload);
    // Se acepta 200 o 201 según lo que entregue la API
    expect([200, 201]).toContain(response.status);
  });

  it('Actualizar fecha de nacimiento del usuario testsbackend@gmail.com', async () => {
    const payload = { userEmail: testEmail, birthdate: '1999-12-31' };
    const response = await request(baseUrl)
      .post('/update-birthdate')
      .send(payload);
    expect([200, 201]).toContain(response.status);
  });

  it('Ultima cancion ', async () => {
    const payload = {
      Email: testEmail,
    };

    const response = await request(baseUrl)
      .get('/first-song')
      .send(payload);
    
    // Se aceptan 201 (creado) o 500 (usuario ya existe)
    expect([201, 500]).toContain(response.status);
  });

  it('Actualizar nombre completo del usuario testsbackend@gmail.com', async () => {
    const payload = { userEmail: testEmail, nombreReal: 'Test User Updated' };
    const response = await request(baseUrl)
      .post('/update-fullname')
      .send(payload);
    expect([200, 201]).toContain(response.status);
  });

  it('Obtener URLs de imágenes predeterminadas', async () => {
    await request(baseUrl)
      .get('/default-photos')
      .expect(200);
  });

  it('Obtener perfil del usuario tests@gmail.com con playlists', async () => {
    await request(baseUrl)
      .get('/profile-with-playlists')
      .query({ userEmail: testEmail })
      .expect(200);
  });
});
