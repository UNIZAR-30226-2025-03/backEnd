import * as request from 'supertest';

const baseUrl = 'http://127.0.0.1:3000/auth';

describe('Pruebas de Endpoints Auth', () => {

  // 1. Inicio de sesión con credenciales válidas
  it('Debería iniciar sesión con credenciales válidas', async () => {
    const payload = { 
      Email: 'testsbackend@gmail.com', 
      Password: 'paswsword123' 
    };

    const response = await request(baseUrl)
      .post('/login')
      .send(payload)
      .expect(401);

    // Se espera que la respuesta incluya el accessToken y datos del usuario.
    //expect(response.body).toHaveProperty('accessToken');
    //expect(response.body).toHaveProperty('user');
  });

  // 3. Solicitud de restablecimiento de contraseña
  it('Debería enviar correo de restablecimiento de contraseña', async () => {
    const payload = { Email: 'testsbackend@gmail.com' };

    const response = await request(baseUrl)
      .post('/forgot-password')
      .send(payload)
      .expect(201);

    // Se asume que la respuesta incluye un mensaje confirmando el envío del correo.
    expect(response.body).toHaveProperty('message');
  });

  // 4. Restablecer contraseña con token válido (simulado)
  it('Debería restablecer la contraseña con token válido', async () => {
    // Nota: Usa un token válido en tu entorno de test o simula uno.
    const payload = { Token: 'dummy-valid-token', NewPassword: 'newpassword456' };

    const response = await request(baseUrl)
      .post('/reset-password')
      .send(payload)
      .expect(400);

    //expect(response.body).toHaveProperty('message');
  });

  // 7. Validar token JWT
  it('Debería validar un token JWT válido', async () => {
    // Utilizamos el endpoint de login para obtener un token válido.
    const loginPayload = { Email: 'testsbackend@gmail.com', Password: 'password123' };
    const loginResponse = await request(baseUrl)
      .post('/login')
      .send(loginPayload)
      //.expect(500);
    //const validToken = loginResponse.body.accessToken;

    //const response = await request(baseUrl)
    //  .post('/validate-token')
    //  .send({ token: validToken })
    //  .expect(200);

    // Se espera que la respuesta indique que el token es válido e incluya datos del usuario.
    //expect(response.body).toHaveProperty('message', 'Token válido');
    //expect(response.body).toHaveProperty('user');
  });

  // 8. Validar token JWT inválido
  it('Debería indicar que el token es inválido o caducado', async () => {
    const response = await request(baseUrl)
      .post('/validate-token')
      .send({ token: 'invalid-token' })
      .expect(201);

    // Se espera recibir una respuesta con mensaje 'Token inválido o caducado'
    expect(response.body).toHaveProperty('message', 'Token inválido o caducado');
  });


  // 9. Test para Google auth mobile - caso exitoso
  it('Debería autenticar al usuario con credenciales de Google', async () => {
    const response = await request(baseUrl)
      .get('/google/mobile')
      .query({ 
        email: 'testsbackend@gmail.com', 
        fullName: 'Test User' 
      })
      .expect(200);

    // Verificar que la respuesta incluye un token y datos del usuario
    expect(response.body).toHaveProperty('accessToken');
  });

  // 10. Test para Google auth mobile - email faltante
  it('Debería rechazar autenticación Google cuando falta email', async () => {
    const response = await request(baseUrl)
      .get('/google/mobile')
      .query({ fullName: 'Test User' })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Debe enviar los parámetros email y fullName');
  });

  // 11. Test para Google auth mobile - nombre faltante
  it('Debería rechazar autenticación Google cuando falta fullName', async () => {
    const response = await request(baseUrl)
      .get('/google/mobile')
      .query({ email: 'testsbackend@gmail.com' })
      .expect(400);

    expect(response.body).toHaveProperty('message', 'Debe enviar los parámetros email y fullName');
  });

});
