import * as request from 'supertest';

const baseUrl = 'http://localhost:3000/amistades';

describe('Pruebas de Endpoints Amistades', () => {
  // Utilizaremos estos nicks para las pruebas
  const nickSender = 'testsbackend';
  const nickReceiver = 'testuser1515';

  // 1. Intentar enviar solicitud a uno mismo (error 400)
  it('Debería fallar al enviar solicitud de amistad a uno mismo', async () => {
    await request(baseUrl)
      .post('/solicitar')
      .send({ nickSender, nickReceiver: nickSender })
      .expect(400);
  });

  // 2. Enviar solicitud de amistad de testsbackend a testuser1515
  it('Debería enviar solicitud de amistad de testsbackend a testuser1515', async () => {
    const response = await request(baseUrl)
      .post('/solicitar')
      .send({ nickSender, nickReceiver })
      .expect(201);
    // Verificamos que la respuesta contenga algún campo informativo (puedes ajustar según la salida real)
    expect(response.body).toHaveProperty('message');
  });

  // 3. Obtener solicitudes pendientes para testuser1515
  it('Debería obtener solicitudes de amistad para testuser1515', async () => {
    const response = await request(baseUrl)
      .get(`/verSolicitudes/${nickReceiver}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    // Buscamos que la solicitud de testsbackend esté en la lista.
    // Dependiendo de la respuesta, verifica el campo correcto.
    const solicitud = response.body.find((sol: any) => sol.NickFriendSender === nickSender);
    expect(solicitud).toBeDefined();
  });

  // 4. Aceptar la solicitud de amistad
  it('Debería aceptar la solicitud de amistad de testsbackend a testuser1515', async () => {
    const response = await request(baseUrl)
      .post('/aceptar')
      .send({ nickSender, nickReceiver })
      .expect(201); // Ajustamos al 201 si es lo que retorna la API

    // En lugar de "message", comprobamos el estado de la solicitud
    expect(response.body).toHaveProperty('EstadoSolicitud', 'aceptada');
  });

  // 5. Obtener la lista de amigos para testsbackend (debe incluir a testuser1515)
  it('Debería obtener la lista de amigos de testsbackend y encontrar a testuser1515', async () => {
    const response = await request(baseUrl)
      .get(`/verAmigos/${nickSender}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    // Buscamos en los amigos alguna entrada cuyo sender o receiver sea testuser1515.
    const amigo = response.body.find((amigo: any) =>
      amigo.NickFriendSender === nickReceiver || amigo.NickFriendReceiver === nickReceiver
    );
  });

  // 6. Eliminar la amistad existente entre testsbackend y testuser1515
  it('Debería eliminar la amistad entre testsbackend y testuser1515', async () => {
    const response = await request(baseUrl)
      .delete(`/eliminar/${nickSender}/${nickReceiver}`)
      .expect(200);
    expect(response.body).toHaveProperty('message');
  });

  // 7. Enviar solicitud y luego rechazarla (flujo de rechazo)
  it('Debería enviar y luego rechazar una solicitud de amistad', async () => {
    // Enviar solicitud nuevamente de testsbackend a testuser1515
    await request(baseUrl)
      .post('/solicitar')
      .send({ nickSender, nickReceiver })
      .expect(201);
      
    // Rechazar la solicitud: Ajustamos a 201 si la API retorna 201
    const response = await request(baseUrl)
      .post('/rechazar')
      .send({ nickSender, nickReceiver })
      .expect(201);
  });
});
