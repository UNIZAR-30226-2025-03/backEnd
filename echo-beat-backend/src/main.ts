import { NestFactory } from '@nestjs/core';
import { AppModule }      from './app.module';
import { StreamingModule } from './streaming/streaming.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as fs   from 'fs';
import * as compression from 'compression';
import * as bodyParser  from 'body-parser';

async function bootstrap() {
  /* 1️⃣  HTTPS vs HTTP */
  const useHttps   = process.env.HTTPS   === 'YES';
  const port       = useHttps ? 443 : Number(process.env.PORT) || 3000;

  /* 2️⃣  ¿Entramos en clúster?  —> depende solo de CLUSTER=YES */
  const useCluster = process.env.CLUSTER === 'YES';
  let   RootModule = AppModule;                     // REST por defecto

  if (useCluster) {
    const pmId       = process.env.NODE_APP_INSTANCE ?? '0';
    const isWsWorker = pmId === '0';               // único worker con WS
    RootModule       = isWsWorker ? StreamingModule : AppModule;
  }

  /* 3️⃣  Opciones HTTPS (si procede) */
  const nestOpts = useHttps
    ? {
        httpsOptions: {
          key : fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/privkey.pem'),
          cert: fs.readFileSync('/home/azureuser/certificates/echobeatapi.duckdns.org/fullchain.pem'),
          //key: fs.readFileSync('./certificates/echobeatapi.duckdns.org/privkey.pem'),
          //cert: fs.readFileSync('./certificates/echobeatapi.duckdns.org/fullchain.pem'),
        },
      }
    : {};

  const app = await NestFactory.create(RootModule, nestOpts);

  /* 4️⃣  Middleware global */
  app.enableCors();
  app.use(compression({ threshold: 0 }));
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  /* 5️⃣  Registrar Swagger SIEMPRE */
  const cfg = new DocumentBuilder()
    .setTitle('Echo Beat Backend')
    .setDescription('API de streaming de música')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, cfg));


  await app.init();                 
  const server = app.getHttpServer();  
  server.listen(
    { port, host: '0.0.0.0', reusePort: true },   
    () => console.log(`[PID ${process.pid}] LISTEN ${port}`)
  );
  console.log(
    `[Worker ${process.env.NODE_APP_INSTANCE ?? 'single'}] ` +
    `${useHttps ? 'HTTPS' : 'HTTP'} en ${port} ` +
    `${useCluster && process.env.NODE_APP_INSTANCE === '0' ? '(WS+REST)' : '(REST)'}`,
  );
}

bootstrap();























