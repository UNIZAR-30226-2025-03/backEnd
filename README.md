# EchoBeat BackEnd 🚀

[![License](https://img.shields.io/github/license/UNIZAR-30226-2025-03/backEnd?style=flat-square)]()
[![NestJS](https://img.shields.io/badge/NestJS-%23E0234E.svg?style=flat-square&logo=nestjs)]()

> **EchoBeat** BackEnd — APIs REST construidas con NestJS, PostgreSQL (Prisma ORM) y Azure Blob Storage.

---

## 📖 Descripción

El servicio de backend de **EchoBeat** proporciona:

- Autenticación y autorización de usuarios.  
- Gestión de usuarios, playlists, canciones y relaciones sociales.  
- Streaming de audio a través de Azure Blob Storage.  
- Estadísticas de reproducción y métricas.  
- Panel de administración para moderadores.

---

## 📑 Tabla de Contenidos

1. [Características](#-características)  
2. [Tecnologías](#-tecnologías)  
3. [Requisitos Previos](#-requisitos-previos)  
4. [Instalación](#-instalación)  
5. [Configuración](#-configuración)  
6. [Ejecución](#-ejecución)  
7. [Documentación de API](#-documentación-de-api)  
8. [Estructura de Carpetas](#-estructura-de-carpetas)  
9. [Scripts Útiles](#-scripts-útiles)  
10. [Testing](#-testing)  
11. [Despliegue](#-despliegue)  
12. [Contribuciones](#-contribuciones)  
13. [Licencia](#-licencia)

---

## ✨ Características

- **Modularidad** gracias a la arquitectura de NestJS.  
- **ORM tipado**: Prisma + PostgreSQL.  
- **Almacenamiento estático**: Azure Blob Storage para canciones e imágenes.  
- **Seguridad**: JWT, hashing de contraseñas y HTTPS 🔒.  
- **Pruebas**: Unitarias y de integración con Jest.  
- **Documentación automática**: Swagger + TypeDoc.  

---

## 🛠️ Tecnologías

- **NestJS** (TypeScript)  
- **Prisma ORM** + PostgreSQL  
- **Azure Blob Storage** para archivos multimedia.  
- **Jest** para pruebas.  
- **Swagger** (nestjs/swagger) y **TypeDoc** para documentación.  

---

## ⚙️ Requisitos Previos

- Node.js ≥ 16  
- npm ≥ 8  
- Cuenta y contenedor en Azure Blob Storage  
- PostgreSQL ≥ 14  
- Variables de entorno configuradas (ver sección [Configuración](#-configuración))  

---

## 🚀 Instalación
Clona el repositorio
```bash
git clone https://github.com/UNIZAR-30226-2025-03/backEnd.git
cd backEnd/echo-beat-backend
# Instala dependencias
npm install
```
## 🔧 Configuración
Crea un archivo .env en la raíz con las siguientes variables:

```bash
# Servidor
PORT=3000

# Base de datos
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/ECHO_BEAT?schema=public"

# JWT
JWT_SECRET="tu_secreto_jwt"
JWT_EXPIRES_IN="3600s"

# Azure Blob
AZURE_STORAGE_ACCOUNT="tu_cuenta"
AZURE_STORAGE_ACCESS_KEY="tu_llave"
AZURE_STORAGE_CONTAINER="canciones"

```
## ▶️ Ejecución
```bash
# Modo desarrollo con recarga
npm run start:dev

# Compilación y ejecución
npm run build
npm run start:prod
```
```
```
## 📄 Documentación de API
Swagger UI: /api

TypeDoc (documentación de código): disponible tras ejecutar npm run docs.

## 📁 Estructura de Carpetas
```bash
Editar
echo-beat-backend/
├── src/
│   ├── modules/        # Módulos de NestJS (auth, users, playlists…)
│   ├── prisma/         # Cliente Prisma y migraciones
│   ├── common/         # Utilidades, interceptores, pipes
│   ├── main.ts         # Punto de entrada
│   └── ...
├── test/               # Pruebas unitarias y e2e
├── prisma/             # Esquema principal y seed scripts
├── docs/               # Documentación adicional
├── .env.example        # Ejemplo de variables de entorno
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```
## 📦 Scripts Útiles
```bash
npm run build — Compila TypeScript.

npm run start:dev — Levanta en modo watch.

npm run start:prod — Ejecución en producción.

npm run test — Ejecuta pruebas unitarias.


npm run prisma:migrate — Corre migraciones de Prisma.

npm run docs — Genera documentación TypeDoc.
```


## ☁️ Despliegue
Puedes desplegar en cualquier plataforma Node.js. Recomendamos:

Docker + GitHub Actions para CI/CD.

pm2 para el despliege


##  🤝 Contribuciones
Haz un fork ⭐

Crea una rama feature/nueva-funcionalidad

Abre un PR detallando los cambios

Asegúrate de pasar todas las pruebas

## 📜 Licencia
Este proyecto está bajo la MIT License. 
