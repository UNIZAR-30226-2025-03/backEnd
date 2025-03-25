import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Map para rastrear qué usuario está en qué socket
  private users = new Map<string, string>(); // socketId => userEmail

  handleConnection(client: Socket) {
    const numConexiones = this.server.sockets.sockets.size;
    console.log(`Cliente conectado: ${client.id}`);
    console.log(`Número total de sockets conectados: ${numConexiones}`);
  }

  handleDisconnect(client: Socket) {
    const userEmail = this.users.get(client.id);
    if (userEmail) {
      console.log(`Usuario desconectado: ${userEmail}`);
      this.users.delete(client.id);
    }
  }

  @SubscribeMessage('register')
  handleRegister(@MessageBody() userEmail: string, @ConnectedSocket() client: Socket) {
    this.users.set(client.id, userEmail);
    client.join(userEmail); // El usuario se une a una "sala" con su email
    console.log(`Usuario registrado en sala: ${userEmail}`);
  }

  @SubscribeMessage('enviarMensaje')
  async handleSendMessage(
    @MessageBody()
    payload: { senderId: string; receiverId: string; content: string },
  ) {
    const { senderId, receiverId, content } = payload;

    // Verificar si el receptor está conectado (unido a su sala)
    const socketsEnSala = await this.server.in(receiverId).fetchSockets();
    const receptorConectado = socketsEnSala.length > 0;

    // 1. Guardamos el mensaje en la base de datos
    const mensajeGuardado = await this.chatService.saveMessage(senderId, receiverId, content, receptorConectado);

    // Emitir el mensaje al receptor si está conectado
    if (receptorConectado) {
      this.server.to(receiverId).emit('receiveMessage', mensajeGuardado);
    }

    // Confirmar al emisor que el mensaje fue enviado
    this.server.to(senderId).emit('messageSent', mensajeGuardado);
  }

}
