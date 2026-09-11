import prisma from '../../config/db.js';
import { generateUniqueId } from '../../utils/id-generator.js';
import { generateExcel } from '../../utils/excel-generator.js';
import ApiError from '../../core/api.error.js';
import cacheService from '../../utils/cache.js';

class ToursService {
  calculateDynamicPrice(tour, soldSeats) {
    const basePrice = Number(tour.price);
    const now = new Date();
    const startDate = new Date(tour.startDate);
    const diffMs = startDate - now;
    const daysLeft = diffMs / (1000 * 60 * 60 * 24);

    // 1. Erkən rezervasiya endirimi (Tura 30 gün və ya daha çox qalıbsa 20% endirim)
    if (daysLeft >= 30) {
      return Math.round(basePrice * 0.8 * 100) / 100;
    }

    // 2. Surge pricing: Tura 3 gün və ya daha az qalıbsa VƏ turun 90%-dən çoxu dolubsa 30% qiymət artırılır
    const occupancyPercent = tour.maxParticipants > 0 ? (soldSeats / tour.maxParticipants) * 100 : 0;
    if (daysLeft <= 3 && daysLeft >= 0 && occupancyPercent >= 90) {
      return Math.round(basePrice * 1.3 * 100) / 100;
    }

    return basePrice;
  }

  async getAll(filters = {}, companyId = null) {
    const cacheKey = `tours_all_${JSON.stringify(filters)}_${companyId || 'all'}`;
    const cached = cacheService.get(cacheKey);
    if (cached) return cached;

    const { search, status, type } = filters;

    const where = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { id: { contains: search } }
      ];
    }

    const tours = await prisma.tour.findMany({
      where,
      include: {
        regions: true,
        bookings: {
          where: { status: 'CONFIRMED' }
        },
        company: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = tours.map((tour) => {
      const soldSeats = tour.bookings?.reduce((sum, b) => sum + b.seats, 0) || 0;
      const dynamicPrice = this.calculateDynamicPrice(tour, soldSeats);
      return this._formatTourForClient(tour, soldSeats, dynamicPrice);
    });

    cacheService.set(cacheKey, result, 300); // 5 dəqiqəlik keş
    return result;
  }

  _formatTourForClient(tour, soldSeats = 0, dynamicPrice = null) {
    const { bookings, ...tourData } = tour;

    let parsedImages = [];
    try {
      parsedImages = typeof tour.images === 'string' ? JSON.parse(tour.images) : (Array.isArray(tour.images) ? tour.images : []);
    } catch {
      parsedImages = tour.images ? [tour.images] : [];
    }

    let parsedInclusions = [];
    try {
      parsedInclusions = typeof tour.includedServices === 'string' ? JSON.parse(tour.includedServices) : (Array.isArray(tour.includedServices) ? tour.includedServices : []);
    } catch {
      parsedInclusions = [];
    }

    let parsedExclusions = [];
    try {
      parsedExclusions = typeof tour.excludedServices === 'string' ? JSON.parse(tour.excludedServices) : (Array.isArray(tour.excludedServices) ? tour.excludedServices : []);
    } catch {
      parsedExclusions = [];
    }

    let parsedItinerary = [];
    try {
      parsedItinerary = typeof tour.itinerary === 'string' ? JSON.parse(tour.itinerary) : (Array.isArray(tour.itinerary) ? tour.itinerary : []);
    } catch {
      parsedItinerary = [];
    }

    const primaryRegion = tour.regions?.[0]?.name || tour.hotelName || 'Qarabağ';
    const capacity = tour.busCapacity || tour.maxParticipants || 48;
    const availableSeats = Math.max(0, capacity - soldSeats);
    const numericPrice = parseFloat(tour.price) || 0;

    return {
      ...tourData,
      price: numericPrice,
      basePrice: numericPrice,
      capacity,
      maxParticipants: capacity,
      availableSeats,
      soldSeats,
      dynamicPrice: dynamicPrice || numericPrice,
      meetingPoint: tour.meetingPointAddress || '',
      region: primaryRegion,
      images: parsedImages,
      inclusions: parsedInclusions,
      exclusions: parsedExclusions,
      itinerary: parsedItinerary,
      status: (tour.status || 'Active').toUpperCase(),
      hotelName: tour.hotelName || '',
      hotelCategory: tour.hotelCategory || '',
      flightIncluded: !!tour.flightIncluded,
      passportVisaRequired: !!tour.passportVisaRequired,
      hasFlight: !!tour.flightIncluded,
      hasVisaSupport: !!tour.passportVisaRequired,
      companyName: tour.company?.name || ''
    };
  }

  async getById(id) {
    const tour = await prisma.tour.update({
      where: { id },
      data: {
        viewCount: { increment: 1 }
      },
      include: {
        regions: true,
        bookings: {
          where: { status: 'CONFIRMED' }
        },
        company: true
      }
    });

    const soldSeats = tour.bookings?.reduce((sum, b) => sum + b.seats, 0) || 0;
    const dynamicPrice = this.calculateDynamicPrice(tour, soldSeats);
    return this._formatTourForClient(tour, soldSeats, dynamicPrice);
  }

  async create(data, companyId) {
    const id = await generateUniqueId('T', 'tour');

    const tourData = {
      id,
      companyId,
      type: data.type,
      title: data.title,
      description: data.description || '',
      phoneNumber: data.phoneNumber || '',
      email: data.email || '',
      images: JSON.stringify(Array.isArray(data.images) ? data.images : (data.images ? [data.images] : [])),
      minParticipants: parseInt(data.minParticipants || 1, 10),
      maxParticipants: parseInt(data.maxParticipants || data.capacity || 40, 10),
      startDate: new Date(data.startDate),
      includedServices: JSON.stringify(data.includedServices || data.inclusions || []),
      excludedServices: JSON.stringify(data.excludedServices || data.exclusions || []),
      itinerary: JSON.stringify(data.itinerary || []),
      status: data.status || 'Active',
      price: parseFloat(data.price !== undefined ? data.price : (data.basePrice || 0)),
      currency: data.currency || 'AZN',
      hotelName: data.hotelName || data.destinationCountry || null,
      hotelCategory: data.hotelCategory || null
    };

    if (data.type === 'DOMESTIC') {
      tourData.transportType = data.transportType || data.busType || 'BUS';
      tourData.busCapacity = data.busCapacity ? parseInt(data.busCapacity, 10) : (data.capacity ? parseInt(data.capacity, 10) : null);
      tourData.meetingPointAddress = data.meetingPointAddress || data.meetingPoint || 'Gənclik m/s';
      tourData.meetingPointLat = data.meetingPointLat ? parseFloat(data.meetingPointLat) : null;
      tourData.meetingPointLng = data.meetingPointLng ? parseFloat(data.meetingPointLng) : null;
    } else if (data.type === 'FOREIGN') {
      tourData.flightIncluded = !!(data.flightIncluded ?? data.hasFlight);
      tourData.passportVisaRequired = !!(data.passportVisaRequired ?? data.hasVisaSupport);
      tourData.hotelName = data.hotelName || data.destinationCountry || 'Standart Otel';
      tourData.hotelCategory = data.hotelCategory || '4*';
      tourData.meetingPointAddress = data.meetingPointAddress || data.meetingPoint || 'Heydər Əliyev Beynəlxalq Hava Limanı';
    }

    await prisma.tour.create({
      data: tourData
    });

    if (data.type === 'DOMESTIC' && data.regions && Array.isArray(data.regions)) {
      await prisma.tourRegion.createMany({
        data: data.regions.map((regionName) => ({
          tourId: id,
          name: regionName
        }))
      });
    }

    cacheService.clear();
    return this.getById(id);
  }

  async update(id, data, companyId = null) {
    const tour = await prisma.tour.findUnique({ where: { id } });
    if (!tour) return null;
    if (companyId && tour.companyId !== companyId) return null;

    const priceVal = data.price !== undefined ? data.price : data.basePrice;
    const maxPartVal = data.maxParticipants !== undefined ? data.maxParticipants : data.capacity;
    const meetingPointVal = data.meetingPointAddress !== undefined ? data.meetingPointAddress : data.meetingPoint;
    const flightVal = data.flightIncluded !== undefined ? data.flightIncluded : data.hasFlight;
    const visaVal = data.passportVisaRequired !== undefined ? data.passportVisaRequired : data.hasVisaSupport;

    const tourData = {
      title: data.title,
      description: data.description,
      phoneNumber: data.phoneNumber,
      email: data.email,
      images: data.images ? JSON.stringify(Array.isArray(data.images) ? data.images : [data.images]) : undefined,
      minParticipants: data.minParticipants ? parseInt(data.minParticipants, 10) : undefined,
      maxParticipants: maxPartVal ? parseInt(maxPartVal, 10) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      includedServices: data.includedServices ? JSON.stringify(data.includedServices) : (data.inclusions ? JSON.stringify(data.inclusions) : undefined),
      excludedServices: data.excludedServices ? JSON.stringify(data.excludedServices) : (data.exclusions ? JSON.stringify(data.exclusions) : undefined),
      itinerary: data.itinerary ? JSON.stringify(data.itinerary) : undefined,
      status: data.status,
      price: priceVal !== undefined ? parseFloat(priceVal) : undefined,
      currency: data.currency,
      hotelName: data.hotelName !== undefined ? data.hotelName : (data.destinationCountry || undefined),
      hotelCategory: data.hotelCategory !== undefined ? data.hotelCategory : undefined
    };

    if (tour.type === 'DOMESTIC') {
      tourData.transportType = data.transportType || data.busType || undefined;
      tourData.busCapacity = data.busCapacity ? parseInt(data.busCapacity, 10) : (data.capacity ? parseInt(data.capacity, 10) : undefined);
      tourData.meetingPointAddress = meetingPointVal;
      tourData.meetingPointLat = data.meetingPointLat ? parseFloat(data.meetingPointLat) : undefined;
      tourData.meetingPointLng = data.meetingPointLng ? parseFloat(data.meetingPointLng) : undefined;
    } else if (tour.type === 'FOREIGN') {
      tourData.flightIncluded = flightVal !== undefined ? !!flightVal : undefined;
      tourData.passportVisaRequired = visaVal !== undefined ? !!visaVal : undefined;
      tourData.meetingPointAddress = meetingPointVal || 'Heydər Əliyev Beynəlxalq Hava Limanı';
    }

    await prisma.tour.update({
      where: { id },
      data: tourData
    });

    if (tour.type === 'DOMESTIC' && data.regions && Array.isArray(data.regions)) {
      await prisma.tourRegion.deleteMany({ where: { tourId: id } });
      await prisma.tourRegion.createMany({
        data: data.regions.map((regionName) => ({
          tourId: id,
          name: regionName
        }))
      });
    }

    cacheService.clear();
    return this.getById(id);
  }

  async delete(id, companyId = null) {
    const tour = await prisma.tour.findUnique({ where: { id } });
    if (!tour) return false;
    if (companyId && tour.companyId !== companyId) return false;

    cacheService.clear();
    await prisma.tour.delete({ where: { id } });
    return true;
  }

  // --- WAITING LIST (Gözləmə Siyahısı) MƏNTİQİ ---
  async joinWaitingList(tourId, userId) {
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      include: { bookings: { where: { status: 'CONFIRMED' } } }
    });

    if (!tour) throw ApiError.notFound('Tur tapılmadı.');

    const soldSeats = tour.bookings.reduce((sum, b) => sum + b.seats, 0);
    if (soldSeats < tour.maxParticipants) {
      throw ApiError.badRequest('Bu turda hələ də boş yerlər var. Gözləmə siyahısına yazılmağa ehtiyac yoxdur.');
    }

    const alreadyJoined = await prisma.waitingList.findFirst({
      where: { tourId, userId }
    });

    if (alreadyJoined) {
      throw ApiError.badRequest('Siz artıq bu turun gözləmə siyahısındasınız.');
    }

    const id = await generateUniqueId('W', 'waitingList');
    return prisma.waitingList.create({
      data: {
        id,
        tourId,
        userId
      },
      include: { user: true }
    });
  }

  async getWaitingList(tourId, companyId = null) {
    const tour = await prisma.tour.findUnique({ where: { id: tourId } });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');
    if (companyId && tour.companyId !== companyId) {
      throw ApiError.forbidden('Bu turun gözləmə siyahısına baxmaq üçün icazəniz yoxdur.');
    }

    return prisma.waitingList.findMany({
      where: { tourId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
  }

  async leaveWaitingList(tourId, userId) {
    const record = await prisma.waitingList.findFirst({
      where: { tourId, userId }
    });

    if (!record) {
      throw ApiError.notFound('Gözləmə siyahısında belə bir qeyd tapılmadı.');
    }

    await prisma.waitingList.delete({
      where: { id: record.id }
    });

    return { success: true };
  }

  // Vendor Satış Performansı
  async getPerformanceStats(companyId) {
    const tours = await prisma.tour.findMany({
      where: { companyId },
      include: {
        bookings: {
          where: { status: 'CONFIRMED' }
        }
      }
    });

    return tours.map((tour) => {
      const soldSeats = tour.bookings.reduce((sum, b) => sum + b.seats, 0);
      const remainingSeats = tour.maxParticipants - soldSeats;
      const occupancyRate = tour.maxParticipants > 0 ? (soldSeats / tour.maxParticipants) * 100 : 0;
      const totalEarnings = tour.bookings.reduce((sum, b) => sum + b.paidAmount, 0);

      return {
        tourId: tour.id,
        title: tour.title,
        price: tour.price,
        totalEarnings,
        soldSeats,
        remainingSeats,
        occupancyRate: `${occupancyRate.toFixed(2)}%`,
        viewCount: tour.viewCount,
        favoriteCount: tour.favoriteCount,
        passengers: tour.bookings.map((b) => ({
          bookingId: b.id,
          passengerName: `${b.passengerName} ${b.passengerSurname}`,
          seats: b.seats,
          contactNumber: b.contactNumber,
          contactEmail: b.contactEmail,
          paymentStatus: b.paymentStatus
        }))
      };
    });
  }

  async exportToursToExcel(filters = {}, companyId = null) {
    const tours = await this.getAll(filters, companyId);

    const columns = [
      { header: 'Tur ID', key: 'id', width: 15 },
      { header: 'Turun Adı', key: 'title', width: 25 },
      { header: 'Növü', key: 'type', width: 12 },
      { header: 'Qiymət', key: 'price', width: 12 },
      { header: 'Başlama Tarixi', key: 'startDate', width: 15 },
      { header: 'Maks. Yer', key: 'maxParticipants', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Baxış Sayı', key: 'viewCount', width: 12 },
      { header: 'Favorit Sayı', key: 'favoriteCount', width: 12 }
    ];

    const formattedData = tours.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type === 'DOMESTIC' ? 'Daxili' : 'Xarici',
      price: `${t.price} ${t.currency}`,
      startDate: t.startDate.toISOString().split('T')[0],
      maxParticipants: t.maxParticipants,
      status: t.status,
      viewCount: t.viewCount,
      favoriteCount: t.favoriteCount
    }));

    return generateExcel(formattedData, columns, 'Turlar');
  }
}

export const toursService = new ToursService();
export default toursService;
