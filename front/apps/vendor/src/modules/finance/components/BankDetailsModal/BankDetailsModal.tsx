import React, { useState, useEffect } from 'react';
import { Button } from '@toursales/ui';
import { Building2, CreditCard, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { vendorFinanceApi, BankDetailsPayload } from '../../vendorFinanceApi';
import './BankDetailsModal.css';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    iban?: string;
    bankName?: string;
    voen?: string;
    swiftBic?: string;
    bankCode?: string;
  };
  onSuccess: () => void;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}) => {
  const [iban, setIban] = useState('');
  const [bankName, setBankName] = useState('');
  const [voen, setVoen] = useState('');
  const [swiftBic, setSwiftBic] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setIban(initialData.iban || '');
      setBankName(initialData.bankName || '');
      setVoen(initialData.voen || '');
      setSwiftBic(initialData.swiftBic || '');
      setBankCode(initialData.bankCode || '');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
    if (cleanIban && (!cleanIban.startsWith('AZ') || cleanIban.length !== 28)) {
      setError('Azərbaycan IBAN nömrəsi "AZ" ilə başlamalı və 28 simvoldan ibarət olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      const payload: BankDetailsPayload = {
        iban: cleanIban,
        bankName: bankName.trim(),
        voen: voen.trim(),
        swiftBic: swiftBic.trim(),
        bankCode: bankCode.trim(),
      };
      await vendorFinanceApi.updateBankDetails(payload);
      setSuccessMsg('Bank və ödəniş rekvizitləri uğurla yadda saxlanıldı.');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err?.response?.data?.msg || err?.response?.data?.message || 'Rekvizitlər yenilənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bank-modal-overlay" onClick={onClose}>
      <div className="bank-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="bank-modal-header">
          <div className="bank-modal-title-group">
            <div className="bank-modal-icon">
              <Building2 size={22} />
            </div>
            <div>
              <h3>Rəsmi Bank Rekvizitləri</h3>
              <p>Pul çıxarışlarının və rəsmi invoysların tərtibi üçün bank məlumatları</p>
            </div>
          </div>
          <button type="button" className="bank-close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="bank-alert error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bank-alert success">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bank-form">
          <div className="bank-form-row">
            <div className="bank-form-group">
              <label>Bankın Adı *</label>
              <input
                type="text"
                placeholder="məs: Azərbaycan Beynəlxalq Bankı (ABB ASC)"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bank-form-row">
            <div className="bank-form-group">
              <label>Bank Hesabı (IBAN) *</label>
              <div className="bank-input-with-icon">
                <CreditCard size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="AZ12ABB0000000012345678901"
                  value={iban}
                  maxLength={34}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  required
                />
              </div>
              <small className="bank-hint">
                28 simvolluq rəsmi AZ-IBAN kodu (bütün çıxarışlar bu hesaba edilir).
              </small>
            </div>
          </div>

          <div className="bank-form-grid">
            <div className="bank-form-group">
              <label>Şirkət VÖEN</label>
              <input
                type="text"
                placeholder="10 rəqəmli VÖEN"
                maxLength={10}
                value={voen}
                onChange={(e) => setVoen(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <div className="bank-form-group">
              <label>Bank Kodu / M/H</label>
              <input
                type="text"
                placeholder="məs: 805623"
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
              />
            </div>
            <div className="bank-form-group">
              <label>SWIFT / BIC</label>
              <input
                type="text"
                placeholder="məs: IBAZAZ2X"
                value={swiftBic}
                onChange={(e) => setSwiftBic(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="bank-security-badge">
            <ShieldCheck size={18} />
            <span>Məlumatlar 256-bit SSL şifrələnmə ilə qorunur və təhlükəsiz köçürmələrdə istifadə edilir.</span>
          </div>

          <div className="bank-actions">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Ləğv et
            </Button>
            <Button variant="primary" type="submit" isLoading={loading}>
              Yadda Saxla
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
