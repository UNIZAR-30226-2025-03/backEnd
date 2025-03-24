import os
import urllib.parse
import psycopg2
from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

# Obtener la ruta correcta del archivo .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "echo-beat-backend", ".env"))

# Cargar el archivo .env desde la ubicación correcta
load_dotenv(env_path)

# Configuración de Azure Blob Storage
AZURE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
CONTAINER_NAME = "default-genero-fotos"

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

# 🔹 Función para subir foto genero a blob
def subir_imagen_a_blob(nombre_archivo, ruta_archivo):
    blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
    blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=nombre_archivo)

    # Subir archivo al blob
    with open(ruta_archivo, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
        print(f"✅ Imagen subida a Azure: {nombre_archivo}")

        # Devolver la URL pública del archivo
        return f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{nombre_archivo}"

def crear_listas_predefinidas():
    ruta_imagenes = "C:\\Users\\jorda\\Downloads\\genero"
    with get_db_connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT \"NombreGenero\" FROM \"Genero\"")
        generos = cursor.fetchall()

        for (genero,) in generos:
            nombre_archivo = f"{genero}.jpg"
            ruta_archivo = os.path.join(ruta_imagenes, nombre_archivo)

            if not os.path.exists(ruta_archivo):
                print(f"❌ No se encontró la imagen para {genero}")
                continue
            
            # Subir imagen a Azure Blob Storage y obtener la URL
            url_portada = subir_imagen_a_blob(nombre_archivo, ruta_archivo)

            # 🔹 ACTUALIZAR campo FotoGenero en la tabla Genero
            cursor.execute("""
                UPDATE \"Genero\"
                SET \"FotoGenero\" = %s
                WHERE \"NombreGenero\" = %s
            """, (url_portada, genero))

            # Insertar lista predefinida en tabla Lista
            cursor.execute("""
                INSERT INTO \"Lista\" (\"Nombre\", \"NumCanciones\", \"Duracion\", \"NumLikes\", \"Descripcion\", \"Portada\", \"TipoLista\")
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING \"Id\"
            """, (genero, 0, 0, 0, f"Lista predefinida de {genero}", url_portada, 'ListaReproduccion'))

            id_lista, = cursor.fetchone()

            # Insertar en ListaReproduccion
            cursor.execute("""
                INSERT INTO \"ListaReproduccion\" (\"Id\", \"Nombre\", \"EmailAutor\", \"Genero\")
                VALUES (%s, %s, %s, %s)
            """, (id_lista, genero, 'admin', genero))

            # Obtener canciones del mismo genero
            cursor.execute("""
                SELECT \"Id\" FROM \"Cancion\" WHERE \"Genero\" = %s
            """, (genero,))
            canciones = cursor.fetchall()

            # Insertar canciones en la Lista
            for posicion, (id_cancion,) in enumerate(canciones):
                cursor.execute("""
                    INSERT INTO \"PosicionCancion\" (\"IdLista\", \"IdCancion\", \"Posicion\")
                    VALUES (%s, %s, %s)
                """, (id_lista, id_cancion, posicion))

            print(f"✅ Lista predefinida de {genero} con {len(canciones)} canciones creada con éxito\n")
        
        conn.commit()



