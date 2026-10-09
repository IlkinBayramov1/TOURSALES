import prisma from '../../config/db.js';
import { whatsappProvider } from '../notifications/whatsapp.provider.js';
import notificationsService from '../notifications/notifications.service.js';

class ChatService {
  /**
   * Start or retrieve an active conversation between user and company with context
   */
  async startOrGetConversation({
    userId,
    companyId,
    contextType = 'GENERAL',
    contextTourId = null,
    contextHotelId = null,
    contextBookingId = null,
  }) {
    if (!userId || !companyId) {
      throw new Error('userId və companyId tələb olunur.');
    }

    // Check if an existing conversation exists with this context
    let conversation = await prisma.conversation.findFirst({
      where: {
        userId,
        companyId,
        contextType,
        contextTourId: contextTourId || undefined,
        contextHotelId: contextHotelId || undefined,
        contextBookingId: contextBookingId || undefined,
        status: 'ACTIVE',
      },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, rating: true } },
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
    });

    if (conversation) {
      return conversation;
    }

    // Build pinnedMeta based on context
    let pinnedMeta = null;

    if (contextTourId) {
      const tour = await prisma.tour.findUnique({
        where: { id: contextTourId },
        select: { id: true, title: true, price: true, startDate: true, images: true },
      });
      if (tour) {
        let tourImages = [];
        try {
          tourImages = typeof tour.images === 'string' ? JSON.parse(tour.images) : (tour.images || []);
        } catch {
          tourImages = [];
        }
        const img = Array.isArray(tourImages) && tourImages.length > 0 ? tourImages[0] : null;
        pinnedMeta = JSON.stringify({
          type: 'TOUR',
          id: tour.id,
          title: tour.title,
          price: Number(tour.price),
          date: tour.startDate,
          image: img,
          imageUrl: img,
          link: `/tours/${tour.id}`,
        });
      }
    } else if (contextHotelId) {
      const hotel = await prisma.hotel.findUnique({
        where: { id: contextHotelId },
        select: { id: true, name: true, city: true, starRating: true, images: true },
      });
      if (hotel) {
        let hotelImages = [];
        try {
          hotelImages = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : (hotel.images || []);
        } catch {
          hotelImages = [];
        }
        const img = Array.isArray(hotelImages) && hotelImages.length > 0 ? hotelImages[0] : null;
        pinnedMeta = JSON.stringify({
          type: 'HOTEL',
          id: hotel.id,
          title: hotel.name,
          city: hotel.city,
          stars: hotel.starRating,
          image: img,
          imageUrl: img,
          link: `/hotels/${hotel.id}`,
        });
      }
    } else if (contextBookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: contextBookingId },
        select: { id: true, totalAmount: true, status: true, tour: { select: { title: true } } },
      });
      if (booking) {
        pinnedMeta = JSON.stringify({
          type: 'BOOKING',
          id: booking.id,
          bookingNumber: booking.id,
          title: booking.tour?.title || 'Tur Sifarişi',
          amount: Number(booking.totalAmount),
          status: booking.status,
          link: `/bookings/${booking.id}`,
        });
      }
    }

    const conversationId = 'C-' + Math.floor(100000 + Math.random() * 900000);

    conversation = await prisma.conversation.create({
      data: {
        id: conversationId,
        userId,
        companyId,
        contextType,
        contextTourId: contextTourId || null,
        contextHotelId: contextHotelId || null,
        contextBookingId: contextBookingId || null,
        pinnedMeta,
        status: 'ACTIVE',
      },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, rating: true } },
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
    });

    return conversation;
  }

  /**
   * Get all conversations for a customer
   */
  async getUserConversations(userId) {
    return prisma.conversation.findMany({
      where: { userId },
      include: {
        company: { select: { id: true, name: true, logoUrl: true, rating: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * Get all conversations for a vendor company
   */
  async getVendorConversations(companyId) {
    return prisma.conversation.findMany({
      where: { companyId },
      include: {
        user: { select: { id: true, name: true, email: true, phoneNumber: true, loyaltyPoints: true } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  /**
   * Get message history for a conversation
   */
  async getMessages(conversationId) {
    return prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Send a chat message
   */
  async sendMessage({
    conversationId,
    senderId,
    senderRole = 'USER',
    content,
    attachments = null,
  }) {
    if (!content && (!attachments || attachments.length === 0)) {
      throw new Error('Mesaj mətni və ya qoşma fayl tələb olunur.');
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: true,
        company: true,
      },
    });

    if (!conversation) {
      throw new Error('Çat otağı tapılmadı.');
    }

    const messageId = 'CM-' + Math.floor(100000 + Math.random() * 900000);

    const message = await prisma.chatMessage.create({
      data: {
        id: messageId,
        conversationId,
        senderId,
        senderRole,
        content: content || '',
        attachments: attachments ? JSON.stringify(attachments) : null,
        isRead: false,
      },
    });

    // Update conversation last message and unread count
    const isSenderUser = senderRole === 'USER';
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageText: content || '[Fayl əlavə edildi]',
        lastMessageAt: new Date(),
        unreadCountVendor: isSenderUser ? { increment: 1 } : undefined,
        unreadCountUser: !isSenderUser ? { increment: 1 } : undefined,
      },
    });

    // Offline notification fallback (e.g. WhatsApp alert)
    if (!isSenderUser && conversation.user?.phoneNumber) {
      // Vendor answered -> alert customer via WhatsApp simulator
      const recipientPhone = conversation.user.phoneNumber;
      const cleanContent = content.length > 80 ? content.slice(0, 80) + '...' : content;
      whatsappProvider.sendMessage({
        to: recipientPhone,
        templateName: 'chat_new_message_alert',
        parameters: [
          { type: 'text', text: conversation.company?.name || 'Agentlik' },
          { type: 'text', text: cleanContent },
          { type: 'text', text: `http://localhost:5173/chat/${conversationId}` },
        ],
        bookingId: conversation.contextBookingId || undefined,
      }).catch((err) => console.warn('[WhatsApp Chat Alert] Offline warning:', err.message));
    }

    // Real-time WebSocket broadcast
    notificationsService.broadcastChatMessage(conversationId, message);

    return message;
  }

  /**
   * Mark conversation messages as read
   */
  async markAsRead(conversationId, readerRole) {
    const isUser = readerRole === 'USER';

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        unreadCountUser: isUser ? 0 : undefined,
        unreadCountVendor: !isUser ? 0 : undefined,
      },
    });

    await prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderRole: isUser ? { not: 'USER' } : 'USER',
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    notificationsService.broadcastChatRead(conversationId, readerRole);

    return { success: true };
  }

  /**
   * Canned Responses (Templates for quick vendor replies)
   */
  async getCannedResponses(companyId) {
    return prisma.cannedResponse.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCannedResponse(companyId, { title, shortcut, content, category = 'GENERAL' }) {
    const id = 'CR-' + Math.floor(100000 + Math.random() * 900000);
    return prisma.cannedResponse.create({
      data: {
        id,
        companyId,
        title,
        shortcut: shortcut.startsWith('/') ? shortcut : `/${shortcut}`,
        content,
        category,
      },
    });
  }

  async deleteCannedResponse(id, companyId) {
    return prisma.cannedResponse.deleteMany({
      where: { id, companyId },
    });
  }

  /**
   * Müştərinin CRM profilini və bu şirkətlə keçmiş rezervasiyalarını gətirir
   */
  async getCustomerCrmProfile(companyId, userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        loyaltyPoints: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('İstifadəçi tapılmadı');
    }

    const bookings = await prisma.booking.findMany({
      where: {
        companyId,
        OR: [
          { contactEmail: user.email },
          ...(user.phoneNumber ? [{ contactNumber: user.phoneNumber }] : []),
        ],
      },
      select: {
        id: true,
        passengerName: true,
        passengerSurname: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        bookingDate: true,
        seats: true,
        tour: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
      },
      orderBy: { bookingDate: 'desc' },
      take: 5,
    });

    const totalSpent = bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);

    return {
      user,
      totalBookingsCount: bookings.length,
      totalSpent,
      recentBookings: bookings,
    };
  }

  /**
   * Müştərinin CRM profilini söhbət ID-si üzrə gətirir
   */
  async getCustomerCrmProfileByConversation(conversationId, companyId, userRole) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true, companyId: true },
    });

    if (!conversation) {
      throw new Error('Söhbət tapılmadı');
    }

    if (companyId && conversation.companyId !== companyId && userRole !== 'SuperAdmin') {
      throw new Error('Bu məlumatı görmək hüququnuz yoxdur');
    }

    return this.getCustomerCrmProfile(conversation.companyId, conversation.userId);
  }

  /**
   * Söhbətin statusunu yeniləyir (ACTIVE, RESOLVED, ARCHIVED)
   */
  async updateConversationStatus(conversationId, companyId, status) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Söhbət tapılmadı');
    }

    if (conversation.companyId !== companyId) {
      throw new Error('Bu söhbəti dəyişmək hüququnuz yoxdur');
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });
  }
}

export const chatService = new ChatService();
export default chatService;
