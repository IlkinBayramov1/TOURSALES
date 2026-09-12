import React, { useState } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Search, 
  Bus, 
  User 
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

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) return;

    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const res = await vendorBookingApi.checkIn({
        bookingNumber: code.trim(),
        qrToken: code.trim(),
      });

      if (res.data && res.data.verified) {
        setResult(res.data);
        if (onSuccess) onSuccess(res.data);
      } else {
        setError('Bilet tapılmadı və ya etibarsızdır.');
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || err.response?.data?.message || 'Yoxlama zamanı xəta baş verdi.');
    } finally {
      setScanning(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setError(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Canlı QR Bilet Skaneri və Minik Nəzarəti"
      size="md"
    >
      <div className="vendor-scanner-container">
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
            placeholder="Və ya bilet nömrəsini daxil edin (TS-...)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
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
            <div className="vendor-success-icon-wrap">
              <CheckCircle2 size={36} />
            </div>

            <h3>Minik Təsdiqləndi!</h3>
            {result.alreadyCheckedIn && (
              <div className="vendor-scanner-already-badge">
                <AlertTriangle size={14} />
                <span>Bu bilet artıq minikdən keçmişdi (Təkrar təsdiq)</span>
              </div>
            )}
            <p className="vendor-success-tour">{result.tourTitle}</p>

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
              Növbəti Sərnişini Oxut
            </Button>
          </div>
        )}

        {/* Verification Error */}
        {error && (
          <div className="vendor-scanner-error-card">
            <XCircle size={28} />
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
