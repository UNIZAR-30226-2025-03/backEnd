import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  /**
 * Guarda un nuevo mensaje entre dos usuarios.
 *
 * @param senderId - Email del remitente.
 * @param receiverId - Email del destinatario.
 * @param content - Contenido del mensaje.
 * @param leido - Indica si el mensaje ha sido leído (por defecto false).
 * @returns El mensaje creado.
 */
  async saveMessage(senderId: string, receiverId: string, content: string, leido = false) {
    return this.prisma.mensaje.create({
      data: { EmailSender: senderId, EmailReceiver: receiverId, Mensaje: content, Leido: leido },
    });
  }

  /**
 * Obtiene los mensajes no leídos para un receptor específico.
 *
 * @param receiverId - Email del receptor.
 * @returns Lista de mensajes no leídos ordenados por fecha ascendente.
 */
  async getUnreadMessages(receiverId: string) {
    return this.prisma.mensaje.findMany({
      where: {
        EmailReceiver: receiverId,
        Leido: false,
      },
      orderBy: { Fecha: 'asc' },
    });
  }

  /**
 * Marca como leídos todos los mensajes enviados por un usuario a otro.
 *
 * @param senderId - Email del remitente.
 * @param receiverId - Email del receptor.
 * @returns Resultado de la operación de actualización.
 */
  async markMessagesAsRead(senderId: string, receiverId: string) {
    return this.prisma.mensaje.updateMany({
      where: {
        EmailSender: senderId,
        EmailReceiver: receiverId,
        Leido: false,
      },
      data: { Leido: true },
    });
  }

  /**
 * Obtiene el historial completo de mensajes entre dos usuarios.
 *
 * @param userA - Email de un usuario.
 * @param userB - Email del otro usuario.
 * @returns Lista de mensajes con información sobre su posición (izquierda o derecha).
 */
  async getChatHistory(userA: string, userB: string) {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        OR: [
          { EmailSender: userA, EmailReceiver: userB },
          { EmailSender: userB, EmailReceiver: userA },
        ],
      },
      orderBy: { Fecha: 'asc' },
    });

    return mensajes.map((msg) => ({
      ...msg,
      posicion: msg.EmailSender === userA ? 'derecha' : 'izquierda',
    }));
  }

  /**
 * Obtiene la lista de chats para un usuario, mostrando el último mensaje de cada contacto.
 *
 * @param userEmail - Email del usuario.
 * @returns Lista de chats ordenados por prioridad de mensajes no leídos y fecha.
 */
  async getChatListForUser(userEmail: string) {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        OR: [
          { EmailSender: userEmail },
          { EmailReceiver: userEmail },
        ],
      },
      orderBy: {
        Fecha: 'desc',
      },
    });

    const chatsMap = new Map<string, {
      contact: string;
      mensaje: string;
      fecha: Date;
      Leido: boolean;
      lastMensaje: string;
      foto: string;
    }>();

    for (const mensaje of mensajes) {
      const contactEmail = mensaje.EmailSender === userEmail
        ? mensaje.EmailReceiver
        : mensaje.EmailSender;

      if (chatsMap.has(contactEmail)) continue;

      const otherUser = await this.prisma.usuario.findUnique({
        where: { Email: contactEmail },
        select: { LinkFoto: true }
      });

      const esNoLeido = !mensaje.Leido;

      chatsMap.set(contactEmail, {
        contact: contactEmail,
        mensaje: mensaje.Mensaje,
        fecha: mensaje.Fecha,
        Leido: !esNoLeido,
        lastMensaje: mensaje.EmailSender,
        foto: otherUser?.LinkFoto || '',
      });
    }

    const chatList = Array.from(chatsMap.values());

    return chatList.sort((a, b) => {
      if (!a.Leido && !b.Leido) {
        return b.fecha.getTime() - a.fecha.getTime();
      }
      if (!a.Leido) return -1;
      if (!b.Leido) return 1;
      return b.fecha.getTime() - a.fecha.getTime();
    });
  }

}
