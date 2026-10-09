import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Lock,
  DollarSign,
  ShieldAlert,
  Loader2,
  X,
  Ticket,
  Calendar,
  RotateCw,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  User as UserIcon,
  Phone,
  Paperclip,
  Sparkles,
  Plus,
  FileText,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { vendorSupportApi } from '../../api/vendorSupportApi';
import { SupportTicket, CannedResponse } from '@toursales/types';
import vendorSocketService, { playNotificationSound } from '../../../../shared/services/vendorSocketService';
import './VendorTicketsPage.css';

export const VendorTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // KPI Stats
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    waiting: 0,
    critical: 0,
    resolved: 0,
    escalated: 0,
    closed: 0,
  });

  // Detail Modal / Drawer
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  // Attachments State
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string; size?: number; type?: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canned Responses
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [showCannedMenu, setShowCannedMenu] = useState(false);

  // Refund approval state
  const [approvedRefundInput, setApprovedRefundInput] = useState<string>('');
  const [updatingRefund, setUpdatingRefund] = useState(false);

  // Status updating
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Escalation prompt
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  // New Vendor -> Platform Ticket Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('GENERAL_SUPPORT');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vendorSupportApi.getTickets({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        priority: priorityFilter !== 'ALL' ? priorityFilter : undefined,
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
      });

      setTickets(res.tickets || []);
      if (res.stats) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Load Canned Responses once
  useEffect(() => {
    vendorSupportApi.getCannedResponses()
      .then(res => setCannedResponses(res || []))
      .catch(err => console.error('Failed to load canned responses:', err));
  }, []);

  // WebSocket Live Real-time Connection
  useEffect(() => {
    vendorSocketService.connect();

    const unsubReply = vendorSocketService.onTicketReply(({ ticketId, reply, ticket }: { ticketId: string; reply: any; ticket: any }) => {
      playNotificationSound();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(prev => prev ? {
          ...prev,
          status: ticket?.status || prev.status,
          messages: [...(prev.messages || []), reply],
        } : null);
      }
      fetchTickets();
    });

    const unsubStatus = vendorSocketService.onTicketStatusChange(({ ticketId, ticket }: { ticketId: string; ticket: any }) => {
      playNotificationSound();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(ticket);
      }
      fetchTickets();
    });

    const unsubCreated = vendorSocketService.onTicketCreated(() => {
      playNotificationSound();
      fetchTickets();
    });

    const unsubUpdated = vendorSocketService.onTicketUpdated(() => {
      fetchTickets();
    });

    return () => {
      unsubReply();
      unsubStatus();
      unsubCreated();
      unsubUpdated();
    };
  }, [selectedTicket, fetchTickets]);

  // Join/Leave socket room for selected ticket
  useEffect(() => {
    if (selectedTicket?.id) {
      vendorSocketService.joinTicket(selectedTicket.id);
      return () => {
        vendorSocketService.leaveTicket(selectedTicket.id);
      };
    }
  }, [selectedTicket?.id]);

  const openTicketDetail = async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const full = await vendorSupportApi.getTicket(ticketId);
      setSelectedTicket(full);
      setApprovedRefundInput(full.approvedRefund !== undefined && full.approvedRefund !== null ? String(full.approvedRefund) : '');
      setAttachments([]);
      setShowCannedMenu(false);
    } catch (err) {
      console.error('Failed to get ticket detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploaded = await vendorSupportApi.uploadFile(file);
      setAttachments(prev => [
        ...prev,
        {
          url: uploaded.url,
          name: uploaded.originalName || uploaded.filename,
          size: uploaded.size,
          type: uploaded.mimetype,
        },
      ]);
    } catch (err) {
      console.error('Failed to upload file:', err);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || sendingReply) return;

    setSendingReply(true);
    try {
      await vendorSupportApi.replyTicket(selectedTicket.id, {
        message: replyText.trim(),
        isInternalNote,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      setReplyText('');
      setAttachments([]);
      // Reload ticket detail
      const refreshed = await vendorSupportApi.getTicket(selectedTicket.id);
      setSelectedTicket(refreshed);
      fetchTickets();
    } catch (err) {
      console.error('Failed to reply to ticket:', err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (newStatus: any) => {
    if (!selectedTicket || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const updated = await vendorSupportApi.updateTicket(selectedTicket.id, {
        status: newStatus,
      });
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedTicket || updatingRefund) return;
    const amount = parseFloat(approvedRefundInput);
    if (isNaN(amount) || amount < 0) return;

    setUpdatingRefund(true);
    try {
      const updated = await vendorSupportApi.updateTicket(selectedTicket.id, {
        approvedRefund: amount,
        status: 'RESOLVED',
      });
      setSelectedTicket(updated);
      fetchTickets();
    } catch (err) {
      console.error('Failed to approve refund:', err);
    } finally {
      setUpdatingRefund(false);
    }
  };

  const handleEscalateToAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !escalateReason.trim() || escalating) return;

    setEscalating(true);
    try {
      const updated = await vendorSupportApi.escalateTicket(selectedTicket.id, escalateReason.trim());
      setSelectedTicket(updated);
      setShowEscalateModal(false);
      setEscalateReason('');
      fetchTickets();
    } catch (err) {
      console.error('Failed to escalate ticket:', err);
    } finally {
      setEscalating(false);
    }
  };

  const handleCreatePlatformTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || creatingTicket) return;

    setCreatingTicket(true);
    try {
      await vendorSupportApi.createTicket({
        subject: newSubject.trim(),
        description: newDescription.trim(),
        category: newCategory,
        priority: newPriority,
      });
      setShowCreateModal(false);
      setNewSubject('');
      setNewDescription('');
      fetchTickets();
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const renderStatusBadge = (status: string, isEscalated?: boolean) => {
    if (isEscalated || status === 'ESCALATED_TO_ADMIN') {
      return (
        <span className="vendor-status-badge escalated">
          <ShieldAlert size={12} /> Arbitrajda
        </span>
      );
    }
    switch (status) {
      case 'OPEN':
        return (
          <span className="vendor-status-badge open">
            <AlertTriangle size={12} /> Açıq
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="vendor-status-badge in_progress">
            <Clock size={12} /> İcrada
          </span>
        );
      case 'WAITING_CUSTOMER':
        return (
          <span className="vendor-status-badge waiting">
            <Clock size={12} /> Müştəri Gözləyir
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="vendor-status-badge resolved">
            <CheckCircle2 size={12} /> Həll Edildi
          </span>
        );
      case 'CLOSED':
        return (
          <span className="vendor-status-badge closed">
            <XCircle size={12} /> Bağlandı
          </span>
        );
      default:
        return <span className="vendor-status-badge closed">{status}</span>;
    }
  };

  const renderPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === 'URGENT' || p === 'CRITICAL') {
      return (
        <span className="vendor-priority-badge critical">
          <LifeBuoy size={12} /> Təcili
        </span>
      );
    }
    if (p === 'HIGH') {
      return <span className="vendor-priority-badge high">Yüksək</span>;
    }
    if (p === 'MEDIUM') {
      return <span className="vendor-priority-badge medium">Orta</span>;
    }
    return <span className="vendor-priority-badge low">Aşağı</span>;
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'REFUND_REQUEST':
        return 'Geri Qaytarılma (Refund)';
      case 'DATE_OR_SEAT_CHANGE':
        return 'Tarix / Yer Dəyişimi';
      case 'COMPLAINT':
        return 'Müştəri Şikayəti';
      case 'PAYMENT_ISSUE':
        return 'Ödəniş Problemi';
      case 'HOTEL_INQUIRY':
        return 'Otel Sorğusu';
      case 'FINANCIAL_DISPUTE':
        return 'Maliyyə & Balans Çıxarışı';
      case 'TECHNICAL_ISSUE':
        return 'Texniki Problem';
      case 'TOUR_APPROVAL':
        return 'Tur Təsdiqi Məsələsi';
      case 'GENERAL_SUPPORT':
      default:
        return 'Ümumi Dəstək';
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'Bütün Biletlər', count: stats.total },
    { key: 'OPEN', label: 'Açıq & İcrada', count: stats.open },
    { key: 'WAITING_CUSTOMER', label: 'Müştəri Gözləyir', count: stats.waiting },
    { key: 'ESCALATED_TO_ADMIN', label: '⚠️ Arbitrajda', count: stats.escalated, isWarning: true },
    { key: 'RESOLVED', label: 'Həll Edilmiş', count: stats.resolved },
    { key: 'CLOSED', label: 'Bağlanmış', count: stats.closed },
  ];

  return (
    <div className="vendor-tickets-page">
      {/* Page Title & Quick Actions */}
      <div className="vendor-tickets-header-row">
        <div>
          <h2 className="vendor-tickets-header-title">Dəstək Biletləri və Mübahisələr</h2>
          <p className="vendor-tickets-header-sub">
            Müştərilərin ləğvetmə müraciətləri, şikayətləri və platforma arbitraj biletlərinin idarə edilməsi
          </p>
        </div>

        <button
          type="button"
          className="vendor-ticket-create-btn"
          onClick={() => setShowCreateModal(true)}
          title="Platforma SuperAdmin Dəstəyinə yeni bilet açın"
        >
          <Plus size={16} />
          <span>Yeni Dəstək Bileti Aç</span>
        </button>
      </div>

      {/* Top 5 Interactive KPI Cards */}
      <div className="vendor-tickets-kpi-grid">
        <div
          className={`vendor-ticket-kpi-card ${statusFilter === 'OPEN' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'OPEN' ? 'ALL' : 'OPEN')}
          title="Açıq və ya İcrada olan biletləri süzgəcdən keçir"
        >
          <div>
            <div className="vendor-ticket-kpi-val" style={{ color: '#ef4444' }}>{stats.open}</div>
            <div className="vendor-ticket-kpi-label">Açıq / İcrada</div>
          </div>
          <div className="vendor-ticket-kpi-icon-wrap" style={{ background: '#fee2e2', color: '#ef4444' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div
          className={`vendor-ticket-kpi-card ${statusFilter === 'WAITING_CUSTOMER' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'WAITING_CUSTOMER' ? 'ALL' : 'WAITING_CUSTOMER')}
          title="Müştərinin cavabını gözləyən biletlər"
        >
          <div>
            <div className="vendor-ticket-kpi-val" style={{ color: '#ca8a04' }}>{stats.waiting}</div>
            <div className="vendor-ticket-kpi-label">Müştəri Gözləyən</div>
          </div>
          <div className="vendor-ticket-kpi-icon-wrap" style={{ background: '#fef9c3', color: '#ca8a04' }}>
            <Clock size={22} />
          </div>
        </div>

        <div
          className={`vendor-ticket-kpi-card ${statusFilter === 'ESCALATED_TO_ADMIN' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'ESCALATED_TO_ADMIN' ? 'ALL' : 'ESCALATED_TO_ADMIN')}
          title="SuperAdmin Arbitrajına göndərilmiş mübahisəli biletlər"
        >
          <div>
            <div className="vendor-ticket-kpi-val" style={{ color: '#dc2626' }}>{stats.escalated}</div>
            <div className="vendor-ticket-kpi-label">SuperAdmin Arbitrajı</div>
          </div>
          <div className="vendor-ticket-kpi-icon-wrap" style={{ background: '#fee2e2', color: '#dc2626' }}>
            <ShieldAlert size={22} />
          </div>
        </div>

        <div
          className={`vendor-ticket-kpi-card ${priorityFilter === 'URGENT' ? 'active' : ''}`}
          onClick={() => setPriorityFilter(priorityFilter === 'URGENT' ? 'ALL' : 'URGENT')}
          title="Təcili və ya yüksək prioritetli biletlər"
        >
          <div>
            <div className="vendor-ticket-kpi-val" style={{ color: '#ea580c' }}>{stats.critical}</div>
            <div className="vendor-ticket-kpi-label">Təcili / Kritik</div>
          </div>
          <div className="vendor-ticket-kpi-icon-wrap" style={{ background: '#ffedd5', color: '#ea580c' }}>
            <LifeBuoy size={22} />
          </div>
        </div>

        <div
          className={`vendor-ticket-kpi-card ${statusFilter === 'RESOLVED' ? 'active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'RESOLVED' ? 'ALL' : 'RESOLVED')}
          title="Uğurla həll edilmiş biletlər"
        >
          <div>
            <div className="vendor-ticket-kpi-val" style={{ color: '#059669' }}>{stats.resolved}</div>
            <div className="vendor-ticket-kpi-label">Həll Edilmiş</div>
          </div>
          <div className="vendor-ticket-kpi-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Quick Status Pill Tabs */}
      <div className="vendor-tickets-tabs">
        {statusTabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`vendor-tickets-tab-pill ${statusFilter === tab.key ? 'active' : ''} ${
              tab.isWarning ? 'warning' : ''
            }`}
            onClick={() => setStatusFilter(tab.key)}
          >
            <span>{tab.label}</span>
            <span className="vendor-tickets-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="vendor-tickets-filter-bar">
        <div className="vendor-tickets-filter-left">
          <div className="vendor-tickets-search-wrap">
            <Search size={16} className="vendor-tickets-search-icon" />
            <input
              type="text"
              className="vendor-tickets-search-input"
              placeholder="Bilet №, mövzu, müştəri adı..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            className="vendor-tickets-select"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Bütün Prioritetlər</option>
            <option value="URGENT">Təcili / Kritik (URGENT)</option>
            <option value="HIGH">Yüksək (HIGH)</option>
            <option value="MEDIUM">Orta (MEDIUM)</option>
            <option value="LOW">Aşağı (LOW)</option>
          </select>

          <select
            className="vendor-tickets-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">Bütün Kateqoriyalar</option>
            <option value="REFUND_REQUEST">Geri Qaytarılma (Refund)</option>
            <option value="DATE_OR_SEAT_CHANGE">Tarix / Yer Dəyişimi</option>
            <option value="COMPLAINT">Müştəri Şikayəti</option>
            <option value="PAYMENT_ISSUE">Ödəniş Problemi</option>
            <option value="GENERAL_SUPPORT">Ümumi Dəstək</option>
          </select>
        </div>

        <button
          type="button"
          className="vendor-ticket-action-btn"
          onClick={fetchTickets}
          disabled={loading}
          title="Məlumatları yenilə"
        >
          <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Yenilə</span>
        </button>
      </div>

      {/* Tickets Table */}
      <div className="vendor-tickets-table-card">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12 }}>
            <Loader2 size={32} className="animate-spin" color="#2563eb" />
            <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Biletlər yüklənir...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <LifeBuoy size={42} color="#cbd5e1" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#334155' }}>
              Heç bir dəstək bileti tapılmadı
            </div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>
              Seçilmiş filtrlərə uyğun bilet yoxdur və ya hazırda yeni müraciət mövcud deyil.
            </div>
          </div>
        ) : (
          <table className="vendor-tickets-table">
            <thead>
              <tr>
                <th>Bilet №</th>
                <th>Müştəri</th>
                <th>Mövzu & Rezervasiya</th>
                <th>Prioritet</th>
                <th>Status</th>
                <th>Maliyyə / Qaytarılma</th>
                <th>Tarix</th>
                <th>Əməliyyat</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const userInitial = (ticket.user?.name || 'M')[0].toUpperCase();

                return (
                  <tr key={ticket.id}>
                    <td>
                      <span className="vendor-ticket-num">{ticket.ticketNumber}</span>
                      {ticket.escalatedToAdmin && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.72rem',
                            color: '#dc2626',
                            fontWeight: 700,
                            marginTop: 4,
                            background: '#fee2e2',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          <ShieldAlert size={11} /> Arbitrajda
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="vendor-ticket-user-wrap">
                        <div className="vendor-ticket-avatar">{userInitial}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{ticket.user?.name || 'Müştəri'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {ticket.user?.phoneNumber || ticket.user?.email || 'Əlaqə qeyd edilməyib'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{ticket.subject}</div>
                      {ticket.booking && (
                        <div className="vendor-ticket-booking-chip" title="Əlaqəli Rezervasiya">
                          <Ticket size={11} />
                          <span>
                            Tur: {ticket.booking.tourTitle} ({ticket.booking.seats} yer) • {ticket.booking.paidAmount} ₼
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="vendor-ticket-cat-badge">{getCategoryLabel(ticket.category)}</span>
                      </div>
                    </td>
                    <td>{renderPriorityBadge(ticket.priority)}</td>
                    <td>{renderStatusBadge(ticket.status, ticket.escalatedToAdmin)}</td>
                    <td>
                      {ticket.requestedRefund ? (
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#b45309' }}>
                            Tələb: {ticket.requestedRefund} ₼
                          </span>
                          {ticket.approvedRefund !== undefined && ticket.approvedRefund !== null && (
                            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                              Təsdiq: {ticket.approvedRefund} ₼
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(ticket.createdAt).toLocaleDateString('az-AZ', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {new Date(ticket.createdAt).toLocaleTimeString('az-AZ', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="vendor-ticket-action-btn"
                        onClick={() => openTicketDetail(ticket.id)}
                      >
                        <span>Baxış</span>
                        <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Ticket Detail Drawer */}
      {selectedTicket && (
        <div className="vendor-ticket-modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="vendor-ticket-modal-content" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="vendor-ticket-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="vendor-ticket-num" style={{ fontSize: '1.25rem' }}>
                    {selectedTicket.ticketNumber}
                  </span>
                  {renderStatusBadge(selectedTicket.status, selectedTicket.escalatedToAdmin)}
                  {renderPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.2rem', color: '#0f172a' }}>
                  {selectedTicket.subject}
                </h3>
                <div style={{ fontSize: '0.84rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <UserIcon size={14} />
                  <span>
                    Müştəri: <strong>{selectedTicket.user?.name || 'Müştəri'}</strong>
                  </span>
                  <span>•</span>
                  <span>{selectedTicket.user?.phoneNumber || selectedTicket.user?.email}</span>
                </div>

                {/* Direct Contact Actions */}
                <div className="vendor-ticket-contact-actions">
                  {selectedTicket.user?.phoneNumber && (
                    <>
                      <a
                        href={`tel:${selectedTicket.user.phoneNumber}`}
                        className="vendor-ticket-contact-btn phone"
                        title="Müştəriyə birbaşa zəng et"
                      >
                        <Phone size={12} />
                        <span>Zəng et</span>
                      </a>
                      <a
                        href={`https://wa.me/${selectedTicket.user.phoneNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-ticket-contact-btn whatsapp"
                        title="WhatsApp ilə əlaqə saxla"
                      >
                        <MessageSquare size={12} />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}
                  <a
                    href="/vendor/chat"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vendor-ticket-contact-btn chat"
                    title="Müştəri Çatında canlı yazışmaya keç"
                  >
                    <ExternalLink size={12} />
                    <span>Müştəri Çatı</span>
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  className="vendor-tickets-select"
                  value={selectedTicket.status}
                  disabled={updatingStatus}
                  onChange={e => handleUpdateStatus(e.target.value)}
                >
                  <option value="OPEN">Açıq (OPEN)</option>
                  <option value="IN_PROGRESS">İcrada (IN_PROGRESS)</option>
                  <option value="WAITING_CUSTOMER">Müştəri Gözləyir (WAITING)</option>
                  <option value="RESOLVED">Həll Edildi (RESOLVED)</option>
                  <option value="CLOSED">Bağlandı (CLOSED)</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Linked Booking Box */}
            {selectedTicket.booking && (
              <div className="vendor-ticket-booking-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Ticket size={18} color="#059669" />
                    <span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.92rem' }}>
                      Əlaqəli Rezervasiya: #{selectedTicket.booking.id}
                    </span>
                  </div>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    Ödəniş: {selectedTicket.booking.paymentStatus || 'PAID'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, fontSize: '0.84rem', color: '#166534' }}>
                  <div>
                    Tur: <strong>{selectedTicket.booking.title || selectedTicket.booking.tourTitle}</strong>
                  </div>
                  {selectedTicket.booking.startDate && (
                    <div>
                      Səfər Tarixi: <strong>{new Date(selectedTicket.booking.startDate).toLocaleDateString('az-AZ')}</strong>
                    </div>
                  )}
                  <div>
                    Yer sayı: <strong>{selectedTicket.booking.seats || 1} nəfər</strong>
                  </div>
                  <div>
                    Ödənilən Məbləğ: <strong>{selectedTicket.booking.paidAmount || selectedTicket.booking.totalAmount} ₼</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Departure Countdown & Policy Recommendation Box */}
            <div className="vendor-ticket-policy-box">
              <ShieldAlert size={24} color="#ca8a04" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#854d0e', fontSize: '0.92rem' }}>
                  Ağıllı Ləğvetmə və Qaytarılma Siyasəti:
                </div>
                <p style={{ margin: '4px 0 8px', fontSize: '0.85rem', color: '#a16207', lineHeight: 1.4 }}>
                  {selectedTicket.cancellationPolicyAnalysis?.policyExplanation || (
                    <>
                      Müştərinin səfər tarixinə görə rəsmi siyasət:
                      <br />
                      • 7 və daha çox gün qalmış: <strong>100%</strong> geri qaytarılma
                      <br />
                      • 3 - 7 gün qalmış: <strong>70%</strong> geri qaytarılma
                      <br />
                      • 3 gündən az qalmış: <strong>0%</strong> (geri qaytarılmır)
                    </>
                  )}
                </p>

                {selectedTicket.cancellationPolicyAnalysis && (
                  <div style={{ fontSize: '0.82rem', color: '#854d0e', marginBottom: 10, background: '#fef9c3', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      Səfərə qalan vaxt: <strong>{selectedTicket.cancellationPolicyAnalysis.daysLeft} gün</strong> • 
                      Qaytarılma faizi: <strong>{selectedTicket.cancellationPolicyAnalysis.refundPercent}%</strong>
                    </div>
                    {selectedTicket.cancellationPolicyAnalysis.recommendedAmount !== undefined && (
                      <button
                        type="button"
                        className="vendor-ticket-apply-btn"
                        onClick={() => setApprovedRefundInput(String(selectedTicket.cancellationPolicyAnalysis?.recommendedAmount))}
                        title="Tövsiyə olunan bu məbləği təsdiq qutusuna yaz"
                      >
                        <DollarSign size={12} />
                        <span>Tövsiyə Olunanı Tətbiq Et ({selectedTicket.cancellationPolicyAnalysis.recommendedAmount} ₼)</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Approved Refund Banner */}
                {selectedTicket.approvedRefund !== undefined && selectedTicket.approvedRefund !== null && (
                  <div style={{ marginBottom: 10 }}>
                    <div className="vendor-ticket-approved-badge">
                      <CheckCircle2 size={16} color="#059669" />
                      <span>Rəsmi Təsdiq Edilmiş Qaytarılma: {selectedTicket.approvedRefund} ₼</span>
                    </div>
                  </div>
                )}

                {selectedTicket.requestedRefund && (
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: '1px solid #fef08a',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Müştərinin Tələb Etdiyi: </span>
                      <strong style={{ color: '#b45309' }}>{selectedTicket.requestedRefund} ₼</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="number"
                        placeholder="Məbləğ ₼"
                        value={approvedRefundInput}
                        onChange={e => setApprovedRefundInput(e.target.value)}
                        style={{
                          width: 100,
                          padding: '5px 8px',
                          borderRadius: 6,
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApproveRefund}
                        disabled={updatingRefund || !approvedRefundInput}
                        style={{
                          padding: '6px 12px',
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        {updatingRefund ? 'Təsdiqlənir...' : selectedTicket.approvedRefund !== null && selectedTicket.approvedRefund !== undefined ? 'Məbləği Yenilə' : 'Qaytarmaya Təsdiq Ver'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Escalate to Admin Button / Info */}
            {!selectedTicket.escalatedToAdmin && (
              <div style={{ padding: '0 24px 12px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(true)}
                  style={{
                    background: '#fff1f2',
                    border: '1px solid #fecdd3',
                    color: '#e11d48',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ShieldAlert size={14} />
                  <span>SuperAdmin Arbitrajına Yönləndir</span>
                </button>
              </div>
            )}

            {selectedTicket.escalatedToAdmin && (
              <div
                style={{
                  margin: '0 24px 14px',
                  padding: '12px 16px',
                  borderRadius: 10,
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  fontSize: '0.86rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 4 }}>
                  <ShieldAlert size={18} />
                  <span>Bu bilet SuperAdmin Arbitrajına yönləndirilib</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#7f1d1d', lineHeight: 1.4 }}>
                  Müştəri ilə razılaşma əldə olunmadığı üçün bilet platforma rəhbərliyinin bitərəf araşdırmasındadır.
                  {selectedTicket.internalNotes && (
                    <div
                      style={{
                        marginTop: 6,
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontWeight: 600,
                      }}
                    >
                      {selectedTicket.internalNotes}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages Thread */}
            <div className="vendor-ticket-messages-thread">
              {detailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <Loader2 size={28} className="animate-spin" color="#2563eb" />
                </div>
              ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`vendor-ticket-msg-card ${msg.isInternalNote ? 'internal-note' : ''}`}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {msg.sender?.name || (msg.senderRole === 'VENDOR' ? 'Tur Şirkəti' : 'İstifadəçi')}
                        </span>
                        {msg.sender?.roleLabel && (
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: msg.senderRole === 'VENDOR' ? '#2563eb' : '#64748b',
                              background: msg.senderRole === 'VENDOR' ? '#eff6ff' : '#f1f5f9',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {msg.sender.roleLabel}
                          </span>
                        )}
                        {msg.isInternalNote && (
                          <span
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Lock size={10} /> Yalnız Heyət Görür (Daxili Qeyd)
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {new Date(msg.createdAt).toLocaleString('az-AZ')}
                      </span>
                    </div>

                    <div style={{ color: '#334155', lineHeight: 1.5 }}>{msg.message}</div>

                    {/* Message Attachments */}
                    {msg.attachmentsList && msg.attachmentsList.length > 0 && (
                      <div className="vendor-ticket-msg-attachments">
                        {msg.attachmentsList.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="vendor-ticket-file-chip"
                          >
                            <FileText size={14} color="#2563eb" />
                            <span>{att.name}</span>
                            <Download size={12} color="#64748b" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>
                  Mesaj yoxdur.
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <div className="vendor-ticket-reply-box" style={{ position: 'relative' }}>
              <form onSubmit={handleSendReply}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isInternalNote ? '#b45309' : '#334155',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={e => setIsInternalNote(e.target.checked)}
                    />
                    <Lock size={13} />
                    <span>Daxili Qeyd Kimi Əlavə Et (Müştəri Görmür)</span>
                  </label>

                  {/* Canned Responses Trigger */}
                  {cannedResponses.length > 0 && (
                    <div style={{ position: 'relative' }}>
                      <button
                        type="button"
                        className="vendor-ticket-tool-btn"
                        onClick={() => setShowCannedMenu(!showCannedMenu)}
                        title="Tez-tez istifadə olunan cavab şablonları"
                      >
                        <Sparkles size={14} color="#f59e0b" />
                        <span>Şablon Cavablar ({cannedResponses.length})</span>
                      </button>

                      {showCannedMenu && (
                        <div className="vendor-ticket-canned-dropdown">
                          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', padding: '4px 8px', borderBottom: '1px solid #f1f5f9' }}>
                            Cavab Şablonu Seçin:
                          </div>
                          {cannedResponses.map(cr => (
                            <div
                              key={cr.id}
                              className="vendor-ticket-canned-item"
                              onClick={() => {
                                setReplyText(prev => prev ? `${prev}\n${cr.content}` : cr.content);
                                setShowCannedMenu(false);
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{cr.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {cr.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Attachments Preview Bar */}
                {attachments.length > 0 && (
                  <div className="vendor-ticket-attachment-preview-bar">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="vendor-ticket-attachment-tag">
                        <FileText size={12} />
                        <span>{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  required
                  rows={3}
                  placeholder={
                    isInternalNote
                      ? 'Daxili heyət üçün qeyd yazın (müştəri görməyəcək)...'
                      : 'Müştəriyə rəsmi cavab yazın...'
                  }
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: isInternalNote ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                    background: isInternalNote ? '#fffbeb' : '#ffffff',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'none',
                  }}
                />

                <div className="vendor-ticket-composer-tools">
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      className="vendor-ticket-tool-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                    >
                      {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                      <span>{uploadingFile ? 'Yüklənir...' : 'Sənəd / Qəbz Əlavə Et'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingReply}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: isInternalNote ? '#d97706' : '#2563eb',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {sendingReply ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>{isInternalNote ? 'Daxili Qeydi Saxla' : 'Müştəriyə Göndər'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              width: 480,
              maxWidth: '90vw',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 10px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={20} />
              <span>SuperAdmin Arbitrajına Göndər</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 14px', lineHeight: 1.4 }}>
              Müştəri ilə razılığa gələ bilmədikdə, bileti platforma rəhbərliyinə yönləndirərək bitərəf qərar
              tələb edə bilərsiniz. Platforma hər iki tərəfin sübutlarını araşdıracaq.
            </p>

            <form onSubmit={handleEscalateToAdmin}>
              <textarea
                required
                rows={4}
                placeholder="Yönləndirmə səbəbini və mübahisə detallarını qeyd edin..."
                value={escalateReason}
                onChange={e => setEscalateReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none',
                  marginBottom: 16,
                  fontFamily: 'inherit',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={escalating || !escalateReason.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {escalating ? 'Yönləndirilir...' : 'Arbitraja Təsdiq Et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Vendor-to-Platform Support Ticket Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              width: 520,
              maxWidth: '90vw',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.15rem' }}>
                <LifeBuoy size={20} color="#2563eb" />
                <span>Platforma Dəstəyinə Yeni Bilet Aç</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: '#64748b', margin: '0 0 16px', lineHeight: 1.4 }}>
              Tur təsdiqləri, balans/komissiya çıxarışları və ya sistem texniki xətaları ilə bağlı SuperAdmin rəhbərliyinə rəsmi bilet açın.
            </p>

            <form onSubmit={handleCreatePlatformTicket}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Mövzu *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Müraciətin qısa mövzusu..."
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Kateqoriya
                  </label>
                  <select
                    className="vendor-tickets-select"
                    style={{ width: '100%' }}
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                  >
                    <option value="FINANCIAL_DISPUTE">Maliyyə & Balans</option>
                    <option value="TOUR_APPROVAL">Tur Təsdiqi Məsələsi</option>
                    <option value="TECHNICAL_ISSUE">Texniki Problem</option>
                    <option value="GENERAL_SUPPORT">Ümumi Dəstək</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Prioritet
                  </label>
                  <select
                    className="vendor-tickets-select"
                    style={{ width: '100%' }}
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                  >
                    <option value="LOW">Aşağı (LOW)</option>
                    <option value="MEDIUM">Orta (MEDIUM)</option>
                    <option value="HIGH">Yüksək (HIGH)</option>
                    <option value="URGENT">Təcili (URGENT)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Müraciət Mətni *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Problemin təfərrüatlarını ətraflı qeyd edin..."
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.88rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Bağla
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket || !newSubject.trim() || !newDescription.trim()}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {creatingTicket ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                  <span>{creatingTicket ? 'Yaradılır...' : 'Bileti Yarat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
