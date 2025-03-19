import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Unirse a una sala basada en el ID de usuario
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() { userId, friendId }: { userId: string; friendId: string }, 
    @ConnectedSocket() client: Socket
  ) {
    try {
      // Unirse a la sala de usuario
      client.join(userId);

      // Cargar historial de mensajes previos
      const messages = await this.chatService.getUnreadMessages(userId);
      client.emit('loadMessages', messages); 

      // Marcar como leídos los mensajes de este chat
      await this.chatService.markMessagesAsRead(friendId, userId);
    } catch (error) {
      console.error('Error en handleJoinRoom:', error);
      client.emit('error', 'Error al unirse a la sala de chat.');
    }
  }

  // Enviar mensaje y guardarlo en la base de datos
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() { senderId, receiverId, content }: { senderId: string; receiverId: string; content: string }
  ) {
    try {
      const message = await this.chatService.saveMessage(senderId, receiverId, content);
      
      // Enviar mensaje al receptor
      this.server.to(receiverId).emit('receiveMessage', message);

      return message;
    } catch (error) {
      console.error('Error en handleMessage:', error);
      return { error: 'Error al enviar el mensaje.' };
    }
  }
}
