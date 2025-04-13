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

  constructor(private readonly chatService: ChatService) { }

  private users = new Map<string, string>();

  /**
 * Maneja la conexión de un cliente WebSocket.
 *
 * @param client - Socket conectado.
 */
  handleConnection(client: Socket) {
    const numConexiones = this.server.sockets.sockets.size;
    console.log(`Cliente conectado: ${client.id}`);
    console.log(`Número total de sockets conectados: ${numConexiones}`);
  }

  /**
 * Maneja la desconexión de un cliente WebSocket.
 *
 * @param client - Socket desconectado.
 */
  handleDisconnect(client: Socket) {
    const userEmail = this.users.get(client.id);
    if (userEmail) {
      console.log(`Usuario desconectado: ${userEmail}`);
      this.users.delete(client.id);
    }
  }

  /**
 * Registra a un usuario en una sala utilizando su email.
 *
 * @param userEmail - Email del usuario que se conecta.
 * @param client - Socket asociado al usuario.
 */
  @SubscribeMessage('register')
  handleRegister(@MessageBody() userEmail: string, @ConnectedSocket() client: Socket) {
    this.users.set(client.id, userEmail);
    client.join(userEmail);
    console.log(`Usuario registrado en sala: ${userEmail}`);
  }

  /**
 * Maneja el envío de un mensaje entre usuarios.
 * Guarda el mensaje y lo emite al receptor si está conectado.
 *
 * @param payload - Contiene senderId, receiverId y content del mensaje.
 * @returns El mensaje guardado y emitido a los sockets correspondientes.
 */
  @SubscribeMessage('enviarMensaje')
  async handleSendMessage(
    @MessageBody()
    payload: { senderId: string; receiverId: string; content: string },
  ) {
    const { senderId, receiverId, content } = payload;

    const socketsEnSala = await this.server.in(receiverId).fetchSockets();
    const receptorConectado = socketsEnSala.length > 0;

    const mensajeGuardado = await this.chatService.saveMessage(senderId, receiverId, content, receptorConectado);

    if (receptorConectado) {
      this.server.to(receiverId).emit('receiveMessage', mensajeGuardado);
    }

    this.server.to(senderId).emit('messageSent', mensajeGuardado);
  }

}
