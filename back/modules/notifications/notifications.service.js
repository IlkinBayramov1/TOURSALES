import nodemailer from 'nodemailer';
import { Server } from 'socket.io';

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
      console.log(`WebSocket Client connected: ${socket.id}`);

      socket.on('register', (userId) => {
        this.userSockets.set(userId, socket.id);
        console.log(`User registered for push notifications: User ID ${userId} -> Socket ID ${socket.id}`);
      });

      socket.on('disconnect', () => {
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`User offline: ${userId}`);
            break;
          }
        }
      });
    });
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
        console.log(`WebSocket notification pushed to user: ${userId}`);
      }
    }

    // 2. Email bildirişinin göndərilməsi (Nodemailer ilə)
    if (email) {
      try {
        // Test/Mock mail göndərmə konfiqurasiyası
        const transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'mock_toursales_smtp@ethereal.email',
            pass: 'mock_password_123'
          }
        });

        // Həqiqi SMTP olmadıqda sadəcə log yazır, lakin kod axını hazırdır
        console.log(`[Email Sent Mocked] To: ${email} | Subject: ${title} | Body: ${message}`);
      } catch (err) {
        console.error('Email göndərilərkən xəta yarandı:', err);
      }
    }
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
