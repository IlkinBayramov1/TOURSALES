import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Building,
  CheckCheck,
  Paperclip,
  Loader2
} from 'lucide-react';
import { chatApi } from '../../api/chatApi';
import { Conversation, ChatMessage, PinnedContextMeta } from '@toursales/types';
import './FloatingChatWidget.css';

interface FloatingChatWidgetProps {
  initialCompanyId?: string;
  contextType?: 'TOUR' | 'HOTEL' | 'BOOKING' | 'GENERAL';
  contextTourId?: string;
  contextHotelId?: string;
  contextBookingId?: string;
}

export const FloatingChatWidget: React.FC<FloatingChatWidgetProps> = ({
  initialCompanyId = 'C-586288',
  contextType = 'GENERAL',
  contextTourId,
  contextHotelId,
  contextBookingId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState({
    companyId: initialCompanyId,
    contextType,
    contextTourId,
    contextHotelId,
    contextBookingId,
  });
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for external open-chat events
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent<{
        companyId?: string;
        contextType?: 'TOUR' | 'HOTEL' | 'BOOKING' | 'GENERAL';
        contextTourId?: string;
        contextHotelId?: string;
        contextBookingId?: string;
      }>;
      if (customEvent.detail) {
        setContext(prev => ({
          ...prev,
          companyId: customEvent.detail.companyId || prev.companyId,
          contextType: customEvent.detail.contextType || 'GENERAL',
          contextTourId: customEvent.detail.contextTourId,
          contextHotelId: customEvent.detail.contextHotelId,
          contextBookingId: customEvent.detail.contextBookingId,
        }));
      }
      setIsOpen(true);
    };

    window.addEventListener('open-chat', handleOpenChat);
    return () => window.removeEventListener('open-chat', handleOpenChat);
  }, []);

  // Initialize or fetch conversation
  const initConversation = useCallback(async () => {
    setLoading(true);
    try {
      const conv = await chatApi.startOrGetConversation({
        companyId: context.companyId,
        contextType: context.contextType,
        contextTourId: context.contextTourId,
        contextHotelId: context.contextHotelId,
        contextBookingId: context.contextBookingId,
      });
      setConversation(conv);
      if (conv) {
        setUnreadCount(conv.unreadCountUser || 0);
        const msgs = await chatApi.getMessages(conv.id);
        setMessages(msgs);
        if (conv.unreadCountUser > 0) {
          await chatApi.markAsRead(conv.id);
          setUnreadCount(0);
        }
      }
    } catch (err) {
      console.error('Failed to init chat conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [context]);

  useEffect(() => {
    if (isOpen) {
      initConversation();
    }
  }, [isOpen, initConversation]);

  // Periodic polling for new messages when open
  useEffect(() => {
    if (!isOpen || !conversation) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await chatApi.getMessages(conversation.id);
        setMessages(fresh);
      } catch (e) {
        // silent catch
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, conversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversation || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await chatApi.sendMessage(conversation.id, {
        content: text,
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  let pinned: PinnedContextMeta | null = null;
  if (conversation?.pinnedMeta) {
    try {
      pinned = typeof conversation.pinnedMeta === 'string'
        ? JSON.parse(conversation.pinnedMeta)
        : conversation.pinnedMeta;
    } catch (e) {
      pinned = null;
    }
  }

  return (
    <div className="web-floating-chat-wrap">
      {/* Floating Launcher Button */}
      <button
        type="button"
        className="web-chat-launcher-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Canlı Dəstək və Çat"
      >
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
        {!isOpen && unreadCount > 0 && (
          <span className="web-chat-unread-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="web-chat-window">
          {/* Header */}
          <div className="web-chat-header">
            <div className="web-chat-header-title">
              <div className="web-chat-company-avatar">
                {conversation?.company?.name?.charAt(0) || 'T'}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                  {conversation?.company?.name || 'Müştəri Dəstəyi'}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Online • Canlı Çat</div>
              </div>
            </div>

            <button
              type="button"
              className="web-chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Pinned Context Meta Banner */}
          {pinned && (
            <div className="web-chat-pinned-meta">
              {pinned.image && (
                <img src={pinned.image} alt={pinned.title} className="web-chat-pinned-img" />
              )}
              <div className="web-chat-pinned-info">
                <strong>{pinned.title}</strong>
                <span>
                  {pinned.price ? `${pinned.price} ₼` : ''}{' '}
                  {pinned.bookingNumber ? `• Sifariş: ${pinned.bookingNumber}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Messages Feed */}
          <div className="web-chat-messages-area">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Loader2 size={28} className="animate-spin" color="#2563eb" />
              </div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem', margin: 'auto 0' }}>
                <MessageCircle size={32} color="#94a3b8" style={{ marginBottom: 8 }} />
                <p>Salam! Sizə necə kömək edə bilərik?</p>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  Sualınızı yazın, tur menecerlərimiz anında cavablandıracaq.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderRole === 'USER';
                return (
                  <div
                    key={msg.id}
                    className={`web-chat-bubble ${isMe ? 'user' : 'vendor'}`}
                  >
                    <div>{msg.content}</div>
                    <div className="web-chat-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="web-chat-input-bar">
            <input
              type="text"
              placeholder="Mesajınızı daxil edin..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="web-chat-send-btn"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
