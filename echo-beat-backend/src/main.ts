import { NestFactory } from '@nestjs/core';
import { AppModule }      from './app.module';
import { StreamingModule } from './streaming/streaming.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs   from 'fs';
import * as compression from 'compression';
import * as bodyParser  from 'body-parser';

async function bootstrap() {
  /* ──────────────── 1.  HTTPS vs HTTP ──────────────── */
  const useHttps = process.env.HTTPS === 'YES';
  const port     = useHttps ? 443 : Number(process.env.PORT) || 3000;

  /* ──────────────── 2.  (Sólo con HTTPS) lógica clúster ──────────────── */
  let RootModule = AppModule;                      // por defecto REST solo
  if (useHttps) {
    const pmId       = process.env.NODE_APP_INSTANCE ?? '0';
    const isWsWorker = pmId === '0';              // ← único worker con WS
    RootModule       = isWsWorker ? StreamingModule : AppModule;
  }

  /* ──────────────── 3.  Opciones HTTPS si procede ──────────────── */
  const nestOpts = useHttps
    ? {
        httpsOptions: {
          key : fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/privkey.pem'),
          cert: fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/fullchain.pem'),
        },
      }
    : {};

  const app = await NestFactory.create(RootModule, nestOpts);

  /* ──────────────── 4.  Middleware global ──────────────── */
  app.enableCors();
  app.use(compression({ threshold: 0 }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  /* ──────────────── 5.  Swagger sólo si NO es worker-WS ──────────────── */
  const skipSwagger = useHttps && process.env.NODE_APP_INSTANCE === '0';
  if (!skipSwagger) {
    const cfg = new DocumentBuilder()
      .setTitle('Echo Beat Backend')
      .setDescription('API de streaming de música')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const doc = SwaggerModule.createDocument(app, cfg);
    SwaggerModule.setup('api', app, doc);
  }

  await app.listen(port, '0.0.0.0');
  console.log(
    `[Worker ${process.env.NODE_APP_INSTANCE ?? 'single'}] ` +
      `${useHttps ? 'HTTPS' : 'HTTP'} en ${port} ` +
      `${useHttps && process.env.NODE_APP_INSTANCE === '0' ? '(WS+REST)' : ''}`,
  );
}
bootstrap();
