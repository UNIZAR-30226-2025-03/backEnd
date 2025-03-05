import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';

async function bootstrap() {
  const port = process.env.PORT || 3000;
  let app;

  // Si en el .env la variable HTTPS es "YES", se configura HTTPS
  if (process.env.HTTPS === 'YES') {
    // Lee el dominio desde la variable DUCKDNS_DOMAIN 
    const domain = process.env.DUCKDNS_DOMAIN;
    // Configura las opciones HTTPS con los certificados de Let's Encrypt para ese dominio
    const httpsOptions = {
      key: fs.readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
      cert: fs.readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
    };

    app = await NestFactory.create(AppModule, { httpsOptions });
    // HTTPS normalmente usa el puerto 443
    await app.listen(443, '0.0.0.0');
    console.log(`Servidor corriendo en https://${domain}`);
  } else {
    // Si HTTPS no está habilitado, se inicia en HTTP
    app = await NestFactory.create(AppModule);
    await app.listen(port, '0.0.0.0');
    console.log(`Servidor corriendo en http://localhost:${port}`);
  }

  // Habilitar CORS para todas las peticiones
  app.enableCors();

  // Configuración básica de Swagger
  const config = new DocumentBuilder()
    .setTitle('Echo Beat Backend')
    .setDescription('API de streaming de música')
    .setVersion('1.0')
    .addBearerAuth() // si usas autenticación JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}
bootstrap();
