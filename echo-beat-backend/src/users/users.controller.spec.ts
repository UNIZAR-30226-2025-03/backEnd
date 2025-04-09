import axios from 'axios';
import fs from 'fs';
import * as NodeFormData from 'form-data';

describe('UsersController E2E Tests', () => {
  const BASE_URL = 'http://localhost:3000/users';
  const uniqueSuffix = Date.now();
  const testEmail = `testUser${uniqueSuffix}@example.com`;



  // Test: Obtener la primera canción de la cola (se espera 404 si está vacía)
  it('Get first song from queue (expect 404 if empty)', async () => {
    try {
      await axios.get(`${BASE_URL}/first-song`, {
        params: { Email: testEmail },
      });
      // Si no lanza error, falla la prueba.
      throw new Error(
        'Se esperaba un error 404 por cola vacía, pero la petición fue exitosa'
      );
    } catch (err: any) {
      expect(err.response.status).toBe(404);
    }
  });

  // Test: Obtener la última lista/álbum reproducida
  it('Get last played lists', async () => {
    const response = await axios.get(`${BASE_URL}/last-played-lists`, {
      params: { userEmail: testEmail },
    });
    expect(response.status).toBe(200);
    // Puedes agregar validaciones adicionales según lo esperado.
  });

  // Test: Obtener el nick del usuario
  it('Get user nick', async () => {
    const response = await axios.get(`${BASE_URL}/nick`, {
      params: { userEmail: testEmail },
    });
    expect(response.status).toBe(200);
    expect(response.data).toBe('NickPrueba');
  });

  // Test: Obtener las credenciales del usuario
  it('Get user credentials', async () => {
    const response = await axios.get(`${BASE_URL}/get-user`, {
      params: { userEmail: testEmail },
    });
    expect(response.status).toBe(200);
    expect(response.data.Email).toBe(testEmail);
  });

  // Test: Cambiar el Nick del usuario
  it('Change user nick', async () => {
    const newNick = 'NickCambiado';
    const response = await axios.post(`${BASE_URL}/change-nick`, null, {
      params: { userEmail: testEmail, Nick: newNick },
    });
    expect(response.status).toBe(200);

    const getResponse = await axios.get(`${BASE_URL}/nick`, {
      params: { userEmail: testEmail },
    });
    expect(getResponse.data).toBe(newNick);
  });

  // Test: Actualizar la privacidad del usuario
  it('Update user privacy', async () => {
    const payload = { Email: testEmail, Privacy: 'PUBLICO' };
    const response = await axios.post(`${BASE_URL}/update-privacy`, payload);
    expect(response.status).toBe(200);
  });

  // Test: Actualizar la fecha de nacimiento
  it('Update user birthdate', async () => {
    const payload = { userEmail: testEmail, birthdate: '1995-03-10' };
    const response = await axios.post(`${BASE_URL}/update-birthdate`, payload);
    expect(response.status).toBe(200);
  });

  // Test: Actualizar el nombre completo del usuario
  it('Update user full name', async () => {
    const payload = { userEmail: testEmail, nombreReal: 'Nuevo Nombre Completo' };
    const response = await axios.post(`${BASE_URL}/update-fullname`, payload);
    expect(response.status).toBe(200);
  });

  // Test: Obtener todas las fotos predeterminadas
  it('Get all default user photos', async () => {
    const response = await axios.get(`${BASE_URL}/default-photos`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
  });

  // Test: Actualizar la foto del usuario con un archivo local
  it('Update user photo with a local file', async () => {
    const filePath = 'test-image.jpg';
    if (!fs.existsSync(filePath)) {
      // Falla la prueba si el archivo no existe
      throw new Error(`No se encontró el archivo local "${filePath}" para la prueba.`);
    }
    const formData = new NodeFormData();
    formData.append('Email', testEmail);
    formData.append('file', fs.createReadStream(filePath));

    const response = await axios.post(`${BASE_URL}/update-photo`, formData, {
      headers: formData.getHeaders(),
    });
    expect(response.status).toBe(200);
  });

  // Test: Actualizar la foto de perfil del usuario con imagen predeterminada
  it('Update user default photo (predefined image from container)', async () => {
    const payload = {
      userEmail: testEmail,
      imageUrl: 'https://<blob-storage-url>/path-to-image.jpg',
    };
    const response = await axios.post(`${BASE_URL}/update-photo-default`, payload);
    expect(response.status).toBe(200);
  });
});
