import prisma from '../../config/db.js';
import ApiError from '../../core/api.error.js';

class TaxEngine {
  // 1. Azərbaycan DVX e-Qaimə XML Şablonunun Yaradılması
  generateEQaimeXML(data) {
    const { docNumber, vendorVoen, buyerVoen, buyerName, totalAmount, vatRate = 0, date = new Date() } = data;

    const vatAmount = (Number(totalAmount) * vatRate) / 100;
    const netAmount = Number(totalAmount) - vatAmount;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<eQaimeDocument xmlns="http://taxes.gov.az/eqaime/v1">
  <Header>
    <DocNumber>${docNumber}</DocNumber>
    <IssueDate>${date.toISOString().split('T')[0]}</IssueDate>
    <DocType>COMMERCIAL_INVOICE</DocType>
  </Header>
  <Supplier>
    <VOEN>${vendorVoen || '1111111111'}</VOEN>
    <Name>TOURSALES SaaS System</Name>
  </Supplier>
  <Customer>
    <VOEN>${buyerVoen || '0000000000'}</VOEN>
    <Name>${buyerName}</Name>
  </Customer>
  <FinancialDetails currency="AZN">
    <NetAmount>${netAmount.toFixed(2)}</NetAmount>
    <VATRate>${vatRate}%</VATRate>
    <VATAmount>${vatAmount.toFixed(2)}</VATAmount>
    <TotalAmount>${Number(totalAmount).toFixed(2)}</TotalAmount>
  </FinancialDetails>
</eQaimeDocument>`;

    return { docNumber, xml, totalAmount, vatAmount };
  }

  // 2. Booking üzrə Avtomatik e-Qaimə generasiyası
  async generateInvoiceForBooking(bookingId) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tour: true, company: true }
    });

    if (!booking) throw ApiError.notFound('Rezervasiya tapılmadı.');

    const docNumber = `EQ-${booking.id}-${Date.now().toString().slice(-4)}`;

    return this.generateEQaimeXML({
      docNumber,
      vendorVoen: booking.company.voen || '1234567891',
      buyerVoen: booking.passengerPassport || '0000000000',
      buyerName: `${booking.passengerName} ${booking.passengerSurname}`,
      totalAmount: Number(booking.paidAmount || booking.totalAmount),
      vatRate: 0 // Turizm xidmətləri üçün 0% ƏDV güzəşti
    });
  }
}

export const taxEngine = new TaxEngine();
export default taxEngine;
