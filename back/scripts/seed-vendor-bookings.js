import prisma from '../config/db.js';

async function seedBookings() {
  console.log('Seeding vendor bookings for C-586288...');

  const companyId = 'C-586288';
  const tours = await prisma.tour.findMany({
    where: { companyId, deletedAt: null },
    take: 3
  });

  if (tours.length === 0) {
    console.log('No tours found for C-586288. Creating sample tour first...');
    const tour = await prisma.tour.create({
      data: {
        id: 'T-999001',
        title: 'Quba — Qəçrəş & Şahdağ Qış Nağılı',
        description: 'Möhtəşəm dağ mənzərəsi, xizək və Quba təbiəti.',
        type: 'DOMESTIC',
        category: 'NATURE',
        companyId,
        startDate: new Date('2026-10-15T07:00:00Z'),
        endDate: new Date('2026-10-16T21:00:00Z'),
        price: 85.00,
        maxParticipants: 45,
        status: 'PUBLISHED',
        location: 'Quba / Şahdağ'
      }
    });
    tours.push(tour);
  }

  const primaryTour = tours[0];
  const secondaryTour = tours[1] || tours[0];

  // Booking 1: Two passengers, CONFIRMED, 1 checked in, 1 pending
  const booking1Data = [
    {
      seatNumber: 1,
      fullName: 'Murad Əliyev',
      phone: '+994 50 222 33 44',
      finCode: '7ABC123',
      isCheckedIn: true
    },
    {
      seatNumber: 2,
      fullName: 'Nərgiz Əliyeva',
      phone: '+994 50 222 33 45',
      finCode: '7ABC124',
      isCheckedIn: false
    }
  ];

  // Booking 2: Single passenger, CONFIRMED, checked in
  const booking2Data = [
    {
      seatNumber: 5,
      fullName: 'Rəşad Quliyev',
      phone: '+994 55 987 65 43',
      finCode: '6DEF456',
      isCheckedIn: true
    }
  ];

  // Booking 3: Three passengers family booking
  const booking3Data = [
    {
      seatNumber: 8,
      fullName: 'Aygün Həsənova',
      phone: '+994 70 333 11 22',
      finCode: '5GHI789',
      isCheckedIn: false
    },
    {
      seatNumber: 9,
      fullName: 'Tural Həsənov',
      phone: '+994 70 333 11 23',
      finCode: '5GHI790',
      isCheckedIn: false
    },
    {
      seatNumber: 10,
      fullName: 'Zəhra Həsənova',
      phone: '+994 70 333 11 22',
      finCode: '5GHI791',
      isCheckedIn: false
    }
  ];

  // Booking 4: On secondary tour
  const booking4Data = [
    {
      seatNumber: 12,
      fullName: 'Elşən Məmmədov',
      phone: '+994 51 444 55 66',
      finCode: '8JKL012',
      isCheckedIn: true
    }
  ];

  const bookingsToCreate = [
    {
      id: 'TS-2026-101',
      tourId: primaryTour.id,
      companyId,
      passengerName: 'Murad',
      passengerSurname: 'Əliyev',
      passengerPassport: '7ABC123',
      contactNumber: '+994 50 222 33 44',
      contactEmail: 'murad.aliyev@mail.az',
      seats: 2,
      busSeatNumber: '1,2',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: Number(primaryTour.price) * 2,
      remainingAmount: 0,
      totalAmount: Number(primaryTour.price) * 2,
      isCheckedIn: false,
      qrToken: 'QR-TS-2026-101',
      passengersData: JSON.stringify(booking1Data)
    },
    {
      id: 'TS-2026-102',
      tourId: primaryTour.id,
      companyId,
      passengerName: 'Rəşad',
      passengerSurname: 'Quliyev',
      passengerPassport: '6DEF456',
      contactNumber: '+994 55 987 65 43',
      contactEmail: 'rashad.q@gmail.com',
      seats: 1,
      busSeatNumber: '5',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: Number(primaryTour.price),
      remainingAmount: 0,
      totalAmount: Number(primaryTour.price),
      isCheckedIn: true,
      checkedInAt: new Date(),
      checkedInBy: 'Bələdçi - Leyla',
      qrToken: 'QR-TS-2026-102',
      passengersData: JSON.stringify(booking2Data)
    },
    {
      id: 'TS-2026-103',
      tourId: primaryTour.id,
      companyId,
      passengerName: 'Aygün',
      passengerSurname: 'Həsənova',
      passengerPassport: '5GHI789',
      contactNumber: '+994 70 333 11 22',
      contactEmail: 'aygun.hasan@yahoo.com',
      seats: 3,
      busSeatNumber: '8,9,10',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: Number(primaryTour.price) * 3,
      remainingAmount: 0,
      totalAmount: Number(primaryTour.price) * 3,
      isCheckedIn: false,
      qrToken: 'QR-TS-2026-103',
      passengersData: JSON.stringify(booking3Data)
    },
    {
      id: 'TS-2026-104',
      tourId: secondaryTour.id,
      companyId,
      passengerName: 'Elşən',
      passengerSurname: 'Məmmədov',
      passengerPassport: '8JKL012',
      contactNumber: '+994 51 444 55 66',
      contactEmail: 'elshen.m@code.edu.az',
      seats: 1,
      busSeatNumber: '12',
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paidAmount: Number(secondaryTour.price),
      remainingAmount: 0,
      totalAmount: Number(secondaryTour.price),
      isCheckedIn: true,
      checkedInAt: new Date(),
      checkedInBy: 'Vendor - AzTour',
      qrToken: 'QR-TS-2026-104',
      passengersData: JSON.stringify(booking4Data)
    }
  ];

  for (const b of bookingsToCreate) {
    await prisma.booking.upsert({
      where: { id: b.id },
      update: b,
      create: b
    });
    console.log(`Booking created/updated: ${b.id}`);
  }

  console.log('Seed completed successfully!');
  await prisma.$disconnect();
}

seedBookings().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
