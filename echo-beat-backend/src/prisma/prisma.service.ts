import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect(); // Conexión a la base de datos
  }

  async onModuleDestroy() {
    await this.$disconnect(); // Desconexión al destruir el módulo
  }
}

