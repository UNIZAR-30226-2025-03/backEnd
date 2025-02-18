import requests
from subirCancionesAlContainer import subir_a_azure
from subirMetadatos import insertar_metadata, verificar_autores_de_todos_los_albumes, actualizar_listas

# Tu Client ID de Jamendo
CLIENT_ID = "4ca1da2f"

# URL de la API para obtener 1 canciones libres de copyright
URL = f"https://api.jamendo.com/v3.0/tracks/?client_id={CLIENT_ID}&format=json&limit=10&license=ccplus"

# Hacer la petición a la API de Jamendo
response = requests.get(URL)

if response.status_code == 200:
    data = response.json()

    if "results" in data:
        for idx, track in enumerate(data["results"]):
            nombre = track["name"]
            artista = track["artist_name"].split(",")  # Puede haber varios artistas
            album = track["album_name"]
            duracion = track["duration"]  # en segundos
            audio_url = track["audio"]
            licencia = track["license_ccurl"]  # Enlace a la licencia
            fecha_publicacion = track["releasedate"]  # Fecha de publicación
            generos = [genre["name"] for genre in track.get("musicinfo", {}).get("tags", [])]  # Obtener géneros
            nombre_archivo = f"{nombre.replace(' ', '_')}.mp3"

            print(f"{idx+1}. 🎵 {nombre}")
            print(f"   🎤 Artista: {artista}")
            print(f"   📀 Álbum: {album}")
            print(f"   ⏱️ Duración: {duracion} segundos")
            print(f"   🔗 Descargar: {audio_url}")
            print(f"   📜 Licencia: {licencia}")
            print(f"   📅 Publicado en: {fecha_publicacion}")
            print(f"   🎶 Géneros: {', '.join(generos)}")
            print("-" * 50)  # Separador entre canciones

            #🔹 Subir canción a Azure Blob Storage
            url_blob = subir_a_azure(nombre_archivo, audio_url)
            if url_blob:
            #🔹 Guardar metadata en Azure SQL Database
                insertar_metadata(nombre, artista, album, duracion, licencia, url_blob, fecha_publicacion, generos)

        #🔹 Una vez que todas las canciones han sido insertadas, verificar autores de los álbumes
        print("🔍 Verificando autores de todos los álbumes...")
        verificar_autores_de_todos_los_albumes()
        print("✅ Verificación de autores completada.")
        print("🔄 Actualizando listas...")
        actualizar_listas()
        print("✅ Duracion y numCanciones de las listas actualizadas.")
    else:
        print("No se encontraron canciones.")
else:
    print("Error al conectar con la API de Jamendo")


