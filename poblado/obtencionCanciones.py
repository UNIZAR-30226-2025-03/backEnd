import requests
from subirCancionesAlContainer import subir_a_azure
from subirMetadatos import insertar_metadata

# Tu Client ID de Jamendo
CLIENT_ID = "4ca1da2f"

# URL de la API para obtener 1 canciones libres de copyright
URL = f"https://api.jamendo.com/v3.0/tracks/?client_id={CLIENT_ID}&format=json&limit=1&license=ccplus"

# Hacer la petición a la API de Jamendo
response = requests.get(URL)

if response.status_code == 200:
    data = response.json()

    if "results" in data:
        for idx, track in enumerate(data["results"]):
            nombre = track["name"]
            artista = track["artist_name"]
            album = track["album_name"]
            duracion = track["duration"]  # en segundos
            audio_url = track["audio"]
            licencia = track["license_ccurl"]  # Enlace a la licencia
            fecha_publicacion = track["releasedate"]  # Fecha de publicación
            nombre_archivo = f"{nombre.replace(' ', '_')}.mp3"

            print(f"{idx+1}. 🎵 {nombre}")
            print(f"   🎤 Artista: {artista}")
            print(f"   📀 Álbum: {album}")
            print(f"   ⏱️ Duración: {duracion} segundos")
            print(f"   🔗 Descargar: {audio_url}")
            print(f"   📜 Licencia: {licencia}")
            print(f"   📅 Publicado en: {fecha_publicacion}")
            print("-" * 50)  # Separador entre canciones

            #🔹 Subir canción a Azure Blob Storage
            url_blob = subir_a_azure(nombre_archivo, audio_url)
            #if url_blob:
            #🔹 Guardar metadata en Azure SQL Database
                #insertar_metadata(nombre, artista, album, duracion, licencia, url_blob, fecha_publicacion)
    else:
        print("No se encontraron canciones.")
else:
    print("Error al conectar con la API de Jamendo")


