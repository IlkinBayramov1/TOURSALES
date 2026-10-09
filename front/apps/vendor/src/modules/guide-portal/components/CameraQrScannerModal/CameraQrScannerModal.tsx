import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { guideApi, ScanQrResponse } from '../../guideApi';
import './CameraQrScannerModal.css';

interface CameraQrScannerModalProps {
  tourId: string;
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: (res: ScanQrResponse) => void;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  tourId,
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [manualToken, setManualToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanQrResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play audio sound feedback
  const playBeep = (isSuccess: boolean) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio not supported or blocked
    }

    if (navigator.vibrate) {
      if (isSuccess) {
        navigator.vibrate([80, 50, 80]);
      } else {
        navigator.vibrate([200, 100, 200]);
      }
    }
  };

  // Start webcam
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setResult(null);
    setCameraError(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Kamera dəstəklənmir və ya HTTPS tələb olunur.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        if (isMounted) {
          setCameraError(err.message || 'Kameranı açmaq mümkün olmadı. Zəhmət olmasa icazə verin.');
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  const lastScannedTokenRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);

  // Continuous Barcode / QR detection loop
  useEffect(() => {
    if (!isOpen || cameraError) return;

    let intervalId: any;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        intervalId = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2 && !loading) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const raw = String(barcodes[0].rawValue).trim();
                const now = Date.now();
                // Avoid scanning same token repeatedly within 3 seconds
                if (raw && (raw !== lastScannedTokenRef.current || now - lastScannedTimeRef.current > 3000)) {
                  lastScannedTokenRef.current = raw;
                  lastScannedTimeRef.current = now;
                  handleScanToken(raw);
                }
              }
            } catch {}
          }
        }, 400);
      } catch {}
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, cameraError, loading]);

  if (!isOpen) return null;

  const handleScanToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim() || loading) return;

    try {
      setLoading(true);
      const res = await guideApi.scanQrCheckIn({
        qrToken: tokenToVerify.trim(),
        tourId
      });

      setResult(res);
      playBeep(!res.isDuplicate && res.verified);

      if (res.verified && !res.isDuplicate) {
        onScanSuccess?.(res);
      }
    } catch (err: any) {
      playBeep(false);
      setResult({
        success: false,
        verified: false,
        message: err?.response?.data?.message || err.message || 'Bilet tapılmadı və ya etibarsızdır.'
      });
    } finally {
      setLoading(false);
      setManualToken('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleScanToken(manualToken);
  };

  return (
    <div className="qr-scanner-overlay" onClick={onClose}>
      <div className="qr-scanner-card" onClick={(e) => e.stopPropagation()}>
        <div className="qr-scanner-header">
          <div className="qr-scanner-title">
            <Camera size={20} color="#0284c7" />
            <span>Kamera ilə QR Skan</span>
          </div>
          <button className="qr-close-btn" onClick={onClose} aria-label="Bağla">
            <X size={20} />
          </button>
        </div>

        <div className="qr-video-wrapper">
          {cameraError ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '1rem', fontSize: '0.875rem' }}>
              <p>📷 Kamera aktiv deyil və ya icazə verilməyib.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Bilet nömrəsini aşağıdakı xanaya daxil edə bilərsiniz.</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="qr-video" playsInline muted autoPlay />
              <div className="qr-target-box">
                <div className="qr-scan-line" />
              </div>
            </>
          )}
        </div>

        <div className="qr-scanner-footer">
          {result && (
            <div
              className={`qr-result-box ${
                result.verified && !result.isDuplicate
                  ? 'success'
                  : result.isDuplicate
                  ? 'duplicate'
                  : 'error'
              }`}
            >
              <div className="qr-result-header">
                {result.verified && !result.isDuplicate ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Minik Qeydiyyatı Uğurla Təsdiqləndi!</span>
                  </>
                ) : result.isDuplicate ? (
                  <>
                    <AlertTriangle size={18} />
                    <span>Diqqət: Təkrar Skan!</span>
                  </>
                ) : (
                  <>
                    <AlertCircle size={18} />
                    <span>Xəta: Bilet Təsdiqlənmədi</span>
                  </>
                )}
              </div>
              <div className="qr-result-body">
                {result.passengerNames && result.passengerNames.length > 0 && (
                  <div>
                    <strong>Sərnişin(lər):</strong> {result.passengerNames.join(', ')}
                  </div>
                )}
                {result.seatNumbers && result.seatNumbers.length > 0 && (
                  <div>
                    <strong>Oturacaq(lar):</strong> #{result.seatNumbers.join(', #')}
                  </div>
                )}
                {result.message && <div>{result.message}</div>}
                {result.checkedInAt && (
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.85 }}>
                    Qeydiyyat vaxtı: {new Date(result.checkedInAt).toLocaleTimeString('az-AZ')}
                  </div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="qr-manual-input-box">
            <input
              type="text"
              className="qr-manual-input"
              placeholder="və ya bilet ID / QR token daxil edin..."
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !manualToken.trim()}
              style={{
                background: '#0284c7',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontWeight: 600,
                opacity: loading || !manualToken.trim() ? 0.6 : 1
              }}
            >
              {loading ? <RefreshCw size={16} className="spin" /> : <ArrowRight size={16} />}
              <span>Yoxla</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
