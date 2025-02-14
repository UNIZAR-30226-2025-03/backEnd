import os
from dotenv import load_dotenv

# 🔹 Obtener la ruta correcta del archivo .env
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "echo-beat-backend", ".env"))

# 🔹 Imprimir la ruta para confirmar que es la correcta
print(f"📂 Buscando .env en: {env_path}")

# 🔹 Cargar el archivo .env desde la ubicación correcta
load_dotenv(env_path)

# 🔹 Obtener la URL de conexión desde el .env
DATABASE_URL = os.getenv("DATABASE_URL")

# 🔹 Verificar si DATABASE_URL se cargó correctamente
if DATABASE_URL:
    print(f"✅ DATABASE_URL encontrado: {DATABASE_URL}")
else:
    print("❌ Error: No se encontró DATABASE_URL en el archivo .env")
