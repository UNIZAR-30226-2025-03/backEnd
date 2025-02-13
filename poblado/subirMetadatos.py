import psycopg2
import os
from dotenv import load_dotenv

# 🔹 Obtener la ruta correcta del archivo .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "echo-beat-backend", ".env"))

# 🔹 Imprimir la ruta para depuración
print(f"📂 Buscando .env en: {env_path}")

# 🔹 Cargar variables desde .env
load_dotenv(env_path)

# 🔹 Obtener la URL de conexión desde el .env
DATABASE_URL = os.getenv("DATABASE_URL")

# 🔹 Verificar que DATABASE_URL se cargó correctamente
if not DATABASE_URL:
    print("❌ Error: No se encontró DATABASE_URL en el archivo .env")
    exit()

# 🔹 Función para insertar metadata en PostgreSQL
def insertar_metadata(nombre, artista, album, duracion, licencia, url_blob, fecha_publicacion):
    try:
        # Conectar a la base de datos usando la URL de conexión
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Query para insertar datos en la tabla "canciones"
        query = """INSERT INTO canciones (nombre, artista, album, duracion, licencia, url_blob, fecha_publicacion)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        cursor.execute(query, (nombre, artista, album, duracion, licencia, url_blob, fecha_publicacion))

        conn.commit()
        print(f"✅ Metadata insertada en PostgreSQL: {nombre}")

    except Exception as e:
        print(f"❌ Error al insertar en PostgreSQL: {str(e)}")

    finally:
        cursor.close()
        conn.close()
