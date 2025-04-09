#!/usr/bin/env bash

# Abortar en caso de error
set -e

# Iniciar el servidor (en segundo plano)
echo "Iniciando el servidor NestJS en background..."
npm run start:dev &
SERVER_PID=$!

# Esperar unos segundos para que el servidor termine de levantar
echo "Esperando que el servidor se inicie..."
sleep 5

# Ejecutar el test específico
echo "Lanzando pruebas de users.controller.spec.ts..."
npm run test -- ./src/users/users.controller.spec.ts
TEST_EXIT_CODE=$?

# Matar el proceso del servidor
echo "Finalizando el servidor..."
kill $SERVER_PID

# Salir con el código de estado del test
exit $TEST_EXIT_CODE
