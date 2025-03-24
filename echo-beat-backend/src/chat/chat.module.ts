import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
