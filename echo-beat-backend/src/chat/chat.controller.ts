import { Controller, Post, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('guardarMensaje')
  @ApiOperation({ summary: 'Guardar un nuevo mensaje entre dos usuarios' })
  @ApiResponse({ status: 200, description: 'Mensaje guardado correctamente.' })
  @ApiResponse({ status: 400, description: 'Faltan datos o hay un error al guardar el mensaje.' })
  async saveMessage(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
    @Query('content') content: string,
  ) {
    return this.chatService.saveMessage(senderId, receiverId, content);
  }

  @Post('marcarComoLeidos')
  @ApiOperation({ summary: 'Marcar como leídos los mensajes entre dos usuarios' })
  @ApiResponse({ status: 200, description: 'Mensajes marcados como leídos.' })
  @ApiResponse({ status: 400, description: 'No se pudieron marcar los mensajes como leídos.' })
  async markAsRead(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
  ) {
    return this.chatService.markMessagesAsRead(senderId, receiverId);
  }

  @Get('historialDelChat')
  @ApiOperation({ summary: 'Obtener el historial de mensajes entre dos usuarios ordenados por fecha descendente y marcar los mensajes entre ambos como leidos' })
  @ApiResponse({ status: 200, description: 'Historial del chat recuperado correctamente.' })
  @ApiResponse({ status: 400, description: 'Error al recuperar el historial del chat.' })
  async getChatHistory(
    @Query('userPrincipal') userA: string,
    @Query('userAmigo') userB: string,
  ) {
    return this.chatService.getChatHistory(userA, userB);
  }

  @Get('chatsDelUsuario')
  @ApiOperation({ summary: 'Obtener la lista de chats del usuario, priorizando los que tienen mensajes no leídos' })
  @ApiResponse({ status: 200, description: 'Lista de chats obtenida correctamente.' })
  @ApiResponse({ status: 400, description: 'Error al recuperar la lista de chats del usuario.' })
  async getChatListForUser(
    @Query('userEmail') userEmail: string,
  ) {
    return this.chatService.getChatListForUser(userEmail);
  }
}
