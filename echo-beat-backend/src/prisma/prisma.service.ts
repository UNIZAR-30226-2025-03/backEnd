// src/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  async createUser(username: string, password: string) {
    return this.user.create({
      data: {
        username,
        password,
      },
    });
  }

  async getUsers() {
    return this.user.findMany();
  }
}

