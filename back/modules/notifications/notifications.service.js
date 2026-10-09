import nodemailer from 'nodemailer';
import { Server } from 'socket.io';
import whatsappProvider from './whatsapp.provider.js';
import smsProvider from './sms.provider.js';

class NotificationsService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> socketId
  }

  // Socket.io serverini bağlamaq üçün
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      // console.log(`WebSocket Client connected: ${socket.id}`);

      socket.on('register', (userId) => {
        this.userSockets.set(userId, socket.id);
      });

      // Join tour room for real-time manifest synchronization
      socket.on('join-tour', (tourId) => {
        socket.join(`tour:${tourId}`);
      });

      socket.on('leave-tour', (tourId) => {
        socket.leave(`tour:${tourId}`);
      });

      // Real-time Chat Events
      socket.on('chat:join', (conversationId) => {
        socket.join(`chat:${conversationId}`);
      });

      socket.on('chat:leave', (conversationId) => {
        socket.leave(`chat:${conversationId}`);
      });

      socket.on('chat:typing', ({ conversationId, senderName, senderRole, isTyping }) => {
        socket.to(`chat:${conversationId}`).emit('chat:typing', {
          conversationId,
          senderName,
          senderRole,
          isTyping,
        });
      });

      // Real-time Ticket Events
      socket.on('ticket:join', (ticketId) => {
        socket.join(`ticket:${ticketId}`);
      });

      socket.on('ticket:leave', (ticketId) => {
        socket.leave(`ticket:${ticketId}`);
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            break;
          }
        }
      });
    });
  }

  /**
   * Çat otağına yeni mesaj yayımlayır
   */
  broadcastChatMessage(conversationId, message) {
    if (!this.io) return;
    this.io.to(`chat:${conversationId}`).emit('chat:new_message', message);
    this.io.emit('chat:conversation_updated', {
      conversationId,
      lastMessageText: message.content,
      lastMessageAt: message.createdAt,
    });
  }

  /**
   * Çat oxundu statusunu yayımlayır
   */
  broadcastChatRead(conversationId, readerRole) {
    if (!this.io) return;
    this.io.to(`chat:${conversationId}`).emit('chat:read', { conversationId, readerRole });
  }

  /**
   * Bilet otağına və qlobal olaraq yeni cavab yayımlayır
   */
  broadcastTicketReply(ticketId, reply, ticket) {
    if (!this.io) return;
    this.io.to(`ticket:${ticketId}`).emit('ticket:reply', { ticketId, reply, ticket });
    this.io.emit('ticket:updated', { ticketId, status: ticket?.status, ticket });
  }

  /**
   * Bilet statusu dəyişməsini yayımlayır
   */
  broadcastTicketStatusChange(ticketId, ticket) {
    if (!this.io) return;
    this.io.to(`ticket:${ticketId}`).emit('ticket:status_change', { ticketId, ticket });
    this.io.emit('ticket:updated', { ticketId, ticket });
  }

  /**
   * Yeni bilet yaradıldıqda bildiriş yayımlayır
   */
  broadcastTicketCreated(ticket) {
    if (!this.io) return;
    this.io.emit('ticket:created', ticket);
  }

  /**
   * B2B Tender: Yeni fərdi tur sorğusu yayımlayır (Bütün tərəfdaşlar üçün)
   */
  broadcastTenderNewRequest(tender) {
    if (!this.io) return;
    this.io.emit('tender:new_request', tender);
  }

  /**
   * B2B Tender: Qalib təklif qəbul olunduqda yayımlayır
   */
  broadcastTenderBidAccepted(data) {
    if (!this.io) return;
    this.io.emit('tender:bid_accepted', data);
  }

  /**
   * Tur otağına və qlobal olaraq minik statusunu yayımlayır (Ofis və Bələdçilər üçün)
   */
  broadcastPassengerCheckIn(eventData) {
    if (!this.io) return;
    // Emit to specific tour subscribers and globally
    this.io.to(`tour:${eventData.tourId}`).emit('passenger:checked-in', eventData);
    this.io.emit('passenger:checked-in', eventData);
  }

  /**
   * Tur otağına real-vaxt oturacaq kilidlənməsini yayımlayır
   */
  broadcastSeatLocked(tourId, seatNumbers, userId, expiresAt) {
    if (!this.io) return;
    this.io.to(`tour:${tourId}`).emit('seats:locked', {
      tourId,
      seatNumbers: Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers],
      lockedBy: userId,
      expiresAt
    });
  }

  /**
   * Tur otağına real-vaxt oturacaq azad olunmasını yayımlayır
   */
  broadcastSeatReleased(tourId, seatNumbers) {
    if (!this.io) return;
    this.io.to(`tour:${tourId}`).emit('seats:released', {
      tourId,
      seatNumbers: Array.isArray(seatNumbers) ? seatNumbers : [seatNumbers]
    });
  }

  // WhatsApp helper
  async sendWhatsApp(params) {
    return whatsappProvider.sendMessage(params);
  }

  // SMS helper
  async sendSms(params) {
    return smsProvider.sendSms(params);
  }

  async send(data) {
    const { userId, type, title, message, email } = data;
    console.log(`[Notification Alert] [Type: ${type}] To: ${email || userId}. Title: ${title}. Msg: ${message}`);

    // 1. WebSocket vasitəsilə anlıq bildiriş göndərilməsi (əgər online-dırsa)
    if (this.io && userId) {
      const socketId = this.userSockets.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('notification', {
          type,
          title,
          message,
          createdAt: new Date()
        });
      }
    }

    // 2. Email bildirişinin göndərilməsi (Nodemailer ilə)
    if (email) {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'mock_toursales_smtp@ethereal.email',
            pass: 'mock_password_123'
          }
        });
        console.log(`[Email Sent Mocked] To: ${email} | Subject: ${title}`);
      } catch (err) {
        console.error('Email göndərilərkən xəta yarandı:', err);
      }
    }
  }
}

export const notificationsService = new NotificationsService();
export { whatsappProvider, smsProvider };
export default notificationsService;

