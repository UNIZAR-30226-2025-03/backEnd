import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  //Función para guardar un mensaje en la base de datos
  async saveMessage(senderId: string, receiverId: string, content: string, leido = false) {
    return this.prisma.mensaje.create({
      data: { EmailSender: senderId, EmailReceiver: receiverId, Mensaje: content, Leido: leido },
    });
  }
  
  //Función para obtener los mensajes no leídos de un usuario
  async getUnreadMessages(receiverId: string) {
    return this.prisma.mensaje.findMany({
      where: {
        EmailReceiver: receiverId,
        Leido: false,
      },
      orderBy: { Fecha: 'asc' },
    });
  }

  //Función para marcar los mensajes entre dos usuarios como leídos, se usara cuando un user acceda al chat con otro user
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

  //Función para obtener el historial de mensajes entre dos usuarios
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
  
    // Añadir la propiedad "posicion" con el fin de saber si el mensaje hay que mostrarlo a la izquierda o a la derecha
    return mensajes.map((msg) => ({
      ...msg,
      posicion: msg.EmailSender === userA ? 'derecha' : 'izquierda',
    }));
  }
  
  //Función para obtener la lista de chats del usuario, priorizando los que tienen mensajes no leídos
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
  
      // Si ya hemos procesado este chat (contacto), lo saltamos
      if (chatsMap.has(contactEmail)) continue;
  
      const otherUser = await this.prisma.usuario.findUnique({
        where: { Email: contactEmail },
        select: { LinkFoto: true }
      });
  
      // Leído solo si el último mensaje no es un mensaje no leído recibido
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
        return b.fecha.getTime() - a.fecha.getTime(); // los dos son no leídos → último primero
      }
      if (!a.Leido) return -1;
      if (!b.Leido) return 1;
      return b.fecha.getTime() - a.fecha.getTime();
    });
  }
  
}
