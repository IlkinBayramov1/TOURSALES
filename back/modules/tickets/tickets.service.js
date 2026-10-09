import prisma from '../../config/db.js';
import notificationsService from '../notifications/notifications.service.js';

class TicketsService {
  /**
   * Create a new support ticket
   */
  async createTicket(userId, {
    companyId = null,
    bookingId = null,
    category = 'GENERAL_SUPPORT',
    priority = 'MEDIUM',
    subject,
    description,
    requestedRefund = null,
    attachments = null,
    senderRole = 'USER',
  }) {
    if (!subject || !description) {
      throw new Error('Mövzu və müraciət mətni tələb olunur.');
    }

    const ticketNumber = 'TCK-' + Math.floor(100000 + Math.random() * 900000);
    const id = 'T-' + Math.floor(100000 + Math.random() * 900000);

    // Auto-calculate recommended refund policy if this is a refund request linked to a booking
    let recommendedRefund = null;
    let targetCompanyId = companyId;

    if (bookingId) {
      // Find booking (Tour or Hotel)
      const tourBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tour: true },
      });

      if (tourBooking) {
        targetCompanyId = targetCompanyId || tourBooking.companyId;

        if (category === 'REFUND_REQUEST' && tourBooking.tour?.startDate) {
          const now = Date.now();
          const departure = new Date(tourBooking.tour.startDate).getTime();
          const daysLeft = Math.ceil((departure - now) / (1000 * 3600 * 24));
          const totalPaid = Number(tourBooking.paidAmount || tourBooking.totalAmount || 0);

          if (daysLeft >= 7) {
            recommendedRefund = totalPaid; // 100% refund
          } else if (daysLeft >= 3) {
            recommendedRefund = Math.round(totalPaid * 0.7 * 100) / 100; // 70% refund
          } else {
            recommendedRefund = 0; // 0% non-refundable
          }
        }
      }
    }

    const attachmentsJson = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null;

    const ticket = await prisma.supportTicket.create({
      data: {
        id,
        ticketNumber,
        userId,
        companyId: targetCompanyId,
        bookingId: bookingId || null,
        category,
        priority,
        status: 'OPEN',
        subject,
        description,
        requestedRefund: requestedRefund !== null && requestedRefund !== undefined ? Number(requestedRefund) : recommendedRefund,
        attachments: attachmentsJson,
      },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
    });

    // Create initial message in ticket thread
    const messageId = 'TM-' + Math.floor(100000 + Math.random() * 900000);
    await prisma.ticketMessage.create({
      data: {
        id: messageId,
        ticketId: ticket.id,
        senderId: userId,
        senderRole: senderRole || 'USER',
        message: description,
        attachments: attachmentsJson,
        isInternalNote: false,
      },
    });

    notificationsService.broadcastTicketCreated(ticket);
    return ticket;
  }

  /**
   * Get tickets for customer
   */
  async getMyTickets(userId, filters = {}) {
    const where = { userId };
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.category && filters.category !== 'ALL') where.category = filters.category;
    if (filters.priority && filters.priority !== 'ALL') where.priority = filters.priority;

    return prisma.supportTicket.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Get tickets for vendor company with advanced filtering, search, and KPI aggregation
   */
  async getVendorTickets(companyId, filters = {}) {
    if (!companyId) {
      return {
        tickets: [],
        stats: { total: 0, open: 0, waiting: 0, critical: 0, resolved: 0, escalated: 0, closed: 0 },
      };
    }

    const where = { companyId };

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'ALL') {
      where.priority = filters.priority;
    }

    // Category filter
    if (filters.category && filters.category !== 'ALL') {
      where.category = filters.category;
    }

    // Search query
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
        { user: { phoneNumber: { contains: q } } },
      ];
    }

    // 1. Fetch matching tickets
    const rawTickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. Compute global vendor KPI stats
    const allVendorTickets = await prisma.supportTicket.findMany({
      where: { companyId },
      select: { id: true, status: true, priority: true },
    });

    const stats = {
      total: allVendorTickets.length,
      open: allVendorTickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length,
      waiting: allVendorTickets.filter((t) => t.status === 'WAITING_CUSTOMER').length,
      critical: allVendorTickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
      resolved: allVendorTickets.filter((t) => t.status === 'RESOLVED').length,
      escalated: allVendorTickets.filter((t) => t.status === 'ESCALATED_TO_ADMIN').length,
      closed: allVendorTickets.filter((t) => t.status === 'CLOSED').length,
    };

    // 3. Hydrate basic booking info
    const bookingIds = [...new Set(rawTickets.map((t) => t.bookingId).filter(Boolean))];
    const bookingsMap = new Map();

    if (bookingIds.length > 0) {
      const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: { tour: { select: { id: true, title: true, startDate: true, destinationCountry: true, type: true } } },
      });
      bookings.forEach((b) => bookingsMap.set(b.id, b));
    }

    const tickets = rawTickets.map((ticket) => {
      const booking = ticket.bookingId ? bookingsMap.get(ticket.bookingId) : null;
      let bookingInfo = null;
      if (booking) {
        bookingInfo = {
          id: booking.id,
          tourTitle: booking.tour?.title || 'Tur',
          tourStartDate: booking.tour?.startDate || null,
          seats: booking.seats,
          totalAmount: Number(booking.totalAmount),
          paidAmount: Number(booking.paidAmount),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
        };
      }

      return {
        ...ticket,
        escalatedToAdmin: ticket.status === 'ESCALATED_TO_ADMIN',
        requestedRefund: ticket.requestedRefund ? Number(ticket.requestedRefund) : null,
        approvedRefund: ticket.approvedRefund !== null && ticket.approvedRefund !== undefined ? Number(ticket.approvedRefund) : null,
        booking: bookingInfo,
      };
    });

    return { tickets, stats };
  }

  /**
   * Get all tickets for SuperAdmin
   */
  async getAllTicketsAdmin(filters = {}) {
    const where = {};
    if (filters.status && filters.status !== 'ALL') where.status = filters.status;
    if (filters.category && filters.category !== 'ALL') where.category = filters.category;
    if (filters.priority && filters.priority !== 'ALL') where.priority = filters.priority;
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { user: { name: { contains: q } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      escalatedToAdmin: t.status === 'ESCALATED_TO_ADMIN',
      requestedRefund: t.requestedRefund ? Number(t.requestedRefund) : null,
      approvedRefund: t.approvedRefund !== null && t.approvedRefund !== undefined ? Number(t.approvedRefund) : null,
    }));
  }

  /**
   * Get ticket details with fully hydrated messages, senders, bookings and cancellation policy calculation
   */
  async getTicketDetails(ticketId, { isVendorOrAdmin = false } = {}) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        company: { select: { id: true, name: true, phoneNumber: true, email: true } },
        user: { select: { id: true, name: true, email: true, phoneNumber: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      throw new Error('Dəstək bileti tapılmadı.');
    }

    // Filter out internal notes if viewer is a standard customer
    if (!isVendorOrAdmin) {
      ticket.messages = ticket.messages.filter((m) => !m.isInternalNote);
      delete ticket.internalNotes;
    }

    // Populate sender details for each message
    ticket.messages = ticket.messages.map((m) => {
      let senderName = 'İstifadəçi';
      let roleLabel = 'Müştəri';

      if (m.senderRole === 'VENDOR') {
        senderName = ticket.company?.name || 'Tur Şirkəti (Vendor)';
        roleLabel = 'Tur Şirkəti';
      } else if (m.senderRole === 'ADMIN') {
        senderName = 'Platforma Administrasiyası (SuperAdmin)';
        roleLabel = 'SuperAdmin';
      } else if (m.senderRole === 'USER') {
        senderName = ticket.user?.name || 'Müştəri';
        roleLabel = 'Müştəri';
      }

      let parsedAttachments = [];
      if (m.attachments) {
        try {
          parsedAttachments = typeof m.attachments === 'string' ? JSON.parse(m.attachments) : m.attachments;
        } catch (e) {
          parsedAttachments = [];
        }
      }

      return {
        ...m,
        sender: {
          id: m.senderId,
          name: senderName,
          role: m.senderRole,
          roleLabel,
        },
        attachmentsList: Array.isArray(parsedAttachments) ? parsedAttachments : [],
      };
    });

    // Hydrate booking and cancellation policy recommendation if linked to a booking
    let bookingDetails = null;
    let cancellationPolicyAnalysis = null;

    if (ticket.bookingId) {
      // 1. Try Tour Booking
      const tourBooking = await prisma.booking.findUnique({
        where: { id: ticket.bookingId },
        include: {
          tour: {
            select: {
              id: true,
              title: true,
              startDate: true,
              destinationCountry: true,
              price: true,
              images: true,
            },
          },
        },
      });

      if (tourBooking) {
        bookingDetails = {
          id: tourBooking.id,
          type: 'TOUR',
          title: tourBooking.tour?.title || 'Tur Rezervasiyası',
          destination: tourBooking.tour?.destinationCountry || null,
          startDate: tourBooking.tour?.startDate || null,
          seats: tourBooking.seats,
          passengerName: `${tourBooking.passengerName} ${tourBooking.passengerSurname}`.trim(),
          contactNumber: tourBooking.contactNumber,
          contactEmail: tourBooking.contactEmail,
          totalAmount: Number(tourBooking.totalAmount),
          paidAmount: Number(tourBooking.paidAmount),
          remainingAmount: Number(tourBooking.remainingAmount),
          status: tourBooking.status,
          paymentStatus: tourBooking.paymentStatus,
          paymentType: tourBooking.paymentType,
        };

        if (tourBooking.tour?.startDate) {
          const departure = new Date(tourBooking.tour.startDate).getTime();
          const now = Date.now();
          const daysLeft = Math.ceil((departure - now) / (1000 * 3600 * 24));
          const totalPaid = Number(tourBooking.paidAmount || tourBooking.totalAmount || 0);

          let refundPercent = 0;
          let policyExplanation = '';

          if (daysLeft >= 7) {
            refundPercent = 100;
            policyExplanation = 'Səfərə 7 və daha çox gün qaldığı üçün qaydalara əsasən 100% tam geri qaytarılma tətbiq olunur.';
          } else if (daysLeft >= 3) {
            refundPercent = 70;
            policyExplanation = 'Səfərə 3-7 gün qaldığı üçün qaydalara əsasən 30% cərimə tutulur, 70% geri qaytarılma tətbiq olunur.';
          } else {
            refundPercent = 0;
            policyExplanation = 'Səfərə 3 gündən az vaxt qaldığı üçün rəsmi qaydalara əsasən vəsait geri qaytarılmır (0%).';
          }

          const recommendedAmount = Math.round((totalPaid * (refundPercent / 100)) * 100) / 100;

          cancellationPolicyAnalysis = {
            daysLeft,
            refundPercent,
            totalPaid,
            recommendedAmount,
            policyExplanation,
            policyTier: daysLeft >= 7 ? 'FULL_REFUND' : daysLeft >= 3 ? 'PARTIAL_REFUND' : 'NO_REFUND',
          };
        }
      } else {
        // 2. Try Hotel Booking
        const hotelBooking = await prisma.hotelBooking.findUnique({
          where: { id: ticket.bookingId },
          include: {
            hotel: { select: { id: true, name: true, city: true } },
            room: { select: { id: true, name: true, roomType: true } },
          },
        });

        if (hotelBooking) {
          bookingDetails = {
            id: hotelBooking.id,
            type: 'HOTEL',
            title: `${hotelBooking.hotel?.name || 'Otel'} - ${hotelBooking.room?.name || 'Otaq'}`,
            destination: hotelBooking.hotel?.city || null,
            startDate: hotelBooking.checkInDate || null,
            endDate: hotelBooking.checkOutDate || null,
            guestName: hotelBooking.guestName,
            contactNumber: hotelBooking.guestPhone,
            totalAmount: Number(hotelBooking.totalAmount),
            paidAmount: Number(hotelBooking.paidAmount || hotelBooking.totalAmount),
            status: hotelBooking.status,
            paymentStatus: hotelBooking.paymentStatus,
          };
        }
      }
    }

    let parsedAttachments = [];
    if (ticket.attachments) {
      try {
        parsedAttachments = typeof ticket.attachments === 'string' ? JSON.parse(ticket.attachments) : ticket.attachments;
      } catch (e) {
        parsedAttachments = [];
      }
    }

    return {
      ...ticket,
      escalatedToAdmin: ticket.status === 'ESCALATED_TO_ADMIN',
      requestedRefund: ticket.requestedRefund ? Number(ticket.requestedRefund) : null,
      approvedRefund: ticket.approvedRefund !== null && ticket.approvedRefund !== undefined ? Number(ticket.approvedRefund) : null,
      attachmentsList: Array.isArray(parsedAttachments) ? parsedAttachments : [],
      booking: bookingDetails,
      cancellationPolicyAnalysis,
    };
  }

  /**
   * Reply to a ticket thread
   */
  async replyTicket(ticketId, {
    senderId,
    senderRole = 'USER',
    message,
    isInternalNote = false,
    attachments = null,
  }) {
    if (!message || !message.trim()) {
      throw new Error('Cavab mətni daxil edilməlidir.');
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('Bilet tapılmadı.');
    }

    const messageId = 'TM-' + Math.floor(100000 + Math.random() * 900000);
    const attachmentsJson = attachments ? (typeof attachments === 'string' ? attachments : JSON.stringify(attachments)) : null;

    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        id: messageId,
        ticketId,
        senderId,
        senderRole,
        message: message.trim(),
        attachments: attachmentsJson,
        isInternalNote: Boolean(isInternalNote),
      },
    });

    // Update ticket status dynamically
    let nextStatus = ticket.status;
    if (!isInternalNote) {
      if (senderRole === 'VENDOR' || senderRole === 'ADMIN') {
        nextStatus = 'WAITING_CUSTOMER';
      } else if (senderRole === 'USER' && ticket.status === 'WAITING_CUSTOMER') {
        nextStatus = 'IN_PROGRESS';
      }
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: nextStatus,
        updatedAt: new Date(),
      },
    });

    const updatedTicket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    notificationsService.broadcastTicketReply(ticketId, ticketMessage, updatedTicket);

    return ticketMessage;
  }

  /**
   * Update status, priority or resolution of a ticket
   */
  async updateTicketStatus(ticketId, {
    status,
    priority,
    resolutionReason,
    approvedRefund,
    internalNotes,
  }) {
    const data = {};
    if (status) data.status = status;
    if (priority) data.priority = priority;
    if (resolutionReason) data.resolutionReason = resolutionReason;
    if (approvedRefund !== undefined) data.approvedRefund = approvedRefund !== null && approvedRefund !== '' ? Number(approvedRefund) : null;
    if (internalNotes) data.internalNotes = internalNotes;

    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

    const full = await this.getTicketDetails(ticketId, { isVendorOrAdmin: true });
    notificationsService.broadcastTicketStatusChange(ticketId, full);

    return full;
  }

  /**
   * Escalate dispute to SuperAdmin
   */
  async escalateToAdmin(ticketId, reason) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'ESCALATED_TO_ADMIN',
        priority: 'URGENT',
        internalNotes: reason ? `[Eskalasiya Səbəbi]: ${reason}` : undefined,
      },
    });

    // Create system audit message in thread
    const messageId = 'TM-' + Math.floor(100000 + Math.random() * 900000);
    await prisma.ticketMessage.create({
      data: {
        id: messageId,
        ticketId,
        senderId: 'SYSTEM',
        senderRole: 'ADMIN',
        message: `[ARBITRAJ]: Bu bilet platforma SuperAdmin heyətinə yönləndirildi. Əsaslandırma: ${reason || 'Müştəri və tərəfdaş arasında razılaşma əldə edilmədi.'}`,
        isInternalNote: false,
      },
    });

    const full = await this.getTicketDetails(ticketId, { isVendorOrAdmin: true });
    notificationsService.broadcastTicketStatusChange(ticketId, full);

    return full;
  }
}

export const ticketsService = new TicketsService();
export default ticketsService;
