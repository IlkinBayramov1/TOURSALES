import ExcelJS from 'exceljs';
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

    const where = {
      deletedAt: null
    };
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

    const primaryRegion = tour.regions?.[0]?.name || tour.destinationCountry || tour.hotelName || 'Qarabağ';
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
      regions: tour.regions ? tour.regions.map(r => r.name) : [],
      destinationCountry: tour.destinationCountry || '',
      category: tour.type,
      endDate: tour.endDate || null,
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
      endDate: data.endDate ? new Date(data.endDate) : null,
      includedServices: JSON.stringify(data.includedServices || data.inclusions || []),
      excludedServices: JSON.stringify(data.excludedServices || data.exclusions || []),
      itinerary: JSON.stringify(data.itinerary || []),
      status: data.status || 'Active',
      price: parseFloat(data.price !== undefined ? data.price : (data.basePrice || 0)),
      currency: data.currency || 'AZN',
      destinationCountry: data.destinationCountry || (data.type === 'FOREIGN' ? (data.hotelName || null) : null),
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

    const regionList = Array.isArray(data.regions) ? data.regions : (data.region ? [data.region] : []);
    if (data.type === 'DOMESTIC' && regionList.length > 0) {
      await prisma.tourRegion.createMany({
        data: regionList.map((regionName) => ({
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
      endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
      includedServices: data.includedServices ? JSON.stringify(data.includedServices) : (data.inclusions ? JSON.stringify(data.inclusions) : undefined),
      excludedServices: data.excludedServices ? JSON.stringify(data.excludedServices) : (data.exclusions ? JSON.stringify(data.exclusions) : undefined),
      itinerary: data.itinerary ? JSON.stringify(data.itinerary) : undefined,
      status: data.status,
      price: priceVal !== undefined ? parseFloat(priceVal) : undefined,
      currency: data.currency,
      destinationCountry: data.destinationCountry !== undefined ? data.destinationCountry : undefined,
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

    const regionList = Array.isArray(data.regions) ? data.regions : (data.region ? [data.region] : null);
    if (tour.type === 'DOMESTIC' && regionList) {
      await prisma.tourRegion.deleteMany({ where: { tourId: id } });
      if (regionList.length > 0) {
        await prisma.tourRegion.createMany({
          data: regionList.map((regionName) => ({
            tourId: id,
            name: regionName
          }))
        });
      }
    }

    cacheService.clear();
    return this.getById(id);
  }

  async toggleStatus(id, newStatus = null, companyId = null) {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        regions: true,
        bookings: { where: { status: 'CONFIRMED' } },
        company: true
      }
    });
    if (!tour) throw ApiError.notFound('Tur tapılmadı.');
    if (companyId && tour.companyId !== companyId) {
      throw ApiError.forbidden('Bu turun statusunu dəyişmək üçün icazəniz yoxdur.');
    }

    let targetStatus = newStatus;
    if (!targetStatus) {
      targetStatus = tour.status?.toLowerCase() === 'active' ? 'Deactive' : 'Active';
    } else {
      targetStatus = targetStatus.toLowerCase() === 'active' ? 'Active' : 'Deactive';
    }

    const updated = await prisma.tour.update({
      where: { id },
      data: { status: targetStatus },
      include: {
        regions: true,
        bookings: { where: { status: 'CONFIRMED' } },
        company: true
      }
    });

    cacheService.clear();
    const soldSeats = updated.bookings?.reduce((sum, b) => sum + b.seats, 0) || 0;
    const dynamicPrice = this.calculateDynamicPrice(updated, soldSeats);
    return this._formatTourForClient(updated, soldSeats, dynamicPrice);
  }

  async delete(id, companyId = null) {
    const tour = await prisma.tour.findUnique({
      where: { id },
      include: {
        bookings: { where: { status: 'CONFIRMED' } }
      }
    });
    if (!tour) return false;
    if (companyId && tour.companyId !== companyId) return false;

    if (tour.bookings && tour.bookings.length > 0) {
      throw ApiError.badRequest('Bu tur üzrə təsdiqlənmiş sərnişin rezervasiyaları mövcuddur! Turu tam silmək əvəzinə statusunu "Deaktiv" edin.');
    }

    cacheService.clear();
    await prisma.tour.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'Deactive'
      }
    });
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

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TourSales Vendor Portal';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Turlar');

    // Sütunların tərifi və eni
    worksheet.columns = [
      { key: 'id', width: 14 },
      { key: 'title', width: 34 },
      { key: 'type', width: 16 },
      { key: 'region', width: 22 },
      { key: 'price', width: 16 },
      { key: 'startDate', width: 16 },
      { key: 'endDate', width: 16 },
      { key: 'capacity', width: 14 },
      { key: 'soldSeats', width: 14 },
      { key: 'occupancy', width: 16 },
      { key: 'status', width: 16 }
    ];

    // 1. Üst Banner / Başlıq
    worksheet.mergeCells('A1:K1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'TOURSALES — ŞİRKƏT TURLARI HESABATI';
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E3A8A' } // Tünd göy
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 36;

    // 2. Metadata Sətri (Tarix və tur sayı)
    worksheet.mergeCells('A2:K2');
    const metaCell = worksheet.getCell('A2');
    metaCell.value = `Çıxarış tarixi: ${new Date().toLocaleDateString('az-AZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}  |  Cəmi Tur: ${tours.length} ədəd`;
    metaCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: '64748B' } };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    // 3. Cədvəl Başlıq Sətri (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = [
      'Tur ID',
      'Turun Adı',
      'Növü',
      'İstiqamət / Region',
      'Qiymət (AZN)',
      'Çıxış Tarixi',
      'Dönüş Tarixi',
      'Maks. Yer',
      'Satılmış Yer',
      'Doluluq Faizi',
      'Satış Statusu'
    ];
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2563EB' } // Mavi
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'CBD5E1' } },
        bottom: { style: 'medium', color: { argb: '1E3A8A' } }
      };
    });

    // 4. Məlumat Sətirləri
    tours.forEach((t, idx) => {
      const rowIdx = idx + 4;
      const row = worksheet.getRow(rowIdx);

      const cap = t.capacity || t.maxParticipants || 48;
      const sold = t.soldSeats || 0;
      const occPercent = cap > 0 ? Math.round((sold / cap) * 100) : 0;

      let startFormatted = '-';
      if (t.startDate) {
        try {
          const d = new Date(t.startDate);
          startFormatted = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(t.startDate);
        } catch {
          startFormatted = String(t.startDate);
        }
      }

      let endFormatted = '-';
      if (t.endDate) {
        try {
          const d = new Date(t.endDate);
          endFormatted = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : String(t.endDate);
        } catch {
          endFormatted = String(t.endDate);
        }
      }

      const statusText = t.status === 'ACTIVE' ? 'Aktiv (Satışda)' : 'Deaktiv';

      row.values = [
        t.id,
        t.title,
        t.type === 'DOMESTIC' ? '🇦🇿 Daxili' : '✈️ Xarici',
        t.destinationCountry ? `${t.destinationCountry} - ${t.region}` : (t.region || '-'),
        `${t.basePrice || t.price || 0} ${t.currency || 'AZN'}`,
        startFormatted,
        endFormatted,
        cap,
        sold,
        `%${occPercent}`,
        statusText
      ];

      row.height = 22;

      // Zebra striping
      const isEven = idx % 2 === 0;
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: [1, 3, 6, 7, 8, 9, 10, 11].includes(colNumber) ? 'center' : 'left' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'F8FAFC' : 'FFFFFF' }
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'E2E8F0' } }
        };

        // Status rəngi
        if (colNumber === 11) {
          if (t.status === 'ACTIVE') {
            cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: '166534' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'DCFCE7' } };
          } else {
            cell.font = { name: 'Arial', size: 10, color: { argb: '64748B' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
          }
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

export const toursService = new ToursService();
export default toursService;
