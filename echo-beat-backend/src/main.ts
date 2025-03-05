import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs from 'fs';
import * as compression from 'compression';  // Importa el middleware

async function bootstrap() {
  const port = process.env.PORT || 3000;
  let app;

  if (process.env.HTTPS === 'YES') {
    const domain = process.env.DUCKDNS_DOMAIN;
    const httpsOptions = {
      key: fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/privkey.pem'),
      cert: fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/fullchain.pem'),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
    console.log(`Servidor configurado para HTTPS en dominio: ${domain}`);
  } else {
    app = await NestFactory.create(AppModule);
    console.log(`Servidor configurado para HTTP en puerto: ${port}`);
  }

  // Habilita CORS
  app.enableCors();

  // Habilitar la compresión Gzip para todas las respuestas
  app.use(compression({ threshold: 0 }));

  // Configuración de Swagger (opcional)
  const config = new DocumentBuilder()
    .setTitle('Echo Beat Backend')
    .setDescription('API de streaming de música')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Iniciar el servidor
  if (process.env.HTTPS === 'YES') {
    await app.listen(443, '0.0.0.0');
  } else {
    await app.listen(port, '0.0.0.0');
  }
}
bootstrap();
