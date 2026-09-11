import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';

interface SocketContextType {
  isConnected: boolean;
  emitEvent: (event: string, payload: any) => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  emitEvent: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const { info } = useToast();

  useEffect(() => {
    // Simulated connection setup
    setIsConnected(true);
  }, []);

  const emitEvent = (event: string, payload: any) => {
    if (event === 'SEAT_LOCK_BROADCAST') {
      info(`Oturacaq #${payload.seatNumber} başqa istifadəçi tərəfindən seçildi.`, 'Canlı Yenilənmə');
    }
  };

  return (
    <SocketContext.Provider value={{ isConnected, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
