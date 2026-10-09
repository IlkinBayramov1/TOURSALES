import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LifeBuoy,
  ArrowLeft,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Building
} from 'lucide-react';
import { ticketApi } from '../api/ticketApi';
import { SupportTicket, TicketMessage } from '@toursales/types';
import './CustomerTicketsPage.css';

export const TicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [escalateSuccess, setEscalateSuccess] = useState(false);

  const loadTicket = useCallback(async () => {
    if (!id) return;
    try {
      const data = await ticketApi.getTicketDetails(id);
      setTicket(data);
    } catch (err: any) {
      console.error('Failed to load ticket:', err);
      setError('Bilet məlumatları yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !replyText.trim() || sending) return;

    setSending(true);
    try {
      await ticketApi.replyTicket(id, {
        message: replyText.trim(),
      });
      setReplyText('');
      await loadTicket();
    } catch (err: any) {
      console.error('Failed to reply to ticket:', err);
    } finally {
      setSending(false);
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    const reason = window.prompt('Moderatora yönləndirmə səbəbini qeyd edin:');
    if (!reason) return;

    setEscalating(true);
    try {
      await ticketApi.escalateTicket(id, reason);
      setEscalateSuccess(true);
      await loadTicket();
    } catch (err) {
      console.error('Failed to escalate ticket:', err);
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return (
      <div className="web-tickets-page" style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
        <Loader2 size={36} className="animate-spin" color="#2563eb" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="web-tickets-page">
        <div style={{ background: '#fef2f2', padding: 24, borderRadius: 16, color: '#dc2626' }}>
          {error || 'Müraciət tapılmadı.'}
          <div style={{ marginTop: 16 }}>
            <Link to="/account/tickets" className="web-ticket-btn-primary">
              Müraciətlərə Qayıt
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="web-tickets-page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <Link to="/account/tickets" className="web-ticket-btn-primary" style={{ background: '#f1f5f9', color: '#0f172a', boxShadow: 'none', padding: '8px 14px' }}>
          <ArrowLeft size={16} />
          <span>Geri</span>
        </Link>
        <div className="web-tickets-title-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="web-ticket-badge-code">{ticket.ticketNumber}</span>
            <span className="web-ticket-badge-status waiting">{ticket.status}</span>
          </div>
          <h1 style={{ marginTop: 6 }}>{ticket.subject}</h1>
        </div>

        {ticket.status !== 'RESOLVED' && ticket.status !== 'ESCALATED_TO_ADMIN' && (
          <button
            type="button"
            onClick={handleEscalate}
            disabled={escalating}
            style={{
              marginLeft: 'auto',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '10px 16px',
              borderRadius: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={16} />
            <span>Moderatora Yönləndir</span>
          </button>
        )}
      </div>

      {escalateSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: 14, borderRadius: 12, marginBottom: 20 }}>
          Müraciətiniz SuperAdmin moderator komandasına yönləndirildi. Yaxın zamanda tərəfsiz araşdırma aparılacaq.
        </div>
      )}

      {/* Ticket Details Summary Card */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b' }}>Kateqoriya:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{ticket.category.replace(/_/g, ' ')}</div>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Cavabdeh Şirkət:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{ticket.company?.name || 'TOURSALES Dəstək'}</div>
          </div>
          {ticket.requestedRefund && (
            <div>
              <span style={{ color: '#64748b' }}>Tələb Olunan Məbləğ:</span>
              <div style={{ fontWeight: 800, color: '#16a34a' }}>{ticket.requestedRefund} ₼</div>
            </div>
          )}
          <div>
            <span style={{ color: '#64748b' }}>Açılma Tarixi:</span>
            <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(ticket.createdAt).toLocaleDateString('az-AZ')}</div>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        {ticket.messages && ticket.messages.map((m) => {
          const isUser = m.senderRole === 'USER';
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isUser ? '#eff6ff' : '#ffffff',
                border: `1px solid ${isUser ? '#bfdbfe' : '#e2e8f0'}`,
                borderRadius: 16,
                padding: '16px 20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.8rem', fontWeight: 700, color: isUser ? '#2563eb' : '#0f172a' }}>
                {isUser ? <User size={14} /> : <Building size={14} />}
                <span>{isUser ? 'Siz' : ticket.company?.name || 'Dəstək Meneceri'}</span>
                <span style={{ color: '#94a3b8', fontWeight: 500, marginLeft: 'auto' }}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.5 }}>
                {m.message}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Composer */}
      {ticket.status !== 'CLOSED' && (
        <form onSubmit={handleSendReply} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', gap: 12 }}>
          <textarea
            rows={2}
            style={{ flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '0.95rem', color: '#0f172a' }}
            placeholder="Cavabınızı və ya əlavə məlumatı daxil edin..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !replyText.trim()}
            className="web-ticket-btn-primary"
            style={{ padding: '10px 20px', alignSelf: 'flex-end' }}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>Göndər</span>
          </button>
        </form>
      )}
    </div>
  );
};
