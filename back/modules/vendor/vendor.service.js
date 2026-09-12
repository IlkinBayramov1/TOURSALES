import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';
import ExcelJS from 'exceljs';

function formatRelativeTimeAz(date) {
  if (!date) return 'Bayaq';
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 2) return 'Bayaq';
  if (diffMinutes < 60) return `${diffMinutes} dəq əvvəl`;
  if (diffHours < 24) return `${diffHours} saat əvvəl`;
  if (diffDays === 1) return 'Dünən';
  if (diffDays < 7) return `${diffDays} gün əvvəl`;
  return new Date(date).toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
}

function calculateDateRanges(period = 'month') {
  const now = new Date();
  let currentStart, currentEnd, prevStart, prevEnd;

  if (period === 'today') {
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 1);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 1);
  } else if (period === 'week') {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0: Mon, 6: Sun
    currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 6, 23, 59, 59, 999);
    prevStart = new Date(currentStart);
    prevStart.setDate(prevStart.getDate() - 7);
    prevEnd = new Date(currentEnd);
    prevEnd.setDate(prevEnd.getDate() - 7);
  } else if (period === 'year') {
    currentStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    prevStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else {
    // Default 'month'
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  return { currentStart, currentEnd, prevStart, prevEnd };
}

class VendorService {
  async getDashboardStats(companyId, period = 'month') {
    const { currentStart, currentEnd, prevStart, prevEnd } = calculateDateRanges(period);
    const nowYear = new Date().getFullYear();
    const yearStart = new Date(nowYear, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(nowYear, 11, 31, 23, 59, 59, 999);

    // Parallel high-performance database queries
    const [
      company,
      totalTours,
      activeToursCount,
      domesticToursCount,
      foreignToursCount,
      allActiveTours,
      currentBookings,
      prevBookings,
      allConfirmedBookingsYear,
      recentBookingsRaw,
      recentTransactions,
      recentPayouts,
      activeAds,
      activeCampaigns
    ] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.tour.count({ where: { companyId, deletedAt: null } }),
      prisma.tour.count({ where: { companyId, status: 'Active', deletedAt: null } }),
      prisma.tour.count({ where: { companyId, status: 'Active', type: 'DOMESTIC', deletedAt: null } }),
      prisma.tour.count({ where: { companyId, status: 'Active', type: 'FOREIGN', deletedAt: null } }),
      prisma.tour.findMany({
        where: { companyId, status: 'Active', deletedAt: null },
        select: {
          id: true,
          title: true,
          type: true,
          price: true,
          currency: true,
          maxParticipants: true,
          bookings: {
            where: { status: 'CONFIRMED', deletedAt: null },
            select: { seats: true, totalAmount: true, paidAmount: true }
          }
        }
      }),
      prisma.booking.findMany({
        where: {
          companyId,
          deletedAt: null,
          createdAt: { gte: currentStart, lte: currentEnd }
        },
        select: {
          id: true,
          seats: true,
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          tour: { select: { type: true } }
        }
      }),
      prisma.booking.findMany({
        where: {
          companyId,
          deletedAt: null,
          createdAt: { gte: prevStart, lte: prevEnd }
        },
        select: {
          id: true,
          seats: true,
          totalAmount: true,
          paidAmount: true,
          status: true
        }
      }),
      prisma.booking.findMany({
        where: {
          companyId,
          status: 'CONFIRMED',
          deletedAt: null,
          createdAt: { gte: yearStart, lte: yearEnd }
        },
        select: {
          totalAmount: true,
          paidAmount: true,
          createdAt: true,
          seats: true
        }
      }),
      prisma.booking.findMany({
        where: { companyId, deletedAt: null },
        take: 7,
        orderBy: { createdAt: 'desc' },
        include: {
          tour: { select: { id: true, title: true, type: true, currency: true } }
        }
      }),
      prisma.transaction.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payout.findMany({
        where: { companyId },
        take: 5,
        orderBy: { payoutDate: 'desc' }
      }),
      prisma.ad.count({ where: { companyId, status: 'Active' } }),
      prisma.campaign.count({ where: { companyId, status: 'Active' } })
    ]);

    if (!company) {
      throw ApiError.notFound('Şirkət tapılmadı.');
    }

    // 1. Revenue Calculations
    const confirmedCurrent = currentBookings.filter(b => b.status === 'CONFIRMED');
    const confirmedPrev = prevBookings.filter(b => b.status === 'CONFIRMED');

    let totalRevenue = confirmedCurrent.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
    let prevRevenue = confirmedPrev.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);

    // If current period has no bookings yet, show all-time confirmed revenue to keep dashboard informative
    if (totalRevenue === 0 && period === 'month') {
      const allTimeRevenue = allConfirmedBookingsYear.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
      if (allTimeRevenue > 0) {
        totalRevenue = allTimeRevenue;
      }
    }

    let revenueGrowth = 0;
    if (prevRevenue > 0) {
      revenueGrowth = Number((((totalRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1));
    } else if (totalRevenue > 0) {
      revenueGrowth = 100;
    }

    // 2. Bookings & Seats Calculations
    let totalBookingsCount = confirmedCurrent.length;
    let totalSeatsSold = confirmedCurrent.reduce((sum, b) => sum + (b.seats || 1), 0);

    if (totalBookingsCount === 0 && period === 'month') {
      totalBookingsCount = allConfirmedBookingsYear.length;
      totalSeatsSold = allConfirmedBookingsYear.reduce((sum, b) => sum + (b.seats || 1), 0);
    }

    const prevBookingsCount = confirmedPrev.length;
    let bookingsGrowth = 0;
    if (prevBookingsCount > 0) {
      bookingsGrowth = Number((((totalBookingsCount - prevBookingsCount) / prevBookingsCount) * 100).toFixed(1));
    } else if (totalBookingsCount > 0) {
      bookingsGrowth = 100;
    }

    // 3. Occupancy Rate Calculation
    let totalCapacity = 0;
    let totalOccupied = 0;
    allActiveTours.forEach(tour => {
      totalCapacity += tour.maxParticipants || 0;
      const sold = tour.bookings.reduce((sum, b) => sum + (b.seats || 0), 0);
      totalOccupied += sold;
    });
    const occupancyRate = totalCapacity > 0 ? Number(((totalOccupied / totalCapacity) * 100).toFixed(1)) : 0;

    // 4. Pending Deposits & Balances
    const pendingDeposits = currentBookings
      .filter(b => b.paymentStatus === 'PARTIALLY_PAID' || b.paymentStatus === 'PENDING')
      .reduce((sum, b) => sum + Number(b.remainingAmount || b.totalAmount || 0), 0) || Number(company.pendingBalance || 0);

    // 5. Sales Distribution (Daxili vs Xarici Turlar)
    let domesticTickets = confirmedCurrent
      .filter(b => b.tour?.type === 'DOMESTIC')
      .reduce((sum, b) => sum + (b.seats || 1), 0);
    let foreignTickets = confirmedCurrent
      .filter(b => b.tour?.type === 'FOREIGN')
      .reduce((sum, b) => sum + (b.seats || 1), 0);

    if (domesticTickets === 0 && foreignTickets === 0) {
      // Aggregate from all active tours
      allActiveTours.forEach(t => {
        const sold = t.bookings.reduce((sum, b) => sum + (b.seats || 0), 0);
        if (t.type === 'DOMESTIC') domesticTickets += sold;
        else foreignTickets += sold;
      });
    }

    const totalDistTickets = domesticTickets + foreignTickets;
    let domesticPercent = 50;
    let foreignPercent = 50;
    if (totalDistTickets > 0) {
      domesticPercent = Math.round((domesticTickets / totalDistTickets) * 100);
      foreignPercent = 100 - domesticPercent;
    }

    const salesDistribution = [
      { name: 'Xarici Turlar', value: foreignPercent, tickets: foreignTickets, color: '#635bff' },
      { name: 'Daxili Turlar', value: domesticPercent, tickets: domesticTickets, color: '#0ea5e9' }
    ];

    // 6. Dynamic Chart Data (Monthly / Daily based on period)
    const monthsAz = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
    let monthlyRevenue = [];

    if (period === 'today') {
      const hours = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
      monthlyRevenue = hours.map((hour, idx) => {
        const blockStart = idx * 4;
        const blockEnd = blockStart + 4;
        const inBlock = confirmedCurrent.filter(b => {
          const h = new Date(b.createdAt).getHours();
          return h >= blockStart && h < blockEnd;
        });
        const rev = inBlock.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
        return {
          month: hour,
          revenue: rev,
          bookings: inBlock.length
        };
      });
    } else if (period === 'week') {
      const dayNames = ['B.e', 'Ç.a', 'Çər', 'C.a', 'Cüm', 'Şən', 'Baz'];
      monthlyRevenue = dayNames.map((dayName, idx) => {
        const targetDay = (idx + 1) % 7;
        const onDay = confirmedCurrent.filter(b => new Date(b.createdAt).getDay() === targetDay);
        const rev = onDay.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
        return {
          month: dayName,
          revenue: rev,
          bookings: onDay.length
        };
      });
    } else {
      // Default: 12 months distribution
      monthlyRevenue = monthsAz.map((mName, mIdx) => {
        const inMonth = allConfirmedBookingsYear.filter(b => new Date(b.createdAt).getMonth() === mIdx);
        const rev = inMonth.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
        return {
          month: mName,
          revenue: rev,
          bookings: inMonth.length
        };
      });
    }

    // 7. Popular Destinations / Top Performing Tours
    const colors = ['#635bff', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6'];
    const popularDestinations = allActiveTours
      .map((tour, idx) => {
        const tickets = tour.bookings.reduce((sum, b) => sum + (b.seats || 0), 0);
        const rev = tour.bookings.reduce((sum, b) => sum + Number(b.paidAmount || b.totalAmount || 0), 0);
        const capacity = tour.maxParticipants || 1;
        const percent = Math.min(100, Math.round((tickets / capacity) * 100));
        return {
          id: tour.id,
          name: tour.title,
          type: tour.type === 'DOMESTIC' ? 'daxili' : 'xarici',
          tickets,
          revenue: `${rev.toLocaleString()} ₼`,
          revenueNum: rev,
          percent,
          color: colors[idx % colors.length]
        };
      })
      .sort((a, b) => b.tickets - a.tickets || b.revenueNum - a.revenueNum)
      .slice(0, 4);

    // 8. Real Activities Feed
    const activities = [];

    // Recent bookings as activity events
    recentBookingsRaw.slice(0, 3).forEach(b => {
      activities.push({
        id: `act-b-${b.id}`,
        title: b.status === 'CONFIRMED' ? 'Yeni Bilet Satışı' : (b.status === 'CANCELLED' ? 'Rezervasiya Ləğvi' : 'Yeni Sifariş'),
        time: formatRelativeTimeAz(b.createdAt),
        desc: `${b.passengerName || 'Müştəri'} "${b.tour?.title || 'Tur'}" üçün ${b.seats || 1} bilet aldı.`,
        type: b.status === 'CONFIRMED' ? 'success' : (b.status === 'CANCELLED' ? 'warning' : 'primary'),
        iconType: 'ticket',
        timestamp: new Date(b.createdAt).getTime()
      });
    });

    // Recent transactions as activity events
    recentTransactions.slice(0, 2).forEach(tx => {
      activities.push({
        id: `act-tx-${tx.id}`,
        title: tx.type === 'TICKET_SALE' ? 'Ödəniş Qəbul Edildi' : 'Maliyyə Əməliyyatı',
        time: formatRelativeTimeAz(tx.createdAt),
        desc: `Platforma vasitəsilə ${Number(tx.netAmount || tx.amount || 0).toLocaleString()} AZN daxil oldu.`,
        type: 'success',
        iconType: 'dollar',
        timestamp: new Date(tx.createdAt).getTime()
      });
    });

    // Recent payouts as activity events
    recentPayouts.slice(0, 2).forEach(p => {
      activities.push({
        id: `act-p-${p.id}`,
        title: 'Payout Göndərildi',
        time: formatRelativeTimeAz(p.payoutDate),
        desc: `${Number(p.amount || 0).toLocaleString()} AZN çıxarış tələbi icra olundu.`,
        type: 'primary',
        iconType: 'dollar',
        timestamp: new Date(p.payoutDate).getTime()
      });
    });

    // Sort combined activities descending by timestamp and take top 4
    activities.sort((a, b) => b.timestamp - a.timestamp);
    const finalActivities = activities.slice(0, 4);

    // 9. Formatted Recent Bookings Table Data
    const recentBookings = recentBookingsRaw.map(b => ({
      id: b.id,
      bookingNumber: b.id,
      tourId: b.tourId,
      tourTitle: b.tour?.title || 'Tur',
      companyId: b.companyId,
      totalAmount: Number(b.totalAmount || 0),
      paidAmount: Number(b.paidAmount || 0),
      remainingAmount: Number(b.remainingAmount || 0),
      currency: b.tour?.currency || 'AZN',
      status: b.status,
      paymentStatus: b.paymentStatus,
      passengerName: `${b.passengerName || ''} ${b.passengerSurname || ''}`.trim() || 'Müştəri',
      seats: b.seats || 1,
      busSeatNumber: b.busSeatNumber || null,
      contactNumber: b.contactNumber,
      createdAt: b.createdAt
    }));

    return {
      companyName: company.name,
      availableBalance: Number(company.availableBalance || 0),
      pendingBalance: Number(company.pendingBalance || 0),
      pendingDeposits,
      totalRevenue,
      revenueGrowth,
      totalBookingsCount,
      bookingsGrowth,
      totalSeatsSold,
      totalTours,
      activeToursCount,
      domesticToursCount,
      foreignToursCount,
      occupancyRate,
      activeAds,
      activeCampaigns,
      salesDistribution,
      monthlyRevenue,
      popularDestinations,
      activities: finalActivities,
      recentBookings
    };
  }

  async exportDashboardSummary(companyId, period = 'month') {
    const stats = await this.getDashboardStats(companyId, period);

    // Create CSV content with UTF-8 BOM for proper Azerbaijani character rendering in Excel
    let csv = '\uFEFF';
    csv += 'TOURSALES PARTNER — İDARƏETMƏ VƏ ANALİTİKA HESABATI\n';
    csv += `Şirkət:;"${stats.companyName}"\n`;
    csv += `Hesabat Dövrü:;"${period.toUpperCase()}"\n`;
    csv += `Tarix:;"${new Date().toLocaleString('az-AZ')}"\n\n`;

    csv += 'ƏSAS GÖSTƏRİCİLƏR\n';
    csv += 'Göstərici;Dəyər\n';
    csv += `Ümumi Gəlir;${stats.totalRevenue} AZN\n`;
    csv += `Gəlir Artımı;${stats.revenueGrowth}%\n`;
    csv += `Satılmış Biletlər (Sifarişlər);${stats.totalBookingsCount}\n`;
    csv += `Bilet Satışı Artımı;${stats.bookingsGrowth}%\n`;
    csv += `Ümumi Satılmış Oturacaqlar;${stats.totalSeatsSold}\n`;
    csv += `Aktiv Turlar;${stats.activeToursCount} (Daxili: ${stats.domesticToursCount}, Xarici: ${stats.foreignToursCount})\n`;
    csv += `Doluluq Dərəcəsi;${stats.occupancyRate}%\n`;
    csv += `Mövcud Balans;${stats.availableBalance} AZN\n`;
    csv += `Gözləyən Balans / Behlər;${stats.pendingDeposits} AZN\n\n`;

    csv += 'SON SİFARİŞLƏR\n';
    csv += 'Sifariş №;Turun Adı;Sərnişin;Oturacaq;Məbləğ;Status;Ödəniş Statusu;Tarix\n';

    stats.recentBookings.forEach(b => {
      const d = new Date(b.createdAt).toLocaleDateString('az-AZ');
      csv += `"${b.bookingNumber}";"${b.tourTitle}";"${b.passengerName}";"${b.seats}";"${b.totalAmount} ${b.currency}";"${b.status}";"${b.paymentStatus}";"${d}"\n`;
    });

    return csv;
  }

  async exportDashboardExcel(companyId, period = 'month') {
    const stats = await this.getDashboardStats(companyId, period);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TOURSALES Platform';
    workbook.lastModifiedBy = 'TOURSALES Partner Portal';
    workbook.created = new Date();

    const periodLabels = {
      today: 'Bu Gün',
      week: 'Bu Həftə',
      month: 'Bu Ay',
      year: 'Bu İl'
    };
    const periodName = periodLabels[period] || period.toUpperCase();
    const currentDateFormatted = new Date().toLocaleString('az-AZ');

    const sheet = workbook.addWorksheet('İdarəetmə Paneli Hesabatı', {
      views: [{ showGridLines: true }]
    });

    // Explicit generous column widths so text is NEVER cut off
    sheet.columns = [
      { key: 'A', width: 26 }, // Sifariş № / Göstərici adı
      { key: 'B', width: 38 }, // Turun adı / Dəyər
      { key: 'C', width: 28 }, // Sərnişin / Qeyd
      { key: 'D', width: 18 }, // Yer
      { key: 'E', width: 20 }, // Məbləğ
      { key: 'F', width: 20 }, // Sifariş Statusu
      { key: 'G', width: 20 }, // Ödəniş Statusu
      { key: 'H', width: 22 }, // Tarix
    ];

    const borderThin = {
      top: { style: 'thin', color: { argb: 'CBD5E1' } },
      left: { style: 'thin', color: { argb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'CBD5E1' } },
      right: { style: 'thin', color: { argb: 'CBD5E1' } },
    };

    // 1. BANNER ROW 1
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'TOURSALES PARTNER — İDARƏETMƏ VƏ BİZNES ANALİTİKASI HESABATI';
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 36;

    // 2. SUB-BANNER ROW 2
    sheet.mergeCells('A2:H2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Şirkət: ${stats.companyName}   •   Hesabat Dövrü: ${periodName}   •   Tarix: ${currentDateFormatted}`;
    subCell.font = { name: 'Calibri', size: 11, bold: false, color: { argb: 'E2E8F0' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E293B' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(2).height = 24;

    sheet.getRow(3).height = 12; // Empty spacer

    // 3. SECTION 1: KPI TABLE
    sheet.mergeCells('A4:C4');
    const sec1Title = sheet.getCell('A4');
    sec1Title.value = '📊 ƏSAS BİZNES VƏ MALİYYƏ GÖSTƏRİCİLƏRİ (KPI)';
    sec1Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    sec1Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4338CA' } };
    sec1Title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(4).height = 26;

    const kpiHeaderRow = sheet.getRow(5);
    kpiHeaderRow.values = ['Göstərici', 'Dəyər', 'Dinamika / Qeyd'];
    kpiHeaderRow.height = 22;
    ['A5', 'B5', 'C5'].forEach(addr => {
      const c = sheet.getCell(addr);
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: '1E293B' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F5F9' } };
      c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      c.border = borderThin;
    });

    const kpiItems = [
      ['Ümumi Gəlir', `${stats.totalRevenue.toLocaleString()} AZN`, `Artım: ${stats.revenueGrowth > 0 ? '+' : ''}${stats.revenueGrowth}%`],
      ['Satılmış Biletlər (Sifarişlər)', `${stats.totalBookingsCount} sifariş`, `Dinamika: ${stats.bookingsGrowth > 0 ? '+' : ''}${stats.bookingsGrowth}%`],
      ['Ümumi Satılmış Oturacaqlar', `${stats.totalSeatsSold} yer`, 'Təsdiqlənmiş biletlərdən'],
      ['Aktiv Turlar', `${stats.activeToursCount} tur`, `Daxili: ${stats.domesticToursCount}, Xarici: ${stats.foreignToursCount}`],
      ['Turların Doluluq Dərəcəsi', `${stats.occupancyRate}%`, 'Aktiv turlar üzrə tutum doluluğu'],
      ['Mövcud Balans', `${stats.availableBalance.toLocaleString()} AZN`, 'Çıxarışa hazır vəsait'],
      ['Gözləyən Balans / Behlər', `${stats.pendingDeposits.toLocaleString()} AZN`, 'Gözləmədə olan ödənişlər'],
      ['Aktiv Reklamlar', `${stats.activeAds || 0} ədəd`, 'Yayımda olan kampaniyalar']
    ];

    let rowIdx = 6;
    kpiItems.forEach((item, i) => {
      const row = sheet.getRow(rowIdx);
      row.values = item;
      row.height = 20;
      const isZebra = i % 2 === 1;
      const bgColor = isZebra ? 'F8FAFC' : 'FFFFFF';
      ['A', 'B', 'C'].forEach(col => {
        const c = sheet.getCell(`${col}${rowIdx}`);
        c.font = { name: 'Calibri', size: 10, bold: col === 'B' };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        c.alignment = { vertical: 'middle', horizontal: col === 'C' ? 'center' : 'left', indent: col === 'C' ? 0 : 1 };
        c.border = borderThin;
      });
      rowIdx++;
    });

    // Row space
    sheet.getRow(rowIdx).height = 16;
    rowIdx++;

    // 4. SECTION 2: RECENT BOOKINGS
    const sec2StartRow = rowIdx;
    sheet.mergeCells(`A${sec2StartRow}:H${sec2StartRow}`);
    const sec2Title = sheet.getCell(`A${sec2StartRow}`);
    sec2Title.value = '📋 SON REZERVASİYALAR VƏ SƏRNİŞİN MANİFESTİ';
    sec2Title.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    sec2Title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
    sec2Title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(sec2StartRow).height = 26;
    rowIdx++;

    const bookHeaderRow = sheet.getRow(rowIdx);
    bookHeaderRow.values = [
      'Sifariş №',
      'Turun Adı',
      'Sərnişin Adı & Soyadı',
      'Yer / Oturacaq',
      'Məbləğ',
      'Sifariş Statusu',
      'Ödəniş Statusu',
      'Tarix'
    ];
    bookHeaderRow.height = 24;
    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
      const c = sheet.getCell(`${col}${rowIdx}`);
      c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '064E3B' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
      c.border = borderThin;
    });
    rowIdx++;

    if (stats.recentBookings.length === 0) {
      sheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      const emptyCell = sheet.getCell(`A${rowIdx}`);
      emptyCell.value = 'Hələ ki heç bir rezervasiya qeydə alınmayıb.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '64748B' } };
      emptyCell.alignment = { vertical: 'middle', horizontal: 'center' };
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8FAFC' } };
      sheet.getRow(rowIdx).height = 26;
    } else {
      stats.recentBookings.forEach((b, i) => {
        const row = sheet.getRow(rowIdx);
        const d = new Date(b.createdAt).toLocaleDateString('az-AZ') + ' ' + new Date(b.createdAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' });
        const seatInfo = b.busSeatNumber ? `Yer #${b.busSeatNumber}` : `${b.seats || 1} yer`;
        const amountStr = `${Number(b.totalAmount || 0).toLocaleString()} ${b.currency || 'AZN'}`;

        let statusText = b.status;
        let statusBg = 'F1F5F9';
        let statusColor = '334155';
        if (b.status === 'CONFIRMED') {
          statusText = 'Təsdiqləndi';
          statusBg = 'D1FAE5';
          statusColor = '065F46';
        } else if (b.status === 'PENDING') {
          statusText = 'Gözləmədə';
          statusBg = 'FEF3C7';
          statusColor = '92400E';
        } else if (b.status === 'CANCELLED') {
          statusText = 'Ləğv edildi';
          statusBg = 'FEE2E2';
          statusColor = '991B1B';
        }

        let payText = b.paymentStatus;
        if (b.paymentStatus === 'PAID') payText = 'Ödənildi';
        else if (b.paymentStatus === 'PARTIALLY_PAID') payText = 'Qismən ödənilib';
        else if (b.paymentStatus === 'PENDING') payText = 'Gözləyir';

        row.values = [
          b.bookingNumber,
          b.tourTitle,
          b.passengerName,
          seatInfo,
          amountStr,
          statusText,
          payText,
          d
        ];
        row.height = 22;

        const isZebra = i % 2 === 1;
        const rowBg = isZebra ? 'F8FAFC' : 'FFFFFF';

        ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].forEach(col => {
          const c = sheet.getCell(`${col}${rowIdx}`);
          c.font = { name: 'Calibri', size: 10, bold: col === 'A' || col === 'E' };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: col === 'F' ? statusBg : rowBg } };
          if (col === 'F') {
            c.font = { name: 'Calibri', size: 9, bold: true, color: { argb: statusColor } };
          }
          c.alignment = {
            vertical: 'middle',
            horizontal: col === 'B' || col === 'C' ? 'left' : (col === 'E' ? 'right' : 'center'),
            indent: col === 'B' || col === 'C' ? 1 : 0
          };
          c.border = borderThin;
        });

        rowIdx++;
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}

export const vendorService = new VendorService();
export default vendorService;
