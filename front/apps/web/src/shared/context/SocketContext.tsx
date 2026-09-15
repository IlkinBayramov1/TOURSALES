import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useToast } from './ToastContext';

type SocketCallback = (payload: any) => void;

interface SocketContextType {
  isConnected: boolean;
  emitEvent: (event: string, payload: any) => void;
  subscribe: (event: string, callback: SocketCallback) => () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  emitEvent: () => {},
  subscribe: () => () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const listenersRef = useRef<Map<string, Set<SocketCallback>>>(new Map());
  const { info } = useToast();

  useEffect(() => {
    // Resilient simulated real-time socket connection
    setIsConnected(true);
    return () => {
      listenersRef.current.clear();
    };
  }, []);

  const subscribe = useCallback((event: string, callback: SocketCallback) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        handlers.delete(callback);
        if (handlers.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  }, []);

  const emitEvent = useCallback((event: string, payload: any) => {
    // Notify internal subscribers
    const handlers = listenersRef.current.get(event);
    if (handlers) {
      handlers.forEach((fn) => {
        try {
          fn(payload);
        } catch (err) {
          console.error(`Error in socket listener for ${event}:`, err);
        }
      });
    }

    // Default UX feedback for critical collaborative events
    if (event === 'SEAT_LOCK_BROADCAST') {
      info(
        `Oturacaq #${payload?.seatNumber || ''} başqa istifadəçi tərəfindən seçildi.`,
        'Canlı Yenilənmə'
      );
    }
  }, [info]);

  return (
    <SocketContext.Provider value={{ isConnected, emitEvent, subscribe }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
