import os
import urllib.parse
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "echo-beat-backend", ".env"))
load_dotenv(env_path)

# Obtener la URL de conexión y codificar correctamente los caracteres especiales
database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("Error: No se encontró DATABASE_URL en el archivo .env")
    exit()

# Codificar correctamente la contraseña si es necesario
parsed_url = urllib.parse.urlparse(database_url)
password = urllib.parse.quote(parsed_url.password) if parsed_url.password else ""
database_url_fixed = database_url.replace(parsed_url.password, password) if password else database_url

# Conectar a la base de datos
def get_db_connection():
    conn = psycopg2.connect(database_url_fixed)
    conn.cursor().execute("SET search_path TO public;") 
    return conn


# Función para insertar metadatos en PostgreSQL
def insertar_metadata(nombre, artistas, album, duracion, licencia, url_blob, fecha_publicacion, generos):
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:

            # Verificar e insertar cada artista
            for artista in artistas:
                cursor.execute("SELECT \"Nombre\" FROM \"Artista\" WHERE \"Nombre\" = %s", (artista,))
                artista_existe = cursor.fetchone()
                if not artista_existe:
                    cursor.execute("INSERT INTO \"Artista\" (\"Nombre\", \"Biografia\", \"FotoPerfil\") VALUES (%s, %s, %s)", 
                                (artista, 'Biografía no disponible', 'URL_por_defecto'))


            # Verificar si el álbum ya existe
            cursor.execute("SELECT \"Nombre\" FROM \"Lista\" WHERE \"Nombre\" = %s AND \"Id\" IN (SELECT \"Id\" FROM \"Album\")", (album,))
            album_existe = cursor.fetchone()

            if not album_existe:
                cursor.execute("""
                    INSERT INTO \"Lista\" (\"Nombre\", \"NumCanciones\", \"Duracion\", \"NumLikes\", \"Descripcion\", \"Portada\", \"TipoLista\")
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING \"Id\"
                """, (album, 0, '0', 0, 'Álbum musical', 'URL_por_defecto', 'Album'))

                album_row = cursor.fetchone()

                if album_row is None:
                    raise Exception("ERROR: `RETURNING Id` devolvió None. La inserción puede haber fallado.")

                album_id = album_row[0]
                print(f"✅ Álbum insertado correctamente con ID: {album_id}")


                # Si el álbum no existe, crear el `Album` en la base de datos
                cursor.execute("""
                    INSERT INTO \"Album\" (\"Id\", \"FechaLanzamiento\") 
                    VALUES (%s, %s)
                """, (album_id, fecha_publicacion))
                num_canciones_album = 0  # Es la primera canción en este álbum
            else:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM \"PosicionCancion\" pc
                    JOIN \"Lista\" l ON pc.\"IdLista\" = l.\"Id\"
                    WHERE l.\"Nombre\" = %s
                """, (album,))  # 🔹 Aquí `album` es el nombre del álbum
                num_canciones_album = cursor.fetchone()[0]


            # Insertar la canción
            cursor.execute("""
                INSERT INTO \"Cancion\" (\"Nombre\", \"Duracion\", \"NumReproducciones\", \"NumFavoritos\", \"Portada\") 
                VALUES (%s, %s, 0, 0, %s) 
                RETURNING \"Id\"
            """, (nombre, duracion, 'URL'))
            cancion_id = cursor.fetchone()[0]


            # Obtener el ID del álbum en la tabla Lista basado en su nombre
            cursor.execute("""
                SELECT \"Id\" FROM \"Lista\" WHERE \"Nombre\" = %s AND \"Id\" IN (SELECT \"Id\" FROM \"Album\")
            """, (album,))
            album_row = cursor.fetchone()

            if album_row is None:
                raise Exception(f"ERROR: No se encontró un álbum con nombre '{album}' en la tabla Lista.")

            album_id = album_row[0]  #  ID real del álbum
            print(f"Id del album =: {album_id}")


            # Insertar la posición de la canción en el álbum
            posicion_cancion = num_canciones_album + 1
            cursor.execute("""
                INSERT INTO \"PosicionCancion\" (\"IdLista\", \"IdCancion\", \"Posicion\") 
                VALUES (%s, %s, %s)
            """, (album_id, cancion_id, posicion_cancion))  


            # Relacionar canción con cada artista
            for artista in artistas:
                cursor.execute("INSERT INTO \"AutorCancion\" (\"IdCancion\", \"NombreArtista\") VALUES (%s, %s)", 
                            (cancion_id, artista))
            

            # Insertar géneros y relacionarlos con la canción
            for genero in generos:
                # Verificar si el género ya existe
                cursor.execute("SELECT \"NombreGenero\" FROM \"Genero\" WHERE \"NombreGenero\" = %s", (genero,))
                genero_existe = cursor.fetchone()
                if not genero_existe:
                    cursor.execute("INSERT INTO \"Genero\" (\"NombreGenero\") VALUES (%s)", (genero,))

                # Insertar relación en GeneroCancion
                cursor.execute("INSERT INTO \"GeneroCancion\" (\"NombreGenero\", \"IdCancion\") VALUES (%s, %s)", 
                                (genero, cancion_id))

            conn.commit()
            print(f"✅ Metadata insertada en PostgreSQL: {nombre}")

    except Exception as e:
        print(f"Error al insertar en PostgreSQL: {str(e)}")

    finally:
        cursor.close()
        conn.close()

# Función para verificar todos los álbumes al final y asignar el autor si es posible, sera posible cuando un autor aparezca en todas las canciones de un album
def verificar_autores_de_todos_los_albumes():
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:

            # Obtener todos los álbumes en la base de datos
            cursor.execute("SELECT \"Id\" FROM \"Album\"")
            albumes = cursor.fetchall()

            for (album_id,) in albumes:
                # Verificar si ya tiene un autor
                cursor.execute("SELECT 1 FROM \"AutorAlbum\" WHERE \"IdAlbum\" = %s", (album_id,))
                if cursor.fetchone():
                    continue  # Si ya tiene un autor, pasamos al siguiente álbum

                # Contar el número total de canciones en el álbum
                cursor.execute("SELECT COUNT(*) FROM \"PosicionCancion\" WHERE \"IdLista\" = %s", (album_id,))
                total_canciones = cursor.fetchone()[0]

                # Obtener los artistas y cuántas canciones tienen en este álbum
                cursor.execute("""
                    SELECT ac.\"NombreArtista\", COUNT(ac.\"IdCancion\") 
                    FROM \"AutorCancion\" ac
                    JOIN \"PosicionCancion\" pc ON ac.\"IdCancion\" = pc.\"IdCancion\"
                    WHERE pc.\"IdLista\" = %s
                    GROUP BY ac.\"NombreArtista\"
                """, (album_id,))
                
                artistas_frecuencia = cursor.fetchall()

                # Buscar un artista que aparezca en todas las canciones
                for artista, num_canciones in artistas_frecuencia:
                    if num_canciones == total_canciones:
                        cursor.execute("INSERT INTO \"AutorAlbum\" (\"IdAlbum\", \"NombreArtista\") VALUES (%s, %s)", 
                                    (album_id, artista))
                        conn.commit()
                        print(f"✅ {artista} ha sido asignado como autor del álbum {album_id}")
                        break  # Solo necesitamos un artista, así que terminamos aquí

                print(f"⚠️ No hay un único artista en todas las canciones del álbum {album_id}, no se asigna autor.")

    except Exception as e:
        print(f"Error al verificar autores de álbumes: {str(e)}")

    finally:
        cursor.close()
        conn.close()


# Función para actualizar el número de canciones y la duración total de cada lista
def actualizar_listas():
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            # Obtener todas las listas
            cursor.execute("SELECT \"Id\", \"Nombre\" FROM \"Lista\"")
            listas = cursor.fetchall()

            for lista_id, lista_nombre in listas:
                # Contar el número de canciones en la lista, quitar el ::INTEGER cuando se haya hecho la nueva migracion
                cursor.execute("""
                    SELECT COUNT(*), SUM(c.\"Duracion\"::INTEGER)   
                    FROM \"PosicionCancion\" pc
                    JOIN \"Cancion\" c ON pc.\"IdCancion\" = c.\"Id\"
                    WHERE pc.\"IdLista\" = %s
                """, (lista_id,))
                
                num_canciones, duracion_total = cursor.fetchone()

                # Actualizar la tabla Lista con los nuevos valores
                cursor.execute("""
                    UPDATE \"Lista\"
                    SET \"NumCanciones\" = %s, \"Duracion\" = %s
                    WHERE \"Id\" = %s
                """, (num_canciones, duracion_total, lista_id))

                print(f"✅ Lista '{lista_nombre}' actualizada - NumCanciones: {num_canciones}, Duracion: {duracion_total}")

            conn.commit()

    except Exception as e:
        print(f"Error al actualizar listas: {str(e)}")

    finally:
        cursor.close()
        conn.close()

GENEROS_FIJOS = [
    "Rock", "Pop", "Jazz", "Blues", "Hip-Hop", 
    "Reggaeton", "Salsa", "Merengue", "Cumbia", "Electrónica",
    "Country", "Folk", "Metal", "Funk", "Clásica"
]

def insertar_generos_aleatorios():
    try:
        with get_db_connection() as conn, conn.cursor() as cursor:
            # Obtener todas las listas
            cursor.execute("SELECT \"Id\", \"Nombre\" FROM \"Lista\"")
            listas = cursor.fetchall()
            
            for genero in GENEROS_FIJOS:
                # Verificar si el género ya existe
                cursor.execute("SELECT \"NombreGenero\" FROM \"Genero\" WHERE \"NombreGenero\" = %s", (genero,))
                if not cursor.fetchone():
                    cursor.execute("INSERT INTO \"Genero\" (\"NombreGenero\") VALUES (%s)", (genero,))
            
            conn.commit()
            print(f"✅ Se insertaron 15 géneros en la tabla Genero.")
    
    except Exception as e:
        print(f"Error al insertar géneros: {str(e)}")
    finally:
        cursor.close()
        conn.close()    
