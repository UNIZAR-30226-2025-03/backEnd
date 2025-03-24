import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(senderId: string, receiverId: string, content: string, leido = false) {
    return this.prisma.mensaje.create({
      data: { EmailSender: senderId, EmailReceiver: receiverId, Mensaje: content, Leido: leido },
    });
  }
  
  async getUnreadMessages(receiverId: string) {
    return this.prisma.mensaje.findMany({
      where: {
        EmailReceiver: receiverId,
        Leido: false,
      },
      orderBy: { Fecha: 'asc' },
    });
  }

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
  
    // Crear un mapa de chats con la última fecha de mensaje no leído
    const chatsMap = new Map<string, {
      contact: string;
      mensaje: string;
      fecha: Date;
      Leido: boolean;
      unreadFecha?: Date;
    }>();
  
    for (const mensaje of mensajes) {
      const contactEmail = mensaje.EmailSender === userEmail
        ? mensaje.EmailReceiver
        : mensaje.EmailSender;
  
      if (!chatsMap.has(contactEmail)) {

      const esMensajeNoLeido = !mensaje.Leido && mensaje.EmailReceiver === userEmail;

        chatsMap.set(contactEmail, {
          contact: contactEmail,
          mensaje: mensaje.Mensaje,
          fecha: mensaje.Fecha,
          Leido: !esMensajeNoLeido
        });
      }
  
      // Si tiene no leídos que el usuario actual ha recibido
      if (!mensaje.Leido && mensaje.EmailReceiver === userEmail) {
        const current = chatsMap.get(contactEmail);
        if (current) {
          current.Leido = false;
          // Guardamos la fecha del mensaje no leído más reciente
          if (!current.unreadFecha || mensaje.Fecha > current.unreadFecha) {
            current.unreadFecha = mensaje.Fecha;
          }
        }
      }
    }
  
    const chatList = Array.from(chatsMap.values());
  
    return chatList.sort((a, b) => {
      if (!a.Leido && !b.Leido) {
        // Ambos tienen no leídos → ordenar por fecha del no leído más reciente
        return b.unreadFecha!.getTime() - a.unreadFecha!.getTime();
      }
      if (!a.Leido) return -1; // a va primero
      if (!b.Leido) return 1;  // b va primero
      // Ninguno tiene no leídos → ordenar por último mensaje general
      return b.fecha.getTime() - a.fecha.getTime();
    });
  }
  
}
