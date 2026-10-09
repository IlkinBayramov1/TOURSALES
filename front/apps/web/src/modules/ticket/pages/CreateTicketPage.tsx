import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LifeBuoy,
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
  DollarSign
} from 'lucide-react';
import { ticketApi } from '../api/ticketApi';
import { TicketCategory } from '@toursales/types';
import './CustomerTicketsPage.css';

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();

  const [category, setCategory] = useState<TicketCategory>('REFUND_REQUEST');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [requestedRefund, setRequestedRefund] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Mövzu və müraciət mətni daxil edilməlidir.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const ticket = await ticketApi.createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        bookingId: bookingId.trim() || undefined,
        requestedRefund: requestedRefund ? Number(requestedRefund) : undefined,
      });

      navigate(`/account/tickets/${ticket.id}`);
    } catch (err: any) {
      console.error('Create ticket error:', err);
      setError(err.response?.data?.message || 'Müraciət göndərilərkən xəta baş verdi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="web-tickets-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link to="/account/tickets" className="web-ticket-btn-primary" style={{ background: '#f1f5f9', color: '#0f172a', boxShadow: 'none', padding: '8px 14px' }}>
          <ArrowLeft size={16} />
          <span>Geri</span>
        </Link>
        <div className="web-tickets-title-wrap">
          <h1>Yeni Dəstək Müraciəti Aç</h1>
          <p>Tur şirkəti və platforma moderatorları müraciətinizə ən qısa zamanda baxacaq</p>
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 12, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="web-ticket-form-card">
        <div className="web-ticket-field">
          <label>Müraciət Kateqoriyası *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
          >
            <option value="REFUND_REQUEST">Pulun Geri Qaytarılması (Refund)</option>
            <option value="DATE_OR_SEAT_CHANGE">Tarix və ya Oturacaq Dəyişimi</option>
            <option value="COMPLAINT">Xidmət / Bələdçi / Nəqliyyat Şikayəti</option>
            <option value="PAYMENT_ISSUE">Ödəniş və Taksit Problemi</option>
            <option value="HOTEL_INQUIRY">Otel və Qonaqlama Sorğusu</option>
            <option value="GENERAL_SUPPORT">Ümumi Dəstək və Suallar</option>
          </select>
        </div>

        {category === 'REFUND_REQUEST' && (
          <div className="web-ticket-policy-callout">
            <strong>Rəsmi Qaytarılma Siyasəti:</strong>
            <p>• Turun çıxışına 7 və daha çox gün qalmış: 100% tam geri qaytarılma.</p>
            <p>• Turun çıxışına 3–7 gün qalmış: 70% qaytarılma (30% cərimə tutulur).</p>
            <p>• Turun çıxışına 3 gündən az qalmış: Qaytarılmır (yerlər bağlanmışdır).</p>
          </div>
        )}

        <div className="web-ticket-field">
          <label>Sifariş Kodu (İxtiyari)</label>
          <input
            type="text"
            placeholder="Məs: TR-492019 və ya HTR-168816"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
        </div>

        {category === 'REFUND_REQUEST' && (
          <div className="web-ticket-field">
            <label>Tələb Olunan Məbləğ (AZN)</label>
            <input
              type="number"
              placeholder="Məs: 110"
              value={requestedRefund}
              onChange={(e) => setRequestedRefund(e.target.value)}
            />
          </div>
        )}

        <div className="web-ticket-field">
          <label>Mövzu *</label>
          <input
            type="text"
            required
            placeholder="Məs: Turun ləğvi və ödənişin kartıma qaytarılması"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="web-ticket-field">
          <label>Ətraflı İzah və Müraciət Mətni *</label>
          <textarea
            rows={5}
            required
            placeholder="Səbəbi və tələbinizi ətraflı qeyd edin..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="web-ticket-btn-primary"
          style={{ alignSelf: 'flex-start', padding: '14px 28px' }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Göndərilir...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Müraciəti Göndər</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
