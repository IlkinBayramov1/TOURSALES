import prisma from '../../config/db.js';
import { notificationsService } from '../notifications/notifications.service.js';

// Attraction pricing catalog in AZN per person (or per group where noted)
const ATTRACTION_PRICES = {
  'Tufandağ Kanat': 22,
  'Şahdağ Roller Coaster': 25,
  'Şəki Xan Sarayı': 9,
  'Qəbələ Atçılıq': 20,
  'Nohurgöl Qayıq': 15,
  'Atəşgah & Yanardağ': 18,
  'Qəbələnd Əyləncə': 16,
  'Qobustan Qoruğu': 10,
  'Lənkəran Çay Plantasiyası': 12,
  'Şuşa Cıdır Düzü Ekskursiyası': 25,
};

export const customToursService = {
  /**
   * Real-time Price Estimation Calculator
   */
  calculateEstimate: async (payload) => {
    const {
      startDate,
      endDate,
      adultsCount = 2,
      childrenCount = 0,
      vehicleType = 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference = 'HOTEL_4_STAR',
      mealPreference = 'BREAKFAST_ONLY',
      guideRequired = false,
      guideLanguage = 'AZ',
      attractions = [],
    } = payload;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const nights = Math.max(0, durationDays - 1);
    const totalPassengers = Math.max(1, Number(adultsCount) + Number(childrenCount));
    const roomsCount = Math.max(1, Math.ceil((Number(adultsCount) + Math.ceil(Number(childrenCount) / 2)) / 2));

    // 1. Vehicle Daily Rate
    let vehicleDaily = 150;
    switch (vehicleType) {
      case 'SEDAN_4':
        vehicleDaily = 80;
        break;
      case 'MINIVAN_MERCEDES_VITO_7':
        vehicleDaily = 150;
        break;
      case 'MINIBUS_MERCEDES_SPRINTER_18':
        vehicleDaily = 240;
        break;
      case 'BUS_NEOPLAN_50':
        vehicleDaily = 520;
        break;
      case 'OWN_TRANSPORT':
        vehicleDaily = 0;
        break;
      default:
        vehicleDaily = 150;
    }
    const vehicleCost = vehicleDaily * durationDays;

    // 2. Hotel Cost
    let roomNightRate = 130;
    switch (hotelPreference) {
      case 'NONE':
        roomNightRate = 0;
        break;
      case 'HOTEL_3_STAR':
        roomNightRate = 75;
        break;
      case 'HOTEL_4_STAR':
        roomNightRate = 135;
        break;
      case 'HOTEL_5_STAR':
        roomNightRate = 250;
        break;
      case 'COTTAGES':
        roomNightRate = 190;
        break;
      case 'BOUTIQUE':
        roomNightRate = 150;
        break;
      default:
        roomNightRate = 135;
    }
    const hotelCost = roomNightRate * roomsCount * nights;

    // 3. Meal Plan Cost
    let mealCostPerPersonPerDay = 0;
    switch (mealPreference) {
      case 'NONE':
      case 'BREAKFAST_ONLY':
        mealCostPerPersonPerDay = 0; // Included in hotel
        break;
      case 'HALF_BOARD':
        mealCostPerPersonPerDay = 25;
        break;
      case 'FULL_BOARD':
        mealCostPerPersonPerDay = 45;
        break;
      case 'CORPORATE_BANQUET':
        mealCostPerPersonPerDay = 65;
        break;
      default:
        mealCostPerPersonPerDay = 0;
    }
    const mealCost = mealCostPerPersonPerDay * totalPassengers * durationDays;

    // 4. Guide Cost
    let guideCost = 0;
    if (guideRequired) {
      const isForeignLang = ['EN', 'RU', 'AR', 'TR'].includes(guideLanguage);
      const guideDaily = isForeignLang ? 110 : 80;
      guideCost = guideDaily * durationDays;
    }

    // 5. Attractions Cost
    let attractionsCost = 0;
    const attractionList = Array.isArray(attractions)
      ? attractions
      : typeof attractions === 'string'
      ? JSON.parse(attractions || '[]')
      : [];

    for (const attr of attractionList) {
      const unitPrice = ATTRACTION_PRICES[attr] || 15;
      attractionsCost += unitPrice * totalPassengers;
    }

    // Subtotal and ranges
    const subtotal = vehicleCost + hotelCost + mealCost + guideCost + attractionsCost;
    const minEstimated = Math.round(subtotal * 0.9);
    const maxEstimated = Math.round(subtotal * 1.15);

    return {
      durationDays,
      nights,
      totalPassengers,
      roomsCount,
      estimatedMin: minEstimated,
      estimatedMax: maxEstimated,
      currency: 'AZN',
      breakdown: {
        vehicle: vehicleCost,
        hotel: hotelCost,
        meal: mealCost,
        guide: guideCost,
        attractions: attractionsCost,
      },
    };
  },

  /**
   * Create Custom Tour Request by Customer
   */
  createCustomRequest: async (userId, payload) => {
    const {
      type = 'FAMILY',
      title,
      destinations = [],
      startDate,
      endDate,
      adultsCount = 2,
      childrenCount = 0,
      vehicleType = 'MINIVAN_MERCEDES_VITO_7',
      hotelPreference = 'HOTEL_4_STAR',
      mealPreference = 'BREAKFAST_ONLY',
      guideRequired = false,
      guideLanguage = 'AZ',
      attractions = [],
      budgetMin,
      budgetMax,
      specialNotes,
      expiresHours = 48,
    } = payload;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const durationDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalPassengers = Number(adultsCount) + Number(childrenCount);

    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const requestNumber = `CTR-${randomSix}`;
    const expiresAt = new Date(Date.now() + Number(expiresHours) * 60 * 60 * 1000);

    const record = await prisma.customTourRequest.create({
      data: {
        id: `CTR-${randomSix}`,
        requestNumber,
        userId,
        type,
        title: title || `${destinations[0] || 'Azərbaycan'} Fərdi Tur`,
        destinations: JSON.stringify(destinations),
        startDate: start,
        endDate: end,
        durationDays,
        adultsCount: Number(adultsCount),
        childrenCount: Number(childrenCount),
        totalPassengers,
        vehicleType,
        hotelPreference,
        mealPreference,
        guideRequired: Boolean(guideRequired),
        guideLanguage,
        attractions: JSON.stringify(attractions),
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        specialNotes,
        status: 'OPEN_FOR_BIDS',
        expiresAt,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
      },
    });

    console.log(
      `[Notification Simulator] Tərəfdaş agentliklərə yeni fərdi tur elanı göndərildi: ${requestNumber} - "${record.title}"`
    );

    // Real-vaxt WebSocket vasitəsilə bütün tərəfdaşlara elan yayımlanır
    try {
      notificationsService.broadcastTenderNewRequest(record);
    } catch (e) {
      console.warn('Tender WebSocket emit warning:', e.message);
    }

    return record;
  },

  /**
   * Customer: Get my requests
   */
  getMyRequests: async (userId) => {
    const requests = await prisma.customTourRequest.findMany({
      where: { userId },
      include: {
        bids: {
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, rating: true, phoneNumber: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      ...r,
      destinations: JSON.parse(r.destinations || '[]'),
      attractions: JSON.parse(r.attractions || '[]'),
    }));
  },

  /**
   * Get single request details
   */
  getRequestDetails: async (requestId, currentUserId = null) => {
    const request = await prisma.customTourRequest.findUnique({
      where: { id: requestId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phoneNumber: true },
        },
        bids: {
          include: {
            company: {
              select: { id: true, name: true, logoUrl: true, rating: true, phoneNumber: true },
            },
          },
          orderBy: { offeredPrice: 'asc' },
        },
        booking: true,
      },
    });

    if (!request) return null;

    return {
      ...request,
      destinations: JSON.parse(request.destinations || '[]'),
      attractions: JSON.parse(request.attractions || '[]'),
      bids: request.bids.map((b) => ({
        ...b,
        includedServices: JSON.parse(b.includedServices || '[]'),
        excludedServices: JSON.parse(b.excludedServices || '[]'),
      })),
    };
  },

  /**
   * Customer: Cancel request
   */
  cancelRequest: async (requestId, userId) => {
    const existing = await prisma.customTourRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing || existing.userId !== userId) {
      throw new Error('Sorğu tapılmadı və ya sizə aid deyil.');
    }

    if (existing.status === 'PAID_CONFIRMED' || existing.status === 'COMPLETED') {
      throw new Error('Artıq təsdiqlənmiş və ödənilmiş sorğu ləğv edilə bilməz.');
    }

    return await prisma.customTourRequest.update({
      where: { id: requestId },
      data: { status: 'CANCELLED' },
    });
  },

  /**
   * Vendor: Get Tender Board (Open requests for agencies)
   */
  getTenderBoard: async (companyId, filters = {}) => {
    const { destination, vehicleType, status } = filters;

    const where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    } else if (!status || status === 'OPEN_FOR_BIDS') {
      where.status = { in: ['OPEN_FOR_BIDS', 'BIDS_REVIEW'] };
    }

    if (vehicleType && vehicleType !== 'ALL') {
      where.vehicleType = vehicleType;
    }

    const requests = await prisma.customTourRequest.findMany({
      where,
      include: {
        user: {
          select: { name: true, phoneNumber: true, email: true },
        },
        bids: {
          where: companyId ? { companyId } : undefined,
          select: { id: true, bidNumber: true, offeredPrice: true, status: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Client-side or array filter for destination in JSON text or title
    let filtered = requests;
    if (destination && destination.trim()) {
      const q = destination.toLowerCase();
      filtered = requests.filter((r) => {
        const destStr = typeof r.destinations === 'string' ? r.destinations : JSON.stringify(r.destinations || []);
        const titleStr = r.title || '';
        return destStr.toLowerCase().includes(q) || titleStr.toLowerCase().includes(q);
      });
    }

    return filtered.map((r) => ({
      ...r,
      budget: Number(r.budget),
      destinations: typeof r.destinations === 'string' ? JSON.parse(r.destinations || '[]') : (r.destinations || []),
      attractions: typeof r.attractions === 'string' ? JSON.parse(r.attractions || '[]') : (r.attractions || []),
      hasMyBid: Boolean(r.bids && r.bids.length > 0),
      myBid: r.bids && r.bids.length > 0 ? {
        ...r.bids[0],
        offeredPrice: Number(r.bids[0].offeredPrice)
      } : null,
    }));
  },

  /**
   * Vendor: Get Tender Stats KPI
   */
  getVendorTenderStats: async (companyId) => {
    const totalOpenTenders = await prisma.customTourRequest.count({
      where: { status: { in: ['OPEN_FOR_BIDS', 'BIDS_REVIEW'] } }
    });

    let mySubmittedBids = 0;
    let myWonBids = 0;
    let myPendingBids = 0;
    let myRejectedBids = 0;
    let totalWonAmount = 0;

    if (companyId) {
      const bids = await prisma.customTourBid.findMany({
        where: { companyId },
        select: { status: true, offeredPrice: true, request: { select: { status: true } } }
      });

      mySubmittedBids = bids.length;
      bids.forEach(b => {
        if (b.status === 'ACCEPTED' || b.request?.status === 'PAID_CONFIRMED' || b.request?.status === 'ACCEPTED') {
          myWonBids++;
          totalWonAmount += Number(b.offeredPrice) || 0;
        } else if (b.status === 'PENDING') {
          myPendingBids++;
        } else if (b.status === 'REJECTED') {
          myRejectedBids++;
        }
      });
    }

    return {
      totalOpenTenders,
      mySubmittedBids,
      myWonBids,
      myPendingBids,
      myRejectedBids,
      totalWonAmount
    };
  },

  /**
   * Vendor: Update a submitted pending bid
   */
  updateBid: async (companyId, bidId, payload) => {
    const bid = await prisma.customTourBid.findUnique({
      where: { id: bidId },
      include: { request: true }
    });

    if (!bid) {
      throw new Error('Təklif tapılmadı.');
    }

    if (bid.companyId !== companyId) {
      throw new Error('Bu təklifi redaktə etməyə icazəniz yoxdur.');
    }

    if (bid.status !== 'PENDING') {
      throw new Error('Yalnız müştəri baxışında olan (gözləmədəki) təkliflər redaktə edilə bilər.');
    }

    const {
      offeredPrice,
      itineraryProgram,
      includedServices,
      excludedServices,
      vehicleDetails,
      hotelDetails,
      vendorNotes,
      validDays
    } = payload;

    const dataToUpdate = {};
    if (offeredPrice !== undefined) {
      const p = Number(offeredPrice);
      dataToUpdate.offeredPrice = p;
      dataToUpdate.pricePerPerson = bid.request?.totalPassengers > 0 ? p / bid.request.totalPassengers : p;
    }
    if (itineraryProgram !== undefined) dataToUpdate.itineraryProgram = itineraryProgram;
    if (includedServices !== undefined) dataToUpdate.includedServices = JSON.stringify(includedServices);
    if (excludedServices !== undefined) dataToUpdate.excludedServices = JSON.stringify(excludedServices);
    if (vehicleDetails !== undefined) dataToUpdate.vehicleDetails = vehicleDetails;
    if (hotelDetails !== undefined) dataToUpdate.hotelDetails = hotelDetails;
    if (vendorNotes !== undefined) dataToUpdate.vendorNotes = vendorNotes;
    if (validDays !== undefined) {
      dataToUpdate.validUntil = new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000);
    }

    const updated = await prisma.customTourBid.update({
      where: { id: bidId },
      data: dataToUpdate,
      include: {
        company: { select: { id: true, name: true, logoUrl: true, rating: true, phoneNumber: true } }
      }
    });

    return {
      ...updated,
      offeredPrice: Number(updated.offeredPrice),
      pricePerPerson: Number(updated.pricePerPerson),
      includedServices: JSON.parse(updated.includedServices || '[]'),
      excludedServices: JSON.parse(updated.excludedServices || '[]'),
    };
  },

  /**
   * Vendor: Withdraw a submitted pending bid
   */
  withdrawBid: async (companyId, bidId) => {
    const bid = await prisma.customTourBid.findUnique({
      where: { id: bidId }
    });

    if (!bid) {
      throw new Error('Təklif tapılmadı.');
    }

    if (bid.companyId !== companyId) {
      throw new Error('Bu təklifi geri çəkməyə icazəniz yoxdur.');
    }

    if (bid.status !== 'PENDING') {
      throw new Error('Artıq qəbul edilmiş və ya baxılmış təklifi geri çəkmək mümkün deyil.');
    }

    await prisma.customTourBid.delete({
      where: { id: bidId }
    });

    // Update request bidsCount
    const req = await prisma.customTourRequest.findUnique({
      where: { id: bid.requestId },
      include: { bids: true }
    });

    if (req) {
      const remainingCount = req.bids.length;
      await prisma.customTourRequest.update({
        where: { id: bid.requestId },
        data: {
          bidsCount: remainingCount,
          status: remainingCount === 0 ? 'OPEN_FOR_BIDS' : req.status
        }
      });
    }

    return { success: true, message: 'Təklifiniz uğurla geri çəkildi.' };
  },

  /**
   * Vendor: Submit Bid for a Request
   */
  submitBid: async (companyId, requestId, payload) => {
    const request = await prisma.customTourRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Sorğu tapılmadı.');
    }

    if (request.status !== 'OPEN_FOR_BIDS' && request.status !== 'BIDS_REVIEW') {
      throw new Error('Bu tender artıq təklif qəbulu üçün açıq deyil.');
    }

    const {
      offeredPrice,
      itineraryProgram,
      includedServices = [],
      excludedServices = [],
      vehicleDetails,
      hotelDetails,
      vendorNotes,
      validDays = 3,
    } = payload;

    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const bidNumber = `BID-${randomSix}`;
    const priceNum = Number(offeredPrice);
    const pricePerPerson = request.totalPassengers > 0 ? priceNum / request.totalPassengers : priceNum;
    const validUntil = new Date(Date.now() + Number(validDays) * 24 * 60 * 60 * 1000);

    const bid = await prisma.customTourBid.create({
      data: {
        id: `BID-${randomSix}`,
        bidNumber,
        requestId,
        companyId,
        offeredPrice: priceNum,
        pricePerPerson,
        itineraryProgram: itineraryProgram || 'Tur proqramı razılaşdırılacaq.',
        includedServices: JSON.stringify(includedServices),
        excludedServices: JSON.stringify(excludedServices),
        vehicleDetails,
        hotelDetails,
        vendorNotes,
        status: 'PENDING',
        validUntil,
      },
      include: {
        company: {
          select: { id: true, name: true, rating: true, logoUrl: true, phoneNumber: true },
        },
      },
    });

    // Update request: increment bidsCount and set status BIDS_REVIEW if OPEN_FOR_BIDS
    await prisma.customTourRequest.update({
      where: { id: requestId },
      data: {
        bidsCount: { increment: 1 },
        status: 'BIDS_REVIEW',
      },
    });

    console.log(
      `[Notification Simulator] Müştəriyə yeni təklif göndərildi: Sorğu ${request.requestNumber}, Təklif ${bidNumber} (${priceNum} AZN)`
    );

    return {
      ...bid,
      offeredPrice: Number(bid.offeredPrice),
      pricePerPerson: Number(bid.pricePerPerson),
      includedServices: JSON.parse(bid.includedServices || '[]'),
      excludedServices: JSON.parse(bid.excludedServices || '[]'),
    };
  },

  /**
   * Vendor: Get my submitted bids
   */
  getMyBids: async (companyId) => {
    const bids = await prisma.customTourBid.findMany({
      where: { companyId },
      include: {
        request: {
          include: {
            user: { select: { name: true, phoneNumber: true, email: true } },
          },
        },
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bids.map((b) => ({
      ...b,
      offeredPrice: Number(b.offeredPrice),
      pricePerPerson: Number(b.pricePerPerson),
      includedServices: JSON.parse(b.includedServices || '[]'),
      excludedServices: JSON.parse(b.excludedServices || '[]'),
      request: {
        ...b.request,
        budget: Number(b.request.budget),
        destinations: JSON.parse(b.request.destinations || '[]'),
        attractions: JSON.parse(b.request.attractions || '[]'),
      },
    }));
  },

  /**
   * Customer: Accept winning bid
   */
  acceptBid: async (requestId, bidId, userId) => {
    let reqId = requestId;
    if (!reqId) {
      const b = await prisma.customTourBid.findUnique({ where: { id: bidId } });
      if (b) reqId = b.requestId;
    }

    const request = await prisma.customTourRequest.findUnique({
      where: { id: reqId },
      include: { bids: true },
    });

    if (!request || request.userId !== userId) {
      throw new Error('Sorğu tapılmadı və ya sizə aid deyil.');
    }

    const selectedBid = request.bids.find((b) => b.id === bidId);
    if (!selectedBid) {
      throw new Error('Seçilmiş təklif tapılmadı.');
    }

    // Set selected bid to ACCEPTED
    await prisma.customTourBid.update({
      where: { id: bidId },
      data: { status: 'ACCEPTED' },
    });

    // Set all other bids for this request to REJECTED
    await prisma.customTourBid.updateMany({
      where: {
        requestId: reqId,
        id: { not: bidId },
      },
      data: { status: 'REJECTED' },
    });

    // Update request
    const updatedRequest = await prisma.customTourRequest.update({
      where: { id: reqId },
      data: {
        acceptedBidId: bidId,
        status: 'ACCEPTED',
      },
      include: {
        bids: {
          include: {
            company: true,
          },
        },
      },
    });

    // Real-time broadcast to vendor
    notificationsService.broadcastTenderBidAccepted({
      requestId: reqId,
      bidId,
      companyId: selectedBid.companyId,
      offeredPrice: Number(selectedBid.offeredPrice),
    });

    return updatedRequest;
  },

  /**
   * Customer / Checkout: Pay & confirm custom tour booking
   */
  checkoutBooking: async (requestId, bidId, userId, paymentPayload = {}) => {
    const { paymentType = 'FULL', installmentMonths, cardLast4 } = paymentPayload;

    let reqId = requestId;
    if (!reqId) {
      const b = await prisma.customTourBid.findUnique({ where: { id: bidId } });
      if (b) reqId = b.requestId;
    }

    const request = await prisma.customTourRequest.findUnique({
      where: { id: reqId },
    });

    const bid = await prisma.customTourBid.findUnique({
      where: { id: bidId },
      include: { company: true },
    });

    if (!request || !bid) {
      throw new Error('Sorğu və ya təklif tapılmadı.');
    }

    const total = Number(bid.offeredPrice);
    let paid = total;
    let balance = 0;
    let pStatus = 'PAID';

    if (paymentType === 'DEPOSIT_30') {
      paid = Math.round(total * 0.3 * 100) / 100;
      balance = Math.round((total - paid) * 100) / 100;
      pStatus = 'PARTIALLY_PAID';
    }

    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const bookingNumber = `CTB-${randomSix}`;
    const voucherCode = `VOUCHER-${bookingNumber}`;

    const booking = await prisma.customTourBooking.create({
      data: {
        id: `CTB-${randomSix}`,
        bookingNumber,
        requestId: reqId,
        bidId,
        userId,
        companyId: bid.companyId,
        totalAmount: total,
        paidAmount: paid,
        balanceAmount: balance,
        paymentType,
        paymentStatus: pStatus,
        voucherCode,
        status: 'CONFIRMED',
      },
    });

    // Mark request as PAID_CONFIRMED
    await prisma.customTourRequest.update({
      where: { id: reqId },
      data: { status: 'PAID_CONFIRMED' },
    });

    console.log(
      `[Notification Simulator] Müştəri və tərəfdaşa fərdi tur vəçeri göndərildi: ${bookingNumber}, Vauçer: ${voucherCode}`
    );

    return booking;
  },
};
