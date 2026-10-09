import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { ticketApi } from '../api/ticketApi';
import { SupportTicket } from '@toursales/types';
import './CustomerTicketsPage.css';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN':
      return <span className="web-ticket-badge-status open">Yeni Açıldı</span>;
    case 'IN_PROGRESS':
      return <span className="web-ticket-badge-status waiting">İcrada</span>;
    case 'WAITING_CUSTOMER':
      return <span className="web-ticket-badge-status waiting">Cavabınız Gözlənilir</span>;
    case 'RESOLVED':
    case 'CLOSED':
      return <span className="web-ticket-badge-status resolved">Həll Olundu</span>;
    case 'ESCALATED_TO_ADMIN':
      return <span className="web-ticket-badge-status escalated">Moderatora Yönləndirilib</span>;
    default:
      return <span className="web-ticket-badge-status">{status}</span>;
  }
};

export const CustomerTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await ticketApi.getMyTickets();
        setTickets(data);
      } catch (err: any) {
        console.error('Failed to load tickets:', err);
        setError('Biletlər yüklənərkən xəta baş verdi.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, []);

  if (loading) {
    return (
      <div className="web-tickets-page" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="web-tickets-page">
      <div className="web-tickets-header">
        <div className="web-tickets-title-wrap">
          <h1>Müştəri Dəstəyi və Müraciətlər</h1>
          <p>Ləğvetmə, pulun geri qaytarılması, bilet dəyişimi və rəsmi şikayətləriniz</p>
        </div>

        <Link to="/account/tickets/new" className="web-ticket-btn-primary">
          <Plus size={18} />
          <span>Yeni Müraciət Yarat</span>
        </Link>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 12, marginBottom: 24 }}>
          {error}
        </div>
      )}

      <div className="web-tickets-card">
        {tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <LifeBuoy size={44} color="#94a3b8" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
              Heç bir aktiv müraciətiniz yoxdur
            </h3>
            <p style={{ fontSize: '0.9rem', marginBottom: 20 }}>
              Səyahətinizlə bağlı hər hansı sual, geri qaytarma və ya dəyişiklik tələbiniz varsa, yeni bilet aça bilərsiniz.
            </p>
            <Link to="/account/tickets/new" className="web-ticket-btn-primary">
              <Plus size={18} />
              <span>İlk Müraciəti Aç</span>
            </Link>
          </div>
        ) : (
          <div className="web-tickets-list">
            {tickets.map((t) => (
              <Link key={t.id} to={`/account/tickets/${t.id}`} className="web-ticket-item-row">
                <div className="web-ticket-item-main">
                  <div className="web-ticket-meta-badges">
                    <span className="web-ticket-badge-code">{t.ticketNumber}</span>
                    {getStatusBadge(t.status)}
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="web-ticket-item-title">{t.subject}</h3>

                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Son yenilənmə: {new Date(t.updatedAt).toLocaleDateString('az-AZ')}
                  </div>
                </div>

                <ChevronRight size={18} color="#94a3b8" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
