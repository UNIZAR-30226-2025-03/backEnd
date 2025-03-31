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
CONTAINER_NAME = "default-canciones-fotos"

database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("Error: No se encontró DATABASE_URL en el archivo .env")
    exit()

RUTA_IMAGENES = "C:\\Users\\jorda\\Downloads\\canciones"

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

def insertar_fotos_en_canciones():
    imagenes = sorted(os.listdir(RUTA_IMAGENES))[:100]  # Limitar a 100 imágenes
    with get_db_connection() as conn, conn.cursor() as cursor:
        cursor.execute("SELECT \"Id\", \"Nombre\" FROM \"Cancion\ ORDER BY \"Id\" DESC LIMIT 100")
        canciones = cursor.fetchall()

        if len(canciones) != len(imagenes):
            print(f"❌ El número de canciones ({len(canciones)}) no coincide con el número de imágenes ({len(imagenes)})")
            return
        
        for (id_cancion, nombre_cancion), imagen in zip(canciones, imagenes):
            ruta_archivo = os.path.join(RUTA_IMAGENES, imagen)
            url_portada = subir_imagen_a_blob(imagen, ruta_archivo)

            cursor.execute("""
                UPDATE \"Cancion\"
                SET \"Portada\" = %s
                WHERE \"Id\" = %s
            """, (url_portada, id_cancion))
            print(f"✅ Portada actualizada para la canción: {nombre_cancion}")

        conn.commit()
        print("✅ Todas las portadas han sido actualizadas en la base de datos.")

if __name__ == "__main__":
    insertar_fotos_en_canciones()
    print("✅ Proceso de inserción de fotos en canciones completado.")