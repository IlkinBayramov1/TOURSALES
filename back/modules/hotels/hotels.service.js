import prisma from '../../config/db.js';
import { calculateDynamicRoomRate } from '../../utils/yield-engine.js';
import crypto from 'crypto';

class HotelsService {
  /**
   * Helper to format hotel object for client
   */
  _formatHotelForClient(hotel, minPrice = null) {
    let parsedAmenities = [];
    try {
      parsedAmenities = typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : (hotel.amenities || []);
    } catch {
      parsedAmenities = [];
    }

    let parsedImages = [];
    try {
      parsedImages = typeof hotel.images === 'string' ? JSON.parse(hotel.images) : (hotel.images || []);
    } catch {
      parsedImages = [];
    }

    return {
      id: hotel.id,
      companyId: hotel.companyId,
      name: hotel.name,
      legalName: hotel.legalName,
      category: hotel.category,
      starRating: hotel.starRating,
      city: hotel.city,
      region: hotel.region,
      address: hotel.address,
      lat: hotel.lat,
      lng: hotel.lng,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      description: hotel.description,
      amenities: parsedAmenities,
      cancellationPolicy: hotel.cancellationPolicy,
      images: parsedImages,
      featuredImage: hotel.featuredImage || (parsedImages.length > 0 ? parsedImages[0] : null),
      rating: hotel.rating || 0.0,
      reviewCount: hotel.reviewCount || 0,
      isFeatured: hotel.isFeatured,
      isActive: hotel.isActive,
      allowInstallments: hotel.allowInstallments ?? true,
      allowDeposit: hotel.allowDeposit ?? true,
      dynamicPricingActive: hotel.dynamicPricingActive ?? true,
      minPrice: minPrice !== null ? minPrice : (hotel.minPrice || 0),
      roomTypesCount: hotel._count?.roomTypes || hotel.roomTypes?.length || 0,
      createdAt: hotel.createdAt,
      updatedAt: hotel.updatedAt,
    };
  }

  /**
   * Helper to format room type object for client
   */
  _formatRoomTypeForClient(room, checkIn = null, checkOut = null, dynamicPricingActive = true) {
    let parsedAmenities = [];
    try {
      parsedAmenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || []);
    } catch {
      parsedAmenities = [];
    }

    let parsedImages = [];
    try {
      parsedImages = typeof room.images === 'string' ? JSON.parse(room.images) : (room.images || []);
    } catch {
      parsedImages = [];
    }

    // Dynamic price calculation
    const basePriceNum = Number(room.basePrice);
    const targetDate = checkIn || new Date().toISOString();
    
    // Check if calendar has override
    let activeOverride = null;
    let availableCount = room.totalRoomsCount;
    if (room.availabilityCalendar && room.availabilityCalendar.length > 0) {
      const todayCal = room.availabilityCalendar[0];
      if (todayCal.priceOverride) activeOverride = Number(todayCal.priceOverride);
      if (todayCal.availableCount !== undefined) availableCount = todayCal.availableCount;
    }

    const dynamicRate = calculateDynamicRoomRate({
      basePrice: basePriceNum,
      availableCount,
      totalRoomsCount: room.totalRoomsCount,
      targetDate,
      priceOverride: activeOverride,
      dynamicPricingActive
    });

    return {
      id: room.id,
      hotelId: room.hotelId,
      name: room.name,
      description: room.description,
      capacityAdults: room.capacityAdults,
      capacityChildren: room.capacityChildren,
      maxOccupancy: room.maxOccupancy,
      bedType: room.bedType,
      bedCount: room.bedCount,
      roomSizeSqM: room.roomSizeSqM,
      mealPlan: room.mealPlan,
      basePrice: basePriceNum,
      currentPrice: dynamicRate.price,
      isSurge: dynamicRate.isSurge,
      isDiscount: dynamicRate.isDiscount,
      surgeType: dynamicRate.surgeType,
      surgeReason: dynamicRate.reason,
      totalRoomsCount: room.totalRoomsCount,
      availableRoomsCount: availableCount,
      amenities: parsedAmenities,
      images: parsedImages,
      isActive: room.isActive,
    };
  }

  /**
   * Search hotels with multi-dimensional filters
   */
  async searchHotels(query = {}) {
    const {
      city,
      region,
      category,
      starRating,
      minPrice,
      maxPrice,
      checkIn,
      checkOut,
      adults,
      children,
      amenities,
      search,
      sort = 'popular',
      page = 1,
      limit = 20
    } = query;

    const where = {
      isActive: true,
      deletedAt: null,
    };

    if (city) {
      where.city = { contains: city };
    }

    if (region) {
      where.region = { contains: region };
    }

    if (category) {
      where.category = category;
    }

    if (starRating) {
      const stars = Array.isArray(starRating) 
        ? starRating.map(s => parseInt(s, 10)) 
        : [parseInt(starRating, 10)];
      where.starRating = { in: stars };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
        { region: { contains: search } },
        { description: { contains: search } }
      ];
    }

    // Include active rooms to determine minimum price & availability
    const hotels = await prisma.hotel.findMany({
      where,
      include: {
        roomTypes: {
          where: { isActive: true, deletedAt: null },
          include: {
            availabilityCalendar: {
              where: checkIn ? { date: new Date(checkIn) } : undefined,
              take: 1
            }
          }
        },
        _count: {
          select: { roomTypes: true, hotelBookings: true }
        }
      },
      take: 100
    });

    // Post-process with dynamic rates and filters
    const processedHotels = hotels.map(hotel => {
      let minPriceForHotel = Infinity;
      let hasAvailableRooms = false;

      hotel.roomTypes.forEach(room => {
        const base = Number(room.basePrice);
        const dynamicRate = calculateDynamicRoomRate({
          basePrice: base,
          availableCount: room.totalRoomsCount,
          totalRoomsCount: room.totalRoomsCount,
          targetDate: checkIn || new Date(),
          dynamicPricingActive: hotel.dynamicPricingActive
        });

        if (dynamicRate.price < minPriceForHotel) {
          minPriceForHotel = dynamicRate.price;
        }

        // Check occupancy filter
        const adultsCount = adults ? parseInt(adults, 10) : 1;
        const childrenCount = children ? parseInt(children, 10) : 0;
        if (room.capacityAdults >= adultsCount && room.capacityChildren >= childrenCount) {
          hasAvailableRooms = true;
        }
      });

      if (minPriceForHotel === Infinity) minPriceForHotel = 0;

      // Filter by amenities if requested
      let amenitiesMatch = true;
      if (amenities) {
        const requiredAmenities = Array.isArray(amenities) ? amenities : [amenities];
        let hotelAmenities = [];
        try {
          hotelAmenities = typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : (hotel.amenities || []);
        } catch {
          hotelAmenities = [];
        }
        amenitiesMatch = requiredAmenities.every(a => hotelAmenities.includes(a));
      }

      return {
        hotel,
        minPrice: minPriceForHotel,
        matchesCapacity: adults ? hasAvailableRooms : true,
        amenitiesMatch
      };
    })
    .filter(item => {
      if (!item.matchesCapacity) return false;
      if (!item.amenitiesMatch) return false;
      if (minPrice && item.minPrice < parseFloat(minPrice)) return false;
      if (maxPrice && item.minPrice > parseFloat(maxPrice)) return false;
      return true;
    });

    // Sorting
    if (sort === 'price_asc') {
      processedHotels.sort((a, b) => a.minPrice - b.minPrice);
    } else if (sort === 'price_desc') {
      processedHotels.sort((a, b) => b.minPrice - a.minPrice);
    } else if (sort === 'rating_desc') {
      processedHotels.sort((a, b) => (b.hotel.rating || 0) - (a.hotel.rating || 0));
    } else {
      // popular (bookings count + featured)
      processedHotels.sort((a, b) => {
        if (a.hotel.isFeatured && !b.hotel.isFeatured) return -1;
        if (!a.hotel.isFeatured && b.hotel.isFeatured) return 1;
        return (b.hotel._count?.hotelBookings || 0) - (a.hotel._count?.hotelBookings || 0);
      });
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const paginated = processedHotels.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return {
      hotels: paginated.map(item => this._formatHotelForClient(item.hotel, item.minPrice)),
      total: processedHotels.length,
      page: pageNum,
      totalPages: Math.ceil(processedHotels.length / limitNum)
    };
  }

  /**
   * Get single hotel details by ID with rooms and rates
   */
  async getHotelDetails(hotelId, { checkIn, checkOut, adults, children } = {}) {
    const hotel = await prisma.hotel.findFirst({
      where: {
        id: hotelId,
        isActive: true,
        deletedAt: null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            rating: true,
            phoneNumber: true,
            email: true
          }
        },
        roomTypes: {
          where: { isActive: true, deletedAt: null },
          include: {
            availabilityCalendar: {
              where: checkIn ? {
                date: {
                  gte: new Date(checkIn),
                  lte: checkOut ? new Date(checkOut) : new Date(checkIn)
                }
              } : undefined,
              orderBy: { date: 'asc' }
            }
          }
        }
      }
    });

    if (!hotel) {
      const error = new Error('Otel tapılmadı və ya aktiv deyil.');
      error.statusCode = 404;
      throw error;
    }

    let minPrice = Infinity;
    const formattedRooms = hotel.roomTypes.map(room => {
      const formatted = this._formatRoomTypeForClient(room, checkIn, checkOut, hotel.dynamicPricingActive);
      if (formatted.currentPrice < minPrice) minPrice = formatted.currentPrice;
      return formatted;
    });

    if (minPrice === Infinity) minPrice = 0;

    const formattedHotel = this._formatHotelForClient(hotel, minPrice);
    formattedHotel.company = hotel.company;
    formattedHotel.rooms = formattedRooms;

    return formattedHotel;
  }

  /**
   * Get recommended hotels for a tour (Cross-sell)
   */
  async getRecommendedHotelsForTour(tourId) {
    // Check direct recommendations
    const recommendations = await prisma.tourHotelRecommendation.findMany({
      where: { tourId },
      include: {
        hotel: {
          include: {
            roomTypes: {
              where: { isActive: true, deletedAt: null },
              take: 3
            }
          }
        }
      }
    });

    if (recommendations.length > 0) {
      return recommendations.map(rec => {
        const hotelFormatted = this._formatHotelForClient(rec.hotel);
        return {
          ...hotelFormatted,
          packageDiscountPercent: rec.packageDiscountPercent,
          recommendedRooms: rec.hotel.roomTypes.map(r => this._formatRoomTypeForClient(r))
        };
      });
    }

    // Fallback: Find top-rated hotels in tour's region/country
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
      select: { region: true, destinationCountry: true, type: true }
    });

    if (!tour) return [];

    const where = {
      isActive: true,
      deletedAt: null
    };

    if (tour.type === 'DOMESTIC') {
      where.OR = [
        { region: { contains: tour.region || '' } },
        { city: { contains: tour.region || '' } }
      ];
    } else if (tour.destinationCountry) {
      where.OR = [
        { city: { contains: tour.destinationCountry } },
        { region: { contains: tour.destinationCountry } }
      ];
    }

    const fallbackHotels = await prisma.hotel.findMany({
      where,
      include: {
        roomTypes: {
          where: { isActive: true, deletedAt: null },
          take: 2
        }
      },
      orderBy: { rating: 'desc' },
      take: 4
    });

    return fallbackHotels.map(h => {
      const formatted = this._formatHotelForClient(h);
      return {
        ...formatted,
        packageDiscountPercent: 10,
        recommendedRooms: h.roomTypes.map(r => this._formatRoomTypeForClient(r))
      };
    });
  }

  /**
   * Vendor: Create a new hotel
   */
  async createHotel(companyId, data) {
    const id = `H-${Math.floor(100000 + Math.random() * 900000)}`;

    const hotel = await prisma.hotel.create({
      data: {
        id,
        companyId,
        name: data.name,
        legalName: data.legalName || data.name,
        category: data.category || 'HOTEL_4_STAR',
        starRating: data.starRating ? parseInt(data.starRating, 10) : 4,
        city: data.city,
        region: data.region || data.city,
        address: data.address,
        lat: data.lat ? parseFloat(data.lat) : null,
        lng: data.lng ? parseFloat(data.lng) : null,
        checkInTime: data.checkInTime || '14:00',
        checkOutTime: data.checkOutTime || '12:00',
        description: data.description || '',
        amenities: typeof data.amenities === 'string' ? data.amenities : JSON.stringify(data.amenities || []),
        cancellationPolicy: data.cancellationPolicy || 'Girişə 48 saat qalmışadək pulsuz ləğvetmə.',
        images: typeof data.images === 'string' ? data.images : JSON.stringify(data.images || []),
        featuredImage: data.featuredImage || (data.images && data.images[0]) || null,
        allowInstallments: data.allowInstallments ?? true,
        allowDeposit: data.allowDeposit ?? true,
        dynamicPricingActive: data.dynamicPricingActive ?? true,
      }
    });

    return this._formatHotelForClient(hotel);
  }

  /**
   * Vendor: Update existing hotel
   */
  async updateHotel(hotelId, companyId, data) {
    const existing = await prisma.hotel.findFirst({
      where: { id: hotelId, companyId, deletedAt: null }
    });

    if (!existing) {
      const error = new Error('Otel tapılmadı və ya bu əməliyyata icazəniz yoxdur.');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.legalName !== undefined) updateData.legalName = data.legalName;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.starRating !== undefined) updateData.starRating = parseInt(data.starRating, 10);
    if (data.city !== undefined) updateData.city = data.city;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.lat !== undefined) updateData.lat = data.lat ? parseFloat(data.lat) : null;
    if (data.lng !== undefined) updateData.lng = data.lng ? parseFloat(data.lng) : null;
    if (data.checkInTime !== undefined) updateData.checkInTime = data.checkInTime;
    if (data.checkOutTime !== undefined) updateData.checkOutTime = data.checkOutTime;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.amenities !== undefined) {
      updateData.amenities = typeof data.amenities === 'string' ? data.amenities : JSON.stringify(data.amenities);
    }
    if (data.cancellationPolicy !== undefined) updateData.cancellationPolicy = data.cancellationPolicy;
    if (data.images !== undefined) {
      updateData.images = typeof data.images === 'string' ? data.images : JSON.stringify(data.images);
    }
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.allowInstallments !== undefined) updateData.allowInstallments = Boolean(data.allowInstallments);
    if (data.allowDeposit !== undefined) updateData.allowDeposit = Boolean(data.allowDeposit);
    if (data.dynamicPricingActive !== undefined) updateData.dynamicPricingActive = Boolean(data.dynamicPricingActive);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    const updated = await prisma.hotel.update({
      where: { id: hotelId },
      data: updateData
    });

    return this._formatHotelForClient(updated);
  }

  /**
   * Vendor: Get my hotels
   */
  async getVendorHotels(companyId) {
    const hotels = await prisma.hotel.findMany({
      where: { companyId, deletedAt: null },
      include: {
        _count: {
          select: { roomTypes: true, hotelBookings: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return hotels.map(h => this._formatHotelForClient(h));
  }

  /**
   * Vendor: Create room type
   */
  async createRoomType(hotelId, companyId, data) {
    const hotel = await prisma.hotel.findFirst({
      where: { id: hotelId, companyId, deletedAt: null }
    });

    if (!hotel) {
      const error = new Error('Otel tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    const id = `RT-${Math.floor(100000 + Math.random() * 900000)}`;

    const room = await prisma.roomType.create({
      data: {
        id,
        hotelId,
        name: data.name,
        description: data.description || '',
        capacityAdults: parseInt(data.capacityAdults, 10) || 2,
        capacityChildren: parseInt(data.capacityChildren, 10) || 1,
        maxOccupancy: parseInt(data.maxOccupancy, 10) || 3,
        bedType: data.bedType || 'DOUBLE',
        bedCount: parseInt(data.bedCount, 10) || 1,
        roomSizeSqM: data.roomSizeSqM ? parseInt(data.roomSizeSqM, 10) : null,
        mealPlan: data.mealPlan || 'BB',
        basePrice: parseFloat(data.basePrice) || 50,
        totalRoomsCount: parseInt(data.totalRoomsCount, 10) || 5,
        amenities: typeof data.amenities === 'string' ? data.amenities : JSON.stringify(data.amenities || []),
        images: typeof data.images === 'string' ? data.images : JSON.stringify(data.images || []),
      }
    });

    return this._formatRoomTypeForClient(room);
  }

  /**
   * Vendor: Get 30-day room availability and pricing matrix
   */
  async getRoomAvailabilityMatrix(roomTypeId, companyId, startDate, endDate) {
    const room = await prisma.roomType.findFirst({
      where: { id: roomTypeId, deletedAt: null },
      include: {
        hotel: { select: { id: true, name: true, companyId: true, dynamicPricingActive: true } }
      }
    });

    if (!room || room.hotel.companyId !== companyId) {
      const error = new Error('Otaq növü tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);

    const calendarEntries = await prisma.roomAvailabilityCalendar.findMany({
      where: {
        roomTypeId,
        date: { gte: start, lte: end }
      }
    });

    const entryMap = new Map();
    calendarEntries.forEach(entry => {
      const dateKey = entry.date.toISOString().slice(0, 10);
      entryMap.set(dateKey, entry);
    });

    const matrix = [];
    const current = new Date(start);
    while (current <= end) {
      const dateKey = current.toISOString().slice(0, 10);
      const entry = entryMap.get(dateKey);

      const availableCount = entry ? entry.availableCount : room.totalRoomsCount;
      const priceOverride = entry ? entry.priceOverride : null;
      const isBlocked = entry ? entry.isBlocked : false;

      const dynamicRate = calculateDynamicRoomRate({
        basePrice: Number(room.basePrice),
        availableCount,
        totalRoomsCount: room.totalRoomsCount,
        targetDate: current,
        priceOverride,
        dynamicPricingActive: room.hotel.dynamicPricingActive
      });

      matrix.push({
        date: dateKey,
        dayOfWeek: current.toLocaleDateString('az-AZ', { weekday: 'short' }),
        basePrice: Number(room.basePrice),
        effectivePrice: dynamicRate.price,
        isOverride: priceOverride !== null,
        availableCount,
        totalRoomsCount: room.totalRoomsCount,
        isBlocked,
        isSurge: dynamicRate.isSurge,
        isDiscount: dynamicRate.isDiscount,
        surgeType: dynamicRate.surgeType
      });

      current.setDate(current.getDate() + 1);
    }

    return {
      room: {
        id: room.id,
        name: room.name,
        hotelName: room.hotel.name,
        basePrice: Number(room.basePrice),
        totalRoomsCount: room.totalRoomsCount
      },
      matrix
    };
  }

  /**
   * Vendor: Bulk update pricing and availability on calendar
   */
  async bulkUpdateRoomCalendar(roomTypeId, companyId, payload = {}) {
    const { dates, priceOverride, availableCount, isBlocked, updates } = payload;
    const room = await prisma.roomType.findFirst({
      where: { id: roomTypeId, deletedAt: null },
      include: { hotel: { select: { companyId: true } } }
    });

    if (!room || room.hotel.companyId !== companyId) {
      const error = new Error('Otaq növü tapılmadı.');
      error.statusCode = 404;
      throw error;
    }

    if (Array.isArray(updates) && updates.length > 0) {
      const results = await Promise.all(
        updates.map(async (item) => {
          const dateObj = new Date(item.date);
          const existing = await prisma.roomAvailabilityCalendar.findUnique({
            where: {
              roomTypeId_date: {
                roomTypeId,
                date: dateObj
              }
            }
          });

          const data = {
            roomTypeId,
            date: dateObj,
            availableCount: item.availableCount !== undefined && item.availableCount !== null && item.availableCount !== ''
              ? parseInt(item.availableCount, 10)
              : (existing ? existing.availableCount : room.totalRoomsCount),
            priceOverride: item.priceOverride !== undefined && item.priceOverride !== null && item.priceOverride !== ''
              ? parseFloat(item.priceOverride)
              : (item.priceOverride === null ? null : (existing ? existing.priceOverride : null)),
            isBlocked: item.isBlocked !== undefined ? Boolean(item.isBlocked) : (existing ? existing.isBlocked : false),
          };

          if (existing) {
            return prisma.roomAvailabilityCalendar.update({
              where: { id: existing.id },
              data
            });
          } else {
            const id = `RAC-${Math.floor(100000 + Math.random() * 900000)}`;
            return prisma.roomAvailabilityCalendar.create({
              data: { id, ...data }
            });
          }
        })
      );

      return {
        success: true,
        updatedDaysCount: results.length
      };
    }

    if (!Array.isArray(dates) || dates.length === 0) {
      const error = new Error('Zəhmət olmasa ən azı bir tarix və ya yeniləmə siyahısı seçin.');
      error.statusCode = 400;
      throw error;
    }

    const appliedUpdates = await Promise.all(
      dates.map(async (dateStr) => {
        const dateObj = new Date(dateStr);
        const existing = await prisma.roomAvailabilityCalendar.findUnique({
          where: {
            roomTypeId_date: {
              roomTypeId,
              date: dateObj
            }
          }
        });

        const data = {
          roomTypeId,
          date: dateObj,
          availableCount: availableCount !== undefined && availableCount !== null && availableCount !== ''
            ? parseInt(availableCount, 10)
            : (existing ? existing.availableCount : room.totalRoomsCount),
          priceOverride: priceOverride !== undefined && priceOverride !== null && priceOverride !== ''
            ? parseFloat(priceOverride)
            : (priceOverride === null ? null : (existing ? existing.priceOverride : null)),
          isBlocked: isBlocked !== undefined ? Boolean(isBlocked) : (existing ? existing.isBlocked : false),
        };

        if (existing) {
          return prisma.roomAvailabilityCalendar.update({
            where: { id: existing.id },
            data
          });
        } else {
          const id = `RAC-${Math.floor(100000 + Math.random() * 900000)}`;
          return prisma.roomAvailabilityCalendar.create({
            data: { id, ...data }
          });
        }
      })
    );

    return {
      success: true,
      updatedDaysCount: appliedUpdates.length
    };
  }
}

export default new HotelsService();
