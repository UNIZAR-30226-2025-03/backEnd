import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Habilita CORS para todas las peticiones
  app.enableCors();
  // Configuración básica de Swagger
  const config = new DocumentBuilder()
    .setTitle('Echo Beat Backend')
    .setDescription('API de streaming de música')
    .setVersion('1.0')
    .addBearerAuth() // si usas autenticación JWT
    .build();

  // Generar el documento a partir de la config
  const document = SwaggerModule.createDocument(app, config);

  // Habilitar la ruta /api para visualizar la documentación
  SwaggerModule.setup('api', app, document);

  // Usa una variable de entorno para el puerto o el valor por defecto 3000
  const port = process.env.PORT || 3000;
  
  // Escucha en todas las interfaces de red ('0.0.0.0') para exponer el puerto
  await app.listen(port, '0.0.0.0');
  console.log(`Servidor corriendo en http://localhost:${port}`);
}
bootstrap();
