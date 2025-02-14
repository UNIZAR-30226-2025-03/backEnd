from azure.storage.blob import BlobServiceClient
import requests
import os
from dotenv import load_dotenv

# 🔹 Obtener la ruta correcta del archivo .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "echo-beat-backend", ".env"))

# 🔹 Imprimir la ruta para confirmar que es la correcta
print(f"📂 Buscando .env en: {env_path}")

# 🔹 Cargar el archivo .env desde la ubicación correcta
load_dotenv(env_path)

# 🔹 Configuración de Azure Blob Storage
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONNECTION_STRING")
CONTAINER_NAME = "cancionespsoft"

# 🔹 Función para subir canción a Azure
def subir_a_azure(nombre_archivo, url_audio):
    # Descargar la canción desde la URL
    response = requests.get(url_audio)
    if response.status_code == 200:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
        blob_client = blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=nombre_archivo)

        # Subir archivo al blob
        blob_client.upload_blob(response.content, overwrite=True)
        print(f"✅ Canción subida a Azure: {nombre_archivo}")

        # Devolver la URL pública del archivo
        return f"https://{blob_service_client.account_name}.blob.core.windows.net/{CONTAINER_NAME}/{nombre_archivo}"
    else:
        print(f"❌ Error al descargar {nombre_archivo}")
        return None


#Reproducir la cancion desde azure
#<audio controls>
#  <source src="https://misongsstorage.blob.core.windows.net/canciones/cancion_prueba.mp3" type="audio/mpeg">
#  Tu navegador no soporta el elemento de audio.
#</audio>