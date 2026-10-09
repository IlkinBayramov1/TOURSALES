import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  DollarSign,
  Send,
  Eye,
  X
} from 'lucide-react';
import { adminDisputesApi } from '../../api/adminDisputesApi';
import { SupportTicket } from '@toursales/types';

export const DisputesArbitrationPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEscalated, setFilterEscalated] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [resolutionReason, setResolutionReason] = useState('');
  const [approvedRefund, setApprovedRefund] = useState('');
  const [rulingStatus, setRulingStatus] = useState('RESOLVED');
  const [submittingRuling, setSubmittingRuling] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminDisputesApi.getTickets({
        escalatedOnly: filterEscalated ? true : undefined,
        search: searchQuery.trim() || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error('Failed to load tickets for admin:', err);
    } finally {
      setLoading(false);
    }
  }, [filterEscalated, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const openTicketModal = async (id: string) => {
    setModalLoading(true);
    try {
      const full = await adminDisputesApi.getTicket(id);
      setSelectedTicket(full);
      setResolutionReason(full.resolutionReason || '');
      setApprovedRefund(full.approvedRefund ? String(full.approvedRefund) : '');
      setRulingStatus(full.status || 'RESOLVED');
    } catch (err) {
      console.error('Failed to get ticket:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleApplyRuling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || submittingRuling) return;

    setSubmittingRuling(true);
    try {
      const refundNum = approvedRefund ? parseFloat(approvedRefund) : undefined;
      const updated = await adminDisputesApi.updateTicketRuling(selectedTicket.id, {
        status: rulingStatus,
        approvedRefund: refundNum,
        resolutionReason: resolutionReason.trim(),
      });
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err) {
      console.error('Failed to submit arbitration ruling:', err);
    } finally {
      setSubmittingRuling(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Arbitraj və Mübahisəli Biletlər
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
            Müştəri və turizm agentliyi arasında razılaşdırılmayan eskalasiya olunmuş şikayətlər
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => setFilterEscalated(!filterEscalated)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: filterEscalated ? '#fee2e2' : '#ffffff',
              color: filterEscalated ? '#dc2626' : '#475569',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <ShieldAlert size={16} />
            <span>{filterEscalated ? 'Yalnız Arbitraja Verilənlər' : 'Bütün Biletlər'}</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: '#ffffff',
          padding: 16,
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          marginBottom: 20,
          display: 'flex',
          gap: 12,
        }}
      >
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Bilet №, müştəri və ya mövzu üzrə axtarış..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="button"
          onClick={fetchTickets}
          style={{
            padding: '8px 20px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Axtar
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <Loader2 size={32} className="animate-spin" color="#2563eb" />
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            Arbitrajda gözləyən bilet yoxdur.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Bilet №</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Müştəri</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Agentlik</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Mövzu</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Geri Qaytarılma</th>
                <th style={{ padding: '14px 18px', color: '#475569', fontWeight: 700 }}>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => (
                <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>
                    {ticket.ticketNumber}
                    {ticket.escalatedToAdmin && (
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#dc2626', fontWeight: 700 }}>
                        ⚠️ Arbitraj
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{ticket.user?.name || 'Müştəri'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.user?.phoneNumber || ticket.user?.email}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{ticket.company?.name || '—'}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600 }}>{ticket.subject}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ticket.category}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: ticket.status === 'RESOLVED' ? '#ecfdf5' : '#fee2e2',
                        color: ticket.status === 'RESOLVED' ? '#059669' : '#dc2626',
                      }}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div>Tələb: {ticket.requestedRefund ? `${ticket.requestedRefund} ₼` : '0 ₼'}</div>
                    {ticket.approvedRefund !== undefined && ticket.approvedRefund !== null && (
                      <div style={{ color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}>
                        Təsdiq: {ticket.approvedRefund} ₼
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      type="button"
                      onClick={() => openTicketModal(ticket.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#2563eb',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      Arbitraj Qərarı
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Ruling */}
      {selectedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setSelectedTicket(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 28,
              width: 640,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Scale size={24} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  SuperAdmin Arbitraj Qərarı: {selectedTicket.ticketNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Müştəri İddiası / Təsvir:</div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginTop: 4 }}>{selectedTicket.description}</div>
            </div>

            {selectedTicket.internalNotes && (
              <div style={{ background: '#fffbeb', padding: 14, borderRadius: 10, border: '1px solid #fde68a', marginBottom: 16 }}>
                <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 700 }}>Agentliyin Daxili Qeydləri:</div>
                <div style={{ color: '#92400e', marginTop: 4 }}>{selectedTicket.internalNotes}</div>
              </div>
            )}

            <form onSubmit={handleApplyRuling}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Arbitraj Qərarı (Status)
                </label>
                <select
                  value={rulingStatus}
                  onChange={e => setRulingStatus(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                >
                  <option value="RESOLVED">Həll Edildi (Müştəri lehinə və ya qarşılıqlı razılıq)</option>
                  <option value="CLOSED">Bağlandı (Agentlik lehinə / Şikayət əsassız)</option>
                  <option value="WAITING_CUSTOMER">Müştəridən Əlavə Sübut Tələb Edilir</option>
                  <option value="WAITING_VENDOR">Agentlikdən Əlavə Məlumat Tələb Edilir</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Təsdiq Edilən Platforma Qaytarılma Məbləği (AZN)
                </label>
                <input
                  type="number"
                  placeholder="Məsələn: 45"
                  value={approvedRefund}
                  onChange={e => setApprovedRefund(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Arbitraj Qərarının Rəsmi Əsaslandırması (Resolution Reason)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Platforma qaydalarına və tərəflərin təqdim etdiyi sübutlara əsasən..."
                  value={resolutionReason}
                  onChange={e => setResolutionReason(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={submittingRuling}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submittingRuling ? 'Qərar Verilir...' : 'Qərarı Təsdiq Et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
