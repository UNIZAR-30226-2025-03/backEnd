import * as request from 'supertest';

// URL base de los endpoints de cancion (asegúrate de que la API esté corriendo localmente)
const baseUrl = 'http://localhost:3000/cancion';

describe('Pruebas de Endpoints Canción', () => {
  const email = 'testsbackend@gmail.com';
  const songId1 = 1;
  const songId2 = 2;

  it('Debería añadir la canción con id 1 a favoritos', async () => {
    await request(baseUrl)
      .post(`/like/${email}/${songId1}`)
      expect([201, 500]);
  });

  it('Debería añadir la canción con id 2 a favoritos', async () => {
    await request(baseUrl)
      .post(`/like/${email}/${songId2}`)
      expect([201, 500]);
  });

  it('Debería eliminar la canción con id 1 de favoritos', async () => {
    await request(baseUrl)
      .delete(`/unlike/${email}/${songId1}`)
      .expect(200); // Código 200: Canción eliminada correctamente
  });

  it('Debería devolver la lista de favoritos con la canción con id 2 y sin la 1', async () => {
    const response = await request(baseUrl)
      .get('/favorites')
      .query({ email });
    
    expect(response.status).toBe(200);
  
    // Extraer el arreglo de canciones de la propiedad "canciones"
    const favorites = response.body.canciones;
  
    expect(Array.isArray(favorites)).toBe(true);
  
    // Verificar que la canción con id 1 no esté presente y la de id 2 sí
    const containsSong1 = favorites.some((song: any) => song.id === 1);
    const containsSong2 = favorites.some((song: any) => song.id === 2);
  
    expect(containsSong1).toBe(false);
    expect(containsSong2).toBe(true);
  });
  
});
