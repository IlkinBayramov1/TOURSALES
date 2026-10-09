import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle } from 'lucide-react';
import { guideApi } from '../../guideApi';

interface OfflineSyncBannerProps {
  tourId: string;
  onSyncCompleted?: () => void;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ tourId, onSyncCompleted }) => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const getPendingScans = () => {
    try {
      const data = localStorage.getItem(`offline_scans_${tourId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setPendingCount(getPendingScans().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tourId]);

  const handleManualSync = async () => {
    const pending = getPendingScans();
    if (pending.length === 0 || syncing) return;

    try {
      setSyncing(true);
      setSyncMessage(null);
      const res = await guideApi.syncOfflineCheckIns(tourId, pending);
      localStorage.removeItem(`offline_scans_${tourId}`);
      setPendingCount(0);
      setSyncMessage(`✓ ${res.syncedCount || pending.length} sərnişin bazaya uğurla sinxronlaşdırıldı!`);
      onSyncCompleted?.();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage('Sinxronlaşdırma zamanı xəta baş verdi: ' + (err.message || ''));
    } finally {
      setSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncMessage) {
    return null;
  }

  return (
    <div
      style={{
        background: !isOnline ? '#fef3c7' : pendingCount > 0 ? '#eff6ff' : '#ecfdf5',
        border: `1px solid ${!isOnline ? '#fde68a' : pendingCount > 0 ? '#bfdbfe' : '#a7f3d0'}`,
        color: !isOnline ? '#92400e' : pendingCount > 0 ? '#1e40af' : '#065f46',
        borderRadius: '0.75rem',
        padding: '0.75rem 1rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.875rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
        {!isOnline ? (
          <>
            <WifiOff size={18} />
            <span>Oflayn rejim: İnternet bağlantısı yoxdur. Skanlar cihazınızda yadda saxlanılır.</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <RefreshCw size={18} />
            <span>{pendingCount} oflayn sərnişin qeydiyyatı sinxronlaşdırılmağı gözləyir.</span>
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            <span>{syncMessage}</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={syncing}
          style={{
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.375rem',
            padding: '0.375rem 0.75rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
        >
          {syncing ? 'Sinxronlaşdırılır...' : 'İndi Sinxronlaşdır'}
        </button>
      )}
    </div>
  );
};
