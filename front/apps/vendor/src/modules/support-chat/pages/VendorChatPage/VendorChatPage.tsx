import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  ExternalLink,
  Zap,
  Plus,
  Loader2,
  CheckCheck,
  Building,
  Compass,
  Calendar,
  X,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  UserCheck,
  Phone,
  Award,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Archive,
  Sparkles,
  MessageCircle,
  Tag,
  RotateCcw,
  Mail,
  User,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { vendorSupportApi } from '../../api/vendorSupportApi';
import { vendorSocketService, playNotificationSound } from '../../../../shared/services/vendorSocketService';
import { Conversation, ChatMessage, CannedResponse, PinnedContextMeta } from '@toursales/types';
import './VendorChatPage.css';

interface CustomerCrmData {
  user: {
    id: string;
    name: string | null;
    email: string;
    phoneNumber: string | null;
    loyaltyPoints: number;
    status: string;
    createdAt: string;
  };
  totalBookingsCount: number;
  totalSpent: number;
  recentBookings: Array<{
    id: string;
    passengerName: string;
    passengerSurname: string;
    totalAmount: number | string;
    status: string;
    paymentStatus: string;
    bookingDate: string;
    seats: number;
    tour?: { id: string; title: string; startDate: string } | null;
  }>;
}

export const VendorChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [cannedResponses, setCannedResponses] = useState<CannedResponse[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterContext, setFilterContext] = useState<'ALL' | 'TOUR' | 'HOTEL' | 'BOOKING' | 'GENERAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Array<{ file: File; preview?: string }>>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // CRM Profile State (Stage 4)
  const [crmProfile, setCrmProfile] = useState<CustomerCrmData | null>(null);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [showCrmSidebar, setShowCrmSidebar] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Special Offer modal state (Stage 4)
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerTourName, setOfferTourName] = useState('');
  const [offerDiscountPercent, setOfferDiscountPercent] = useState('10');
  const [offerPromoCode, setOfferPromoCode] = useState('YAY2026');
  const [offerNote, setOfferNote] = useState('Sizin üçün xüsusi endirimli təklif təqdim edirik! Rezervasiya zamanı promokodu qeyd edin.');
  const [sendingOffer, setSendingOffer] = useState(false);

  // New canned modal
  const [showAddCannedModal, setShowAddCannedModal] = useState(false);
  const [newCannedTitle, setNewCannedTitle] = useState('');
  const [newCannedShortcut, setNewCannedShortcut] = useState('');
  const [newCannedContent, setNewCannedContent] = useState('');
  const [savingCanned, setSavingCanned] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations and canned responses
  const fetchConversations = useCallback(async () => {
    try {
      const data = await vendorSupportApi.getConversations();
      setConversations(data);
      if (!selectedConv && data.length > 0) {
        setSelectedConv(data[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedConv]);

  const fetchCanned = async () => {
    try {
      const data = await vendorSupportApi.getCannedResponses();
      setCannedResponses(data);
    } catch (err) {
      console.error('Failed to load canned responses:', err);
    }
  };

  // Connect Socket.io on mount
  useEffect(() => {
    vendorSocketService.connect();
    return () => {
      vendorSocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchCanned();
  }, [fetchConversations]);

  // Load messages and manage Socket room when selectedConv changes
  useEffect(() => {
    if (!selectedConv) return;

    let isMounted = true;
    setMessagesLoading(true);
    setCustomerTyping(false);

    // Join room
    vendorSocketService.joinChat(selectedConv.id);

    const loadMsgs = async () => {
      try {
        const msgs = await vendorSupportApi.getMessages(selectedConv.id);
        if (isMounted) {
          setMessages(msgs);
          if (selectedConv.unreadCountVendor > 0) {
            await vendorSupportApi.markAsRead(selectedConv.id);
            setConversations(prev =>
              prev.map(c => (c.id === selectedConv.id ? { ...c, unreadCountVendor: 0 } : c))
            );
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        if (isMounted) setMessagesLoading(false);
      }
    };

    loadMsgs();

    // Fallback sync polling every 12 seconds
    const interval = setInterval(async () => {
      try {
        const fresh = await vendorSupportApi.getMessages(selectedConv.id);
        if (isMounted) setMessages(fresh);
      } catch (e) {
        // silent
      }
    }, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      vendorSocketService.leaveChat(selectedConv.id);
    };
  }, [selectedConv]);

  // Load Customer CRM Profile when selectedConv changes (Stage 4)
  useEffect(() => {
    if (!selectedConv?.id) {
      setCrmProfile(null);
      return;
    }

    let isCurrent = true;
    setLoadingCrm(true);
    vendorSupportApi.getCustomerProfile(selectedConv.id)
      .then(profile => {
        if (isCurrent) {
          setCrmProfile(profile);
        }
      })
      .catch(err => {
        console.error('Failed to load CRM profile:', err);
        if (isCurrent) setCrmProfile(null);
      })
      .finally(() => {
        if (isCurrent) setLoadingCrm(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedConv?.id]);

  // Real-time Socket Event Listeners
  useEffect(() => {
    // 1. Listen for new incoming chat message
    const unsubMsg = vendorSocketService.onNewMessage((newMsg) => {
      if (selectedConv && newMsg.conversationId === selectedConv.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.senderRole === 'USER') {
          playNotificationSound();
          vendorSupportApi.markAsRead(selectedConv.id);
        }
      } else {
        // Message arrived in another conversation
        playNotificationSound();
        setConversations(prev =>
          prev.map(c =>
            c.id === newMsg.conversationId
              ? {
                  ...c,
                  unreadCountVendor: (c.unreadCountVendor || 0) + 1,
                  lastMessageText: newMsg.content || '[Fayl]',
                  lastMessage: newMsg.content || '[Fayl]',
                  lastMessageAt: newMsg.createdAt,
                }
              : c
          )
        );
      }
    });

    // 2. Listen for customer typing indicator
    let typingTimer: any = null;
    const unsubTyping = vendorSocketService.onTyping(({ conversationId, senderRole, isTyping }) => {
      if (selectedConv && selectedConv.id === conversationId && senderRole === 'USER') {
        setCustomerTyping(isTyping);
        clearTimeout(typingTimer);
        if (isTyping) {
          typingTimer = setTimeout(() => setCustomerTyping(false), 3500);
        }
      }
    });

    // 3. Listen for read status
    const unsubRead = vendorSocketService.onChatRead(({ conversationId, readerRole }) => {
      if (selectedConv && selectedConv.id === conversationId && readerRole === 'USER') {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      }
    });

    // 4. Listen for conversation updates
    const unsubUpdate = vendorSocketService.onConversationUpdated(({ conversationId, lastMessageText, lastMessageAt }) => {
      setConversations(prev =>
        prev.map(c =>
          c.id === conversationId
            ? { ...c, lastMessageText, lastMessage: lastMessageText, lastMessageAt }
            : c
        )
      );
    });

    return () => {
      unsubMsg();
      unsubTyping();
      unsubRead();
      unsubUpdate();
      clearTimeout(typingTimer);
    };
  }, [selectedConv]);

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selected = Array.from(e.target.files);
    const newItems = selected.map(file => {
      const isImg = file.type.startsWith('image/');
      return {
        file,
        preview: isImg ? URL.createObjectURL(file) : undefined,
      };
    });
    setPendingFiles(prev => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles(prev => {
      const target = prev[index];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const parseAttachments = (raw?: string | null | any): Array<{ url: string; name: string; size?: number; type?: string }> => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && pendingFiles.length === 0) || !selectedConv || sending || uploadingFile) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      let uploadedAttachments: Array<{ url: string; name: string; size?: number; type?: string }> = [];

      if (pendingFiles.length > 0) {
        setUploadingFile(true);
        for (const item of pendingFiles) {
          try {
            const uploaded = await vendorSupportApi.uploadFile(item.file);
            uploadedAttachments.push({
              url: uploaded.url,
              name: uploaded.originalName || item.file.name,
              size: uploaded.size || item.file.size,
              type: uploaded.mimetype || item.file.type,
            });
          } catch (uploadErr) {
            console.error('File upload failed for', item.file.name, uploadErr);
          }
        }
        setPendingFiles([]);
      }

      const sent = await vendorSupportApi.sendMessage(
        selectedConv.id,
        content,
        uploadedAttachments
      );
      setMessages(prev => [...prev, sent]);

      const displayLastMsg = content || (uploadedAttachments.length > 0 ? `[Fayl: ${uploadedAttachments[0].name}]` : '[Fayl göndərildi]');
      // Update last message in conversation list
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageText: displayLastMsg,
                lastMessage: displayLastMsg,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      setInputText(content);
    } finally {
      setSending(false);
      setUploadingFile(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Canned response selection
  const handleApplyCanned = (canned: CannedResponse) => {
    setInputText(prev => (prev ? `${prev} ${canned.content}` : canned.content));
  };

  // Delete canned response
  const handleDeleteCanned = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await vendorSupportApi.deleteCannedResponse(id);
      setCannedResponses(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to delete canned response:', err);
    }
  };

  // Create new canned response
  const handleSaveCanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCannedTitle.trim() || !newCannedContent.trim()) return;

    setSavingCanned(true);
    try {
      const shortcut = newCannedShortcut.startsWith('/')
        ? newCannedShortcut
        : `/${newCannedShortcut.replace(/[^a-zA-Z0-9]/g, '')}`;
      const saved = await vendorSupportApi.createCannedResponse({
        title: newCannedTitle.trim(),
        shortcut: shortcut || '/cavab',
        content: newCannedContent.trim(),
      });
      setCannedResponses(prev => [...prev, saved]);
      setShowAddCannedModal(false);
      setNewCannedTitle('');
      setNewCannedShortcut('');
      setNewCannedContent('');
    } catch (err) {
      console.error('Failed to create canned response:', err);
    } finally {
      setSavingCanned(false);
    }
  };

  // Update conversation status (Stage 4)
  const handleUpdateStatus = async (newStatus: 'ACTIVE' | 'RESOLVED' | 'ARCHIVED') => {
    if (!selectedConv || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await vendorSupportApi.updateConversationStatus(selectedConv.id, newStatus);
      setSelectedConv(prev => (prev ? { ...prev, status: newStatus } : null));
      setConversations(prev =>
        prev.map(c => (c.id === selectedConv.id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to update conversation status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Open Special Offer Modal (Stage 4)
  const handleOpenOfferModal = () => {
    if (pinned?.title) {
      setOfferTourName(pinned.title);
    } else {
      setOfferTourName('');
    }
    setShowOfferModal(true);
  };

  // Send Special Offer Message (Stage 4)
  const handleSendSpecialOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || sendingOffer) return;

    setSendingOffer(true);
    try {
      const offerMessage = 
`🎁 XÜSUSİ TƏKLİF & ENDİRİM:
──────────────────────
📌 Xidmət: ${offerTourName || 'Seçilmiş Xidmət'}
🏷️ Endirim: -${offerDiscountPercent}%
🎟️ Promokod: ${offerPromoCode || 'VIP-ENDİRİM'}
📝 Qeyd: ${offerNote}
──────────────────────
Rezervasiya edərkən bu promokoddan istifadə edərək dərhal endirim əldə edə bilərsiniz!`;

      const sent = await vendorSupportApi.sendMessage(selectedConv.id, offerMessage, []);
      setMessages(prev => [...prev, sent]);
      setShowOfferModal(false);
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedConv.id
            ? {
                ...c,
                lastMessageText: `🎁 Xüsusi Təklif: ${offerDiscountPercent}% endirim`,
                lastMessage: `🎁 Xüsusi Təklif: ${offerDiscountPercent}% endirim`,
                lastMessageAt: new Date().toISOString(),
              }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send special offer:', err);
    } finally {
      setSendingOffer(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (filterContext !== 'ALL' && c.contextType !== filterContext) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const userName = c.user?.name?.toLowerCase() || '';
      const lastMsg = (c.lastMessageText || c.lastMessage || '')?.toLowerCase();
      return userName.includes(q) || lastMsg.includes(q);
    }
    return true;
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCountVendor || 0), 0);

  const pinned: PinnedContextMeta | null = useMemo(() => {
    if (!selectedConv?.pinnedMeta) return null;
    if (typeof selectedConv.pinnedMeta === 'object') return selectedConv.pinnedMeta as PinnedContextMeta;
    try {
      return JSON.parse(selectedConv.pinnedMeta) as PinnedContextMeta;
    } catch {
      return null;
    }
  }, [selectedConv]);
  const formatDisplayDate = (d?: string | null) => {
    if (!d) return '';
    try {
      const date = new Date(d);
      if (isNaN(date.getTime())) return d;
      return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return d;
    }
  };

  const getPreviewText = (raw?: string | null) => {
    if (!raw) return 'Yeni söhbət başlandı';
    if (raw.includes('XÜSUSİ TƏKLİF')) {
      const discountMatch = raw.match(/Endirim:\s*([^\n🏷️🎟️]+)/i);
      return discountMatch ? `🎁 Fərdi Təklif (${discountMatch[1].trim()})` : '🎁 Fərdi Satış Təklifi';
    }
    return raw;
  };

  const renderSpecialOfferCard = (content: string, isVendor: boolean) => {
    const serviceMatch = content.match(/📌\s*(?:Xidmət:)?\s*([^\n🏷️🎟️📝]+)/i) || content.match(/Tur:\s*([^\n]+)/i);
    const discountMatch = content.match(/🏷️\s*(?:Endirim:)?\s*([^\n🎟️📝📌]+)/i) || content.match(/Endirim:\s*([^\n]+)/i);
    const promoMatch = content.match(/🎟️\s*(?:Promokod:)?\s*([^\n📝📌🏷️]+)/i) || content.match(/Promokod:\s*([^\n]+)/i);
    const noteMatch = content.match(/📝\s*(?:Qeyd:)?\s*([^\n─━]+)/i) || content.match(/Qeyd:\s*([^\n]+)/i);

    const service = serviceMatch ? serviceMatch[1].trim() : 'Fərdi Xidmət / Tur';
    const discount = discountMatch ? discountMatch[1].trim() : '';
    const promo = promoMatch ? promoMatch[1].replace(/[`]/g, '').trim() : '';
    const note = noteMatch ? noteMatch[1].trim() : '';

    return (
      <div className={`vendor-voucher-card ${isVendor ? 'outgoing-voucher' : 'incoming-voucher'}`}>
        <div className="vendor-voucher-badge-row">
          <div className="vendor-voucher-badge">
            <Sparkles size={12} />
            <span>FƏRDİ SATIŞ TƏKLİFİ</span>
          </div>
          {discount && <div className="vendor-voucher-discount-pill">{discount}</div>}
        </div>

        <div className="vendor-voucher-service-title">{service}</div>

        {promo && (
          <div className="vendor-voucher-coupon-wrap">
            <span className="vendor-voucher-coupon-label">Promokod:</span>
            <div className="vendor-voucher-coupon-box">
              <span className="vendor-voucher-coupon-code">{promo}</span>
              <button
                type="button"
                className="vendor-voucher-copy-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(promo);
                }}
                title="Kodu kopyala"
              >
                Kopyala
              </button>
            </div>
          </div>
        )}

        {note && <div className="vendor-voucher-note">{note}</div>}
      </div>
    );
  };

  return (
    <div className="vendor-chat-container">
      {/* Left Column: Conversation List */}
      <div className="vendor-chat-sidebar">
        <div className="vendor-chat-sidebar-header">
          <div className="vendor-chat-sidebar-title">
            <span>Müştəri Mesajları</span>
            {totalUnread > 0 && (
              <span className="vendor-chat-unread-total">{totalUnread} yeni</span>
            )}
          </div>

          <div className="vendor-chat-search-wrap">
            <Search size={16} />
            <input
              type="text"
              className="vendor-chat-search-input"
              placeholder="Müştəri və ya mesaj axtar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="vendor-chat-filters">
            {(['ALL', 'TOUR', 'HOTEL', 'BOOKING', 'GENERAL'] as const).map(ctx => (
              <button
                key={ctx}
                type="button"
                className={`vendor-chat-filter-btn ${filterContext === ctx ? 'active' : ''}`}
                onClick={() => setFilterContext(ctx)}
              >
                {ctx === 'ALL'
                  ? 'Bütün'
                  : ctx === 'TOUR'
                  ? 'Turlar'
                  : ctx === 'HOTEL'
                  ? 'Otellər'
                  : ctx === 'BOOKING'
                  ? 'Rezervasiya'
                  : 'Ümumi'}
              </button>
            ))}
          </div>
        </div>

        <div className="vendor-chat-list">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <Loader2 size={28} className="animate-spin" color="#2563eb" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.9rem' }}>
              Mesaj tapılmadı.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              const hasUnread = (conv.unreadCountVendor || 0) > 0;
              return (
                <div
                  key={conv.id}
                  className={`vendor-chat-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedConv(conv)}
                >
                  <div className="vendor-chat-avatar">
                    {conv.user?.name ? conv.user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div className="vendor-chat-item-body">
                    <div className="vendor-chat-item-header">
                      <span className="vendor-chat-item-name">
                        {conv.user?.name || 'Müştəri'}
                      </span>
                      <span className="vendor-chat-item-time">
                        {conv.lastMessageAt
                          ? new Date(conv.lastMessageAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>

                    <span className="vendor-chat-item-meta-tag">
                      {conv.contextType === 'TOUR'
                        ? 'Tur Sorğusu'
                        : conv.contextType === 'HOTEL'
                        ? 'Otel Sorğusu'
                        : conv.contextType === 'BOOKING'
                        ? 'Bron Sorğusu'
                        : 'Ümumi Sual'}
                    </span>

                    <div className="vendor-chat-item-preview">
                      <span>{getPreviewText(conv.lastMessageText || conv.lastMessage)}</span>
                      {hasUnread && (
                        <span className="vendor-chat-unread-badge">
                          {conv.unreadCountVendor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Main Area */}
      {selectedConv ? (
        <>
          <div className="vendor-chat-main">
          {/* Header */}
          <div className="vendor-chat-header">
            <div className="vendor-chat-header-user">
              <div className="vendor-chat-avatar">
                {selectedConv.user?.name ? selectedConv.user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="vendor-chat-header-name">
                    {selectedConv.user?.name || 'Müştəri'}
                  </span>
                  <span className={`vendor-status-pill ${selectedConv.status?.toLowerCase() || 'active'}`}>
                    {selectedConv.status === 'RESOLVED'
                      ? 'Həll Olundu'
                      : selectedConv.status === 'ARCHIVED'
                      ? 'Arxivləşdirilib'
                      : 'Aktiv Söhbət'}
                  </span>
                </div>
                <div className="vendor-chat-header-status">
                  <div className="vendor-chat-header-dot" />
                  <span>Onlayn Müştəri • {selectedConv.user?.phoneNumber || selectedConv.user?.email || 'Əlaqə mövcuddur'}</span>
                </div>
              </div>
            </div>

            <div className="vendor-chat-header-actions">
              <button
                type="button"
                className="vendor-header-action-btn offer"
                onClick={handleOpenOfferModal}
                title="Müştəriyə Fərdi Endirim & Promokod Təklif Et"
              >
                <Sparkles size={14} />
                <span>Xüsusi Təklif</span>
              </button>

              <button
                type="button"
                className="vendor-header-action-btn secondary"
                onClick={() => setShowAddCannedModal(true)}
                title="Şablon Cavab Əlavə Et"
              >
                <Plus size={14} />
                <span>Tez Cavab</span>
              </button>

              <button
                type="button"
                className={`vendor-header-action-btn ${showCrmSidebar ? 'active-crm' : 'secondary'}`}
                onClick={() => setShowCrmSidebar(prev => !prev)}
                title="Müştəri CRM Kartını aç/bağla"
              >
                <UserCheck size={14} />
                <span>CRM Kartı</span>
              </button>
            </div>
          </div>

          {/* Pinned Context Banner */}
          {pinned && (
            <div className="vendor-chat-pinned-banner">
              <div className="vendor-chat-pinned-info">
                {(pinned.imageUrl || pinned.image) ? (
                  <img src={pinned.imageUrl || pinned.image || ''} alt={pinned.title} className="vendor-chat-pinned-thumb" />
                ) : (
                  <div className="vendor-chat-avatar" style={{ borderRadius: 8 }}>
                    <Compass size={20} />
                  </div>
                )}
                <div>
                  <div className="vendor-chat-pinned-title">{pinned.title}</div>
                  <div className="vendor-chat-pinned-sub">
                    {pinned.price && <span className="vendor-pinned-price">{pinned.price} ₼</span>}
                    {pinned.price && pinned.date && <span className="vendor-pinned-dot">•</span>}
                    {pinned.date && <span>{formatDisplayDate(pinned.date)}</span>}
                    {pinned.status && (
                      <>
                        <span className="vendor-pinned-dot">•</span>
                        <span className="vendor-pinned-status">{pinned.status}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {pinned.link && (
                <a
                  href={pinned.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="vendor-chat-pinned-btn"
                >
                  <span>Məhsula Bax</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {/* Messages Thread */}
          <div className="vendor-chat-messages">
            {messagesLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 size={32} className="animate-spin" color="#2563eb" />
              </div>
            ) : messages.length === 0 ? (
              <div className="vendor-chat-empty-view">
                <MessageSquare size={40} />
                <p>Hələ heç bir mesaj yazılmayıb. İlk mesajı siz göndərin!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isVendor = msg.senderRole === 'VENDOR' || msg.senderRole === 'ADMIN';
                const msgAttachments = parseAttachments(msg.attachments);
                const isSpecialOffer = msg.content?.includes('XÜSUSİ TƏKLİF');
                return (
                  <div
                    key={msg.id}
                    className={`vendor-msg-wrap ${isVendor ? 'outgoing' : 'incoming'} ${isSpecialOffer ? 'offer-msg-wrap' : ''}`}
                  >
                    {isSpecialOffer ? (
                      renderSpecialOfferCard(msg.content, isVendor)
                    ) : (
                      <div className="vendor-msg-bubble">
                        {msg.content && <div className="vendor-msg-text">{msg.content}</div>}
                        {msgAttachments.length > 0 && (
                          <div className="vendor-msg-attachments-wrap">
                            {msgAttachments.map((att, idx) => {
                              const isImg = att.type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.url || att.name);
                              const fullFileUrl = att.url?.startsWith('http') ? att.url : `http://localhost:5000${att.url}`;

                              if (isImg) {
                                return (
                                  <a
                                    key={idx}
                                    href={fullFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="vendor-msg-attachment-img-link"
                                  >
                                    <img
                                      src={fullFileUrl}
                                      alt={att.name}
                                      className="vendor-msg-attachment-img"
                                      loading="lazy"
                                    />
                                  </a>
                                );
                              }

                              return (
                                <a
                                  key={idx}
                                  href={fullFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={att.name}
                                  className="vendor-msg-attachment-doc-card"
                                >
                                  <div className="vendor-msg-doc-icon">
                                    <FileText size={18} />
                                  </div>
                                  <div className="vendor-msg-doc-info">
                                    <span className="vendor-msg-doc-name">{att.name}</span>
                                    {att.size && (
                                      <span className="vendor-msg-doc-size">{formatFileSize(att.size)}</span>
                                    )}
                                  </div>
                                  <Download size={14} className="vendor-msg-doc-download-icon" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="vendor-msg-meta">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isVendor && (
                        <span title={msg.isRead ? 'Müştəri oxudu' : 'Göndərildi'}>
                          <CheckCheck
                            size={14}
                            color={msg.isRead ? '#38bdf8' : '#94a3b8'}
                          />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {customerTyping && (
              <div className="vendor-msg-wrap incoming">
                <div className="vendor-msg-bubble vendor-typing-bubble">
                  <span className="vendor-typing-dot" />
                  <span className="vendor-typing-dot" />
                  <span className="vendor-typing-dot" />
                </div>
                <div className="vendor-msg-meta">
                  <span>Müştəri yazır...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <div className="vendor-chat-composer-wrap">
            {/* Canned Response Bar */}
            {cannedResponses.length > 0 && (
              <div className="vendor-chat-canned-bar">
                <span className="vendor-canned-label">
                  <Zap size={13} />
                  <span>Şablonlar:</span>
                </span>
                {cannedResponses.slice(0, 8).map(canned => (
                  <div key={canned.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    <button
                      type="button"
                      className="vendor-canned-pill"
                      onClick={() => handleApplyCanned(canned)}
                      title={canned.content}
                    >
                      {canned.shortcut} ({canned.title})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCanned(canned.id, e)}
                      title="Şablonu sil"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending Files Bar */}
            {pendingFiles.length > 0 && (
              <div className="vendor-chat-pending-files-bar">
                {pendingFiles.map((item, idx) => (
                  <div key={idx} className="vendor-chat-pending-chip">
                    {item.preview ? (
                      <img src={item.preview} alt="preview" className="vendor-chat-pending-thumb" />
                    ) : (
                      <FileText size={14} color="#2563eb" />
                    )}
                    <span className="vendor-chat-pending-name">{item.file.name}</span>
                    <button
                      type="button"
                      className="vendor-chat-pending-remove"
                      onClick={() => handleRemovePendingFile(idx)}
                      title="Ləğv et"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <input
              ref={imageInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              multiple
              accept="image/*"
            />

            <div className="vendor-chat-input-row">
              <div className="vendor-chat-attach-group">
                <button
                  type="button"
                  className="vendor-chat-tool-btn"
                  onClick={() => imageInputRef.current?.click()}
                  title="Şəkil əlavə et (JPG, PNG)"
                  disabled={sending || uploadingFile}
                >
                  <ImageIcon size={18} />
                </button>
                <button
                  type="button"
                  className="vendor-chat-tool-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Sənəd və ya PDF vauçer əlavə et"
                  disabled={sending || uploadingFile}
                >
                  <Paperclip size={18} />
                </button>
              </div>

              <textarea
                className="vendor-chat-textarea"
                placeholder="Cavabınızı yazın... (Enter ilə göndər)"
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value);
                  if (selectedConv) {
                    vendorSocketService.sendTyping(selectedConv.id, 'Vendor', true);
                  }
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                type="button"
                className="vendor-chat-send-btn"
                onClick={() => handleSendMessage()}
                disabled={(!inputText.trim() && pendingFiles.length === 0) || sending || uploadingFile}
              >
                {sending || uploadingFile ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <span>Göndər</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: CRM Sidebar (Stage 4) */}
        {showCrmSidebar && (
          <div className="vendor-chat-crm-sidebar">
            <div className="vendor-crm-header">
              <div className="vendor-crm-header-title">
                <UserCheck size={18} color="#2563eb" />
                <span>Müştəri CRM Kartı</span>
              </div>
              <button
                type="button"
                className="vendor-crm-close-btn"
                onClick={() => setShowCrmSidebar(false)}
                title="Paneli Gizlət"
              >
                <X size={16} />
              </button>
            </div>

            {loadingCrm ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
                <Loader2 size={28} className="animate-spin" color="#2563eb" />
              </div>
            ) : (
              <div className="vendor-crm-body">
                {/* Customer Info Card */}
                <div className="vendor-crm-profile-card">
                  <div className="vendor-crm-avatar-wrap">
                    <div className="vendor-crm-avatar">
                      {crmProfile?.user?.name ? crmProfile.user.name.charAt(0).toUpperCase() : 'M'}
                    </div>
                    <div>
                      <div className="vendor-crm-name">
                        {crmProfile?.user?.name || selectedConv.user?.name || 'Müştəri'}
                      </div>
                      <div className="vendor-crm-role-badge">
                        <ShieldCheck size={12} />
                        <span>{crmProfile?.user?.status === 'ACTIVE' ? 'Təsdiqlənmiş Müştəri' : 'Qeydiyyatlı İstifadəçi'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="vendor-crm-contact-list">
                    {crmProfile?.user?.email && (
                      <div className="vendor-crm-contact-item">
                        <Mail size={14} color="#64748b" />
                        <span className="vendor-crm-contact-text">{crmProfile.user.email}</span>
                      </div>
                    )}
                    {crmProfile?.user?.phoneNumber && (
                      <div className="vendor-crm-contact-item">
                        <Phone size={14} color="#64748b" />
                        <span className="vendor-crm-contact-text">{crmProfile.user.phoneNumber}</span>
                      </div>
                    )}
                    {crmProfile?.user?.createdAt && (
                      <div className="vendor-crm-contact-item">
                        <Calendar size={14} color="#64748b" />
                        <span className="vendor-crm-contact-text">
                          Üzvlük: {new Date(crmProfile.user.createdAt).toLocaleDateString('az-AZ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="vendor-crm-actions-row">
                    {crmProfile?.user?.phoneNumber && (
                      <a
                        href={`https://wa.me/${crmProfile.user.phoneNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-crm-direct-btn wa"
                        title="WhatsApp-da birbaşa yazışma"
                      >
                        <MessageCircle size={15} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {crmProfile?.user?.phoneNumber && (
                      <a
                        href={`tel:${crmProfile.user.phoneNumber}`}
                        className="vendor-crm-direct-btn call"
                        title="Telefon zəngi et"
                      >
                        <Phone size={15} />
                        <span>Zəng Et</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* CRM Key Metrics */}
                <div className="vendor-crm-metrics-grid">
                  <div className="vendor-crm-metric-card points">
                    <div className="vendor-crm-metric-icon">
                      <Award size={18} />
                    </div>
                    <div className="vendor-crm-metric-data">
                      <div className="vendor-crm-metric-val">{crmProfile?.user?.loyaltyPoints || 0}</div>
                      <div className="vendor-crm-metric-lbl">Loyallıq Balı</div>
                    </div>
                  </div>

                  <div className="vendor-crm-metric-card bookings">
                    <div className="vendor-crm-metric-icon">
                      <ShoppingBag size={18} />
                    </div>
                    <div className="vendor-crm-metric-data">
                      <div className="vendor-crm-metric-val">{crmProfile?.totalBookingsCount || 0}</div>
                      <div className="vendor-crm-metric-lbl">Rezervasiya</div>
                    </div>
                  </div>

                  <div className="vendor-crm-metric-card spend">
                    <div className="vendor-crm-metric-icon">
                      <CreditCard size={18} />
                    </div>
                    <div className="vendor-crm-metric-data">
                      <div className="vendor-crm-metric-val">{crmProfile?.totalSpent || 0} ₼</div>
                      <div className="vendor-crm-metric-lbl">Ümumi Dövriyyə</div>
                    </div>
                  </div>
                </div>

                {/* Söhbət İdarəetməsi (Status & Lifecycle) */}
                <div className="vendor-crm-section">
                  <div className="vendor-crm-section-title">
                    <Tag size={15} />
                    <span>Söhbət Statusu</span>
                  </div>

                  <div className="vendor-crm-status-control">
                    {selectedConv.status !== 'RESOLVED' ? (
                      <button
                        type="button"
                        className="vendor-crm-status-action-btn resolve"
                        onClick={() => handleUpdateStatus('RESOLVED')}
                        disabled={statusUpdating}
                      >
                        <CheckCircle2 size={14} />
                        <span>{statusUpdating ? 'Yenilənir...' : 'Həll olundu et'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="vendor-crm-status-action-btn reopen"
                        onClick={() => handleUpdateStatus('ACTIVE')}
                        disabled={statusUpdating}
                      >
                        <RotateCcw size={14} />
                        <span>{statusUpdating ? 'Yenilənir...' : 'Yenidən aktiv et'}</span>
                      </button>
                    )}

                    {selectedConv.status !== 'ARCHIVED' ? (
                      <button
                        type="button"
                        className="vendor-crm-status-action-btn archive"
                        onClick={() => handleUpdateStatus('ARCHIVED')}
                        disabled={statusUpdating}
                      >
                        <Archive size={14} />
                        <span>Arxivə göndər</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="vendor-crm-status-action-btn reopen"
                        onClick={() => handleUpdateStatus('ACTIVE')}
                        disabled={statusUpdating}
                      >
                        <RotateCcw size={14} />
                        <span>Arxivdən çıxar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Commercial Offer Trigger */}
                <div className="vendor-crm-section">
                  <button
                    type="button"
                    className="vendor-crm-offer-banner-btn"
                    onClick={handleOpenOfferModal}
                  >
                    <div className="vendor-crm-offer-icon-box">
                      <Sparkles size={18} />
                    </div>
                    <div style={{ textAlign: 'left', minWidth: 0 }}>
                      <div className="vendor-crm-offer-btn-title">Fərdi Təklif Göndər</div>
                      <div className="vendor-crm-offer-btn-sub">Endirim və promokod hazırla</div>
                    </div>
                  </button>
                </div>

                {/* Recent Bookings History */}
                <div className="vendor-crm-section">
                  <div className="vendor-crm-section-title">
                    <ShoppingBag size={15} />
                    <span>Son Sifarişlər ({crmProfile?.recentBookings?.length || 0})</span>
                  </div>

                  {!crmProfile?.recentBookings || crmProfile.recentBookings.length === 0 ? (
                    <div className="vendor-crm-empty-bookings">
                      <span>Bu müştərinin şirkətinizdə hələ bronu yoxdur.</span>
                    </div>
                  ) : (
                    <div className="vendor-crm-bookings-list">
                      {crmProfile.recentBookings.map(b => (
                        <div key={b.id} className="vendor-crm-booking-item">
                          <div className="vendor-crm-booking-header">
                            <span className="vendor-crm-booking-tour">
                              {b.tour?.title || `Sifariş #${b.id.slice(-6)}`}
                            </span>
                            <span className="vendor-crm-booking-price">{b.totalAmount} ₼</span>
                          </div>

                          <div className="vendor-crm-booking-meta">
                            <span>{new Date(b.bookingDate).toLocaleDateString('az-AZ')}</span>
                            <span>• {b.seats} nəfər</span>
                          </div>

                          <div className="vendor-crm-booking-tags">
                            <span className={`vendor-crm-tag status-${b.status?.toLowerCase()}`}>
                              {b.status === 'CONFIRMED' ? 'Təsdiqləndi' : b.status === 'CANCELLED' ? 'Ləğv' : 'Gözləmədə'}
                            </span>
                            <span className={`vendor-crm-tag pay-${b.paymentStatus?.toLowerCase()}`}>
                              {b.paymentStatus === 'PAID' ? 'Ödənildi' : 'Ödənilməyib'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </>
    ) : (
        <div className="vendor-chat-empty-view">
          <MessageSquare size={48} />
          <h3>Söhbət seçilməyib</h3>
          <p>Müştəri ilə yazışmaya başlamaq üçün sol siyahıdan bir dialoq seçin.</p>
        </div>
      )}

      {/* Add Canned Response Modal */}
      {showAddCannedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              padding: 24,
              width: 480,
              maxWidth: '90vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Yeni Şablon Tez Cavab</h3>
              <button
                type="button"
                onClick={() => setShowAddCannedModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCanned}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Şablon Başlığı
                </label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Toplanış Məlumatı"
                  value={newCannedTitle}
                  onChange={e => setNewCannedTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Qısa Qovluq (Shortcut)
                </label>
                <input
                  type="text"
                  placeholder="/toplanis"
                  value={newCannedShortcut}
                  onChange={e => setNewCannedShortcut(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                  Avtomatik Cavab Mətni
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Salam! Tur üçün toplanış saat 06:30-da Gənclik m/s qarşısında olacaq..."
                  value={newCannedContent}
                  onChange={e => setNewCannedContent(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddCannedModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={savingCanned}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#ffffff', fontWeight: 600, cursor: 'pointer' }}
                >
                  {savingCanned ? 'Yadda saxlanılır...' : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Special Offer Modal (Stage 4) */}
      {showOfferModal && (
        <div className="vendor-offer-modal-overlay">
          <div className="vendor-offer-modal-card">
            <div className="vendor-offer-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="vendor-offer-modal-icon-badge">
                  <Sparkles size={20} color="#7c3aed" />
                </div>
                <div>
                  <h3 className="vendor-offer-modal-title">Xüsusi Təklif & Fərdi Endirim</h3>
                  <p className="vendor-offer-modal-sub">Müştəri üçün fərdi təklif və promokod formalaşdıraraq çata göndərin</p>
                </div>
              </div>
              <button
                type="button"
                className="vendor-offer-modal-close"
                onClick={() => setShowOfferModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendSpecialOffer} className="vendor-offer-form">
              <div className="vendor-offer-form-field">
                <label className="vendor-offer-label">Təklif Olunan Tur / Xidmət Adı</label>
                <input
                  type="text"
                  required
                  placeholder="Məsələn: Qəbələ Tufandağ Turu və ya Fərdi Transfer"
                  value={offerTourName}
                  onChange={e => setOfferTourName(e.target.value)}
                  className="vendor-offer-input"
                />
              </div>

              <div className="vendor-offer-form-field">
                <label className="vendor-offer-label">Endirim Faizi</label>
                <div className="vendor-offer-pills">
                  {['5', '10', '15', '20', '25', '30'].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      className={`vendor-offer-pill ${offerDiscountPercent === pct ? 'active' : ''}`}
                      onClick={() => setOfferDiscountPercent(pct)}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={offerDiscountPercent}
                  onChange={e => setOfferDiscountPercent(e.target.value)}
                  className="vendor-offer-input"
                  style={{ marginTop: 8 }}
                  placeholder="Fərdi faiz daxil edin"
                />
              </div>

              <div className="vendor-offer-form-field">
                <label className="vendor-offer-label">Promokod / Təklif Kodu</label>
                <input
                  type="text"
                  required
                  placeholder="VIP2026"
                  value={offerPromoCode}
                  onChange={e => setOfferPromoCode(e.target.value.toUpperCase())}
                  className="vendor-offer-input code-input"
                />
              </div>

              <div className="vendor-offer-form-field">
                <label className="vendor-offer-label">Xüsusi Qeyd / Şərtlər</label>
                <textarea
                  rows={3}
                  value={offerNote}
                  onChange={e => setOfferNote(e.target.value)}
                  className="vendor-offer-textarea"
                  placeholder="Məsələn: Təklif növbəti 24 saat ərzində keçərlidir..."
                />
              </div>

              {/* Preview Box */}
              <div className="vendor-offer-preview-box">
                <div className="vendor-offer-preview-title">
                  <Sparkles size={13} color="#7c3aed" />
                  <span>Çatda göndəriləcək mesajın görünüşü:</span>
                </div>
                <div className="vendor-offer-preview-text">
                  <div>🎁 <strong>XÜSUSİ TƏKLİF & ENDİRİM:</strong></div>
                  <div>📌 <strong>Xidmət:</strong> {offerTourName || 'Seçilmiş Xidmət'}</div>
                  <div>🏷️ <strong>Endirim:</strong> -{offerDiscountPercent}%</div>
                  <div>🎟️ <strong>Promokod:</strong> <span className="vendor-offer-code-badge">{offerPromoCode || 'VIP'}</span></div>
                  <div>📝 <strong>Qeyd:</strong> {offerNote}</div>
                </div>
              </div>

              <div className="vendor-offer-modal-actions">
                <button
                  type="button"
                  className="vendor-offer-btn-cancel"
                  onClick={() => setShowOfferModal(false)}
                >
                  Ləğv et
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="vendor-offer-btn-submit"
                >
                  {sendingOffer ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Göndərilir...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Təklifi Çata Göndər</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
