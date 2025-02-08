import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(3000);
}
bootstrap();
