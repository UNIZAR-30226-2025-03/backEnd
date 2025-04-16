import * as request from 'supertest';

const baseUrl = 'http://127.0.0.1:3000/search';

describe('Pruebas de Endpoints Search', () => {
  const terminoBusqueda = 'Rock';
  const usuarioNick = 'user123';
  // Usamos como ejemplo el valor del enum para "Canciones". Si el enum es TipoBusqueda.Canciones, la representación de cadena se usará.
  const tipo = 'Canciones';

  // Caso 1: Búsqueda sin filtro de tipo (devuelve resultados para todos los tipos)
  it('Debería retornar resultados de búsqueda sin filtro de tipo', async () => {
    const response = await request(baseUrl)
      .get('/')
      .query({
        'Búsqueda': terminoBusqueda,
        usuarioNick,
      })
      .expect(200);

    // Se espera que la respuesta sea un objeto con las propiedades definidas en el ejemplo:
    // "artistas", "canciones", "albums" y "playlists".
    expect(response.body).toHaveProperty('artistas');
    expect(response.body).toHaveProperty('canciones');
    expect(response.body).toHaveProperty('albums');
    expect(response.body).toHaveProperty('playlists');
  });

  // Caso 2: Búsqueda con filtro de tipo (por ejemplo, "Canciones")
  it('Debería retornar resultados de búsqueda con filtro de tipo "Canciones"', async () => {
    const response = await request(baseUrl)
      .get('/')
      .query({
        'Búsqueda': terminoBusqueda,
        usuarioNick,
        tipo,
      })
      .expect(200);

    // Se espera que la respuesta tenga las mismas propiedades, aunque el contenido de cada arreglo dependerá del filtro.
    expect(response.body).toHaveProperty('artistas');
    expect(response.body).toHaveProperty('canciones');
    expect(response.body).toHaveProperty('albums');
    expect(response.body).toHaveProperty('playlists');
  });
});
