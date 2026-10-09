import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search, 
  Bus, 
  User,
  Volume2,
  VolumeX,
  RotateCcw
} from 'lucide-react';
import { Modal, Button, Input, Badge } from '@toursales/ui';
import { vendorBookingApi, CheckInResult } from '../../api/vendorBookingApi';
import './QrScannerModal.css';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: CheckInResult) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionScannedCount, setSessionScannedCount] = useState(0);

  const focusInput = () => {
    setTimeout(() => {
      const el = document.getElementById('qr-manual-code-input') as HTMLInputElement | null;
      el?.focus();
    }, 150);
  };

  useEffect(() => {
    if (isOpen) {
      focusInput();
    } else {
      setCode('');
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  // Audio synthesizer via Web Audio API
  const playAudio = (type: 'success' | 'warning' | 'error') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'success') {
        // Melodic two-tone success chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc1.stop(ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.1);
        osc2.stop(ctx.currentTime + 0.4);
      } else {
        // Warning buzz tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch {
      // Audio not supported or blocked, ignore
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) return;

    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const res = await vendorBookingApi.checkIn({
        bookingNumber: cleanCode,
        qrToken: cleanCode,
      });

      if (res.data && res.data.verified) {
        setResult(res.data);
        setSessionScannedCount((prev) => prev + 1);

        if (res.data.alreadyCheckedIn) {
          playAudio('warning');
        } else {
          playAudio('success');
        }

        if (onSuccess) onSuccess(res.data);
      } else {
        playAudio('error');
        setError('Bilet tapılmadı və ya etibarsızdır.');
      }
    } catch (err: any) {
      playAudio('error');
      setError(err.response?.data?.msg || err.response?.data?.message || 'Yoxlama zamanı xəta baş verdi.');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setError(null);
    focusInput();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Canlı QR Bilet Skaneri və Minik Nəzarəti"
      size="md"
    >
      <div className="vendor-scanner-container">
        {/* Scanner Toolbar Controls */}
        <div className="vendor-scanner-top-bar">
          <div className="vendor-scanner-session-counter">
            <span className="text-secondary text-xs">Bu sessiyada oxunub:</span>
            <strong>{sessionScannedCount} sərnişin</strong>
          </div>

          <button
            type="button"
            className="vendor-scanner-sound-toggle"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Səsi söndür' : 'Səsi aç'}
          >
            {soundEnabled ? (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                <Volume2 size={15} />
                <span>Səs Açıq</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-400 text-xs font-semibold">
                <VolumeX size={15} />
                <span>Səssiz</span>
              </span>
            )}
          </button>
        </div>

        {/* Visual Camera Scan Target Frame */}
        <div className="vendor-scanner-camera-frame">
          <div className="vendor-scanner-laser" />
          <QrCode size={120} className="vendor-scanner-qr-backdrop" />
          <span className="vendor-scanner-hint">
            Kamera və ya ştrix-kod oxuyucunu sərnişinin QR koduna yaxınlaşdırın
          </span>
        </div>

        {/* Manual Code / Booking Number Input */}
        <form onSubmit={handleVerify} className="vendor-scanner-input-row">
          <Input
            id="qr-manual-code-input"
            placeholder="Bilet nömrəsi və ya QR token (TS-..., TR-...)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={scanning}
          />
          <Button
            type="submit"
            variant="primary"
            isLoading={scanning}
            disabled={!code.trim()}
          >
            <Search size={16} />
            <span>Yoxla</span>
          </Button>
        </form>

        {/* Verification Success Result */}
        {result && (
          <div className="vendor-scanner-success-card">
            <div className={`vendor-success-icon-wrap ${result.alreadyCheckedIn ? 'warning' : 'success'}`}>
              <CheckCircle2 size={36} />
            </div>

            <h3>{result.alreadyCheckedIn ? 'Təkrar Oxunuş' : 'Minik Təsdiqləndi!'}</h3>
            {result.alreadyCheckedIn && (
              <div className="vendor-scanner-already-badge">
                <AlertTriangle size={14} />
                <span>Bu bilet artıq minikdən keçmişdi (Təkrar qeydiyyat)</span>
              </div>
            )}
            <p className="vendor-success-tour font-bold">{result.tourTitle}</p>

            <div className="vendor-success-seats-row">
              <Bus size={18} />
              <span>Oturacaqlar:</span>
              <div className="vendor-seats-badges">
                {result.seatNumbers.map((s) => (
                  <Badge key={s} variant="success" pill>
                    №{s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="vendor-success-passengers-list">
              {result.passengerNames.map((p, idx) => (
                <div key={idx} className="vendor-passenger-name-item">
                  <User size={14} />
                  <span>{p}</span>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="vendor-next-scan-btn"
            >
              <RotateCcw size={14} />
              <span>Növbəti Sərnişini Oxut</span>
            </Button>
          </div>
        )}

        {/* Verification Error */}
        {error && (
          <div className="vendor-scanner-error-card">
            <XCircle size={28} className="shrink-0" />
            <div>
              <h4>Etibarsız Bilet</h4>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
