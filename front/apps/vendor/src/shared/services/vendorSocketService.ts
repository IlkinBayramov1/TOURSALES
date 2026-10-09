import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@toursales/types';

class VendorSocketService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;

  public connect(userId?: string) {
    if (this.socket && this.socket.connected) return;

    const socketUrl = import.meta.env.VITE_WS_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      // console.log('[Socket] Connected with ID:', this.socket?.id);
      if (userId) {
        this.socket?.emit('register', userId);
      }
      if (this.currentRoom) {
        this.socket?.emit('chat:join', this.currentRoom);
      }
    });
  }

  public disconnect() {
    if (this.socket) {
      if (this.currentRoom) {
        this.socket.emit('chat:leave', this.currentRoom);
        this.currentRoom = null;
      }
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public joinChat(conversationId: string) {
    this.currentRoom = conversationId;
    if (this.socket?.connected) {
      this.socket.emit('chat:join', conversationId);
    }
  }

  public leaveChat(conversationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:leave', conversationId);
    }
    if (this.currentRoom === conversationId) {
      this.currentRoom = null;
    }
  }

  public sendTyping(conversationId: string, senderName: string, isTyping: boolean) {
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', {
        conversationId,
        senderName,
        senderRole: 'VENDOR',
        isTyping,
      });
    }
  }

  public onNewMessage(callback: (msg: ChatMessage) => void) {
    if (!this.socket) return () => {};
    this.socket.on('chat:new_message', callback);
    return () => {
      this.socket?.off('chat:new_message', callback);
    };
  }

  public onTyping(callback: (data: { conversationId: string; senderName: string; senderRole: string; isTyping: boolean }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('chat:typing', callback);
    return () => {
      this.socket?.off('chat:typing', callback);
    };
  }

  public onChatRead(callback: (data: { conversationId: string; readerRole: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('chat:read', callback);
    return () => {
      this.socket?.off('chat:read', callback);
    };
  }

  public onConversationUpdated(callback: (data: { conversationId: string; lastMessageText: string; lastMessageAt: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('chat:conversation_updated', callback);
    return () => {
      this.socket?.off('chat:conversation_updated', callback);
    };
  }

  // Ticket Socket Events
  public joinTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit('ticket:join', ticketId);
    }
  }

  public leaveTicket(ticketId: string) {
    if (this.socket?.connected) {
      this.socket.emit('ticket:leave', ticketId);
    }
  }

  public onTicketReply(callback: (data: { ticketId: string; reply: any; ticket: any }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('ticket:reply', callback);
    return () => {
      this.socket?.off('ticket:reply', callback);
    };
  }

  public onTicketStatusChange(callback: (data: { ticketId: string; ticket: any }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('ticket:status_change', callback);
    return () => {
      this.socket?.off('ticket:status_change', callback);
    };
  }

  public onTicketUpdated(callback: (data: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('ticket:updated', callback);
    return () => {
      this.socket?.off('ticket:updated', callback);
    };
  }

  public onTicketCreated(callback: (data: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('ticket:created', callback);
    return () => {
      this.socket?.off('ticket:created', callback);
    };
  }

  // Tour Seat Real-Time Events
  public joinTour(tourId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join-tour', tourId);
    }
  }

  public leaveTour(tourId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave-tour', tourId);
    }
  }

  public onSeatsLocked(callback: (data: { tourId: string; seatNumbers: number[]; lockedBy?: string; expiresAt?: string }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('seats:locked', callback);
    return () => {
      this.socket?.off('seats:locked', callback);
    };
  }

  public onSeatsReleased(callback: (data: { tourId: string; seatNumbers: number[] }) => void) {
    if (!this.socket) return () => {};
    this.socket.on('seats:released', callback);
    return () => {
      this.socket?.off('seats:released', callback);
    };
  }

  // B2B Tender Real-Time Events
  public onTenderNewRequest(callback: (tender: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('tender:new_request', callback);
    return () => {
      this.socket?.off('tender:new_request', callback);
    };
  }

  public onTenderBidAccepted(callback: (data: any) => void) {
    if (!this.socket) return () => {};
    this.socket.on('tender:bid_accepted', callback);
    return () => {
      this.socket?.off('tender:bid_accepted', callback);
    };
  }
}

export const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Pleasant two-tone chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore audio permission or context warnings
  }
};

export const vendorSocketService = new VendorSocketService();
export default vendorSocketService;
