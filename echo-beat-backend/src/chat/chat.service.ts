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
  
    // Crear un mapa de chats con la última fecha de mensaje no leído
    const chatsMap = new Map<string, {
      contact: string;
      mensaje: string;
      fecha: Date;
      Leido: boolean;
      unreadFecha?: Date;
      lastMensaje: string;
      foto: string;
    }>();
  
    for (const mensaje of mensajes) {
      const contactEmail = mensaje.EmailSender === userEmail
        ? mensaje.EmailReceiver
        : mensaje.EmailSender;
  
      // Si no existe el chat en el mapa, lo añadimos
      if (!chatsMap.has(contactEmail)) {
      // Consulta a la tabla de usuarios para obtener el link de la foto del otro usuario
      const otherUser = await this.prisma.usuario.findUnique({
        where: { Email: contactEmail },
        select: { LinkFoto: true }
      });  

      const esMensajeNoLeido = !mensaje.Leido && mensaje.EmailReceiver === userEmail;

        chatsMap.set(contactEmail, {
          contact: contactEmail,
          mensaje: mensaje.Mensaje,
          fecha: mensaje.Fecha,
          Leido: !esMensajeNoLeido,
          lastMensaje: mensaje.EmailSender,
          foto: otherUser?.LinkFoto || '', // Link de la foto del otro usuario
        });
      }
  
      // Si tiene mensajes no leídos, actualizamos el chat
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
    
    // Convertimos el mapa a una lista 
    const chatList = Array.from(chatsMap.values());
  
    // Ordenar la lista de chats priorizando los no leídos
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
