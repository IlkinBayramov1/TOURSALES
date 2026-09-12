import React, { useState, useEffect } from 'react';
import { Company } from '@toursales/types';
import { Button } from '@toursales/ui';
import './BankingTab.css';

interface BankingTabProps {
  company: Company;
  onSave: (data: Partial<Company>) => Promise<void>;
  saving: boolean;
}

const COMMON_BANKS = [
  'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
  'Kapital Bank ASC',
  'PAŞA Bank ASC',
  'Bank Respublika ASC',
  'Xalq Bank ASC',
  'AccessBank QSC',
  'Unibank Kommersiya Bankı ASC',
  'Yapı Kredi Bank Azərbaycan QSC',
  'Rabitəbank ASC'
];

export const BankingTab: React.FC<BankingTabProps> = ({
  company,
  onSave,
  saving
}) => {
  const [formData, setFormData] = useState({
    bankName: company.bankName || 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
    iban: company.iban || company.bankIban || '',
    bankVoen: company.bankVoen || '',
    bankCode: company.bankCode || '',
    swiftBic: company.swiftBic || '',
    payoutAccount: company.payoutAccount || company.iban || company.bankIban || '',
    accountantName: company.accountantName || '',
    accountantPhone: company.accountantPhone || ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setFormData({
      bankName: company.bankName || 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
      iban: company.iban || company.bankIban || '',
      bankVoen: company.bankVoen || '',
      bankCode: company.bankCode || '',
      swiftBic: company.swiftBic || '',
      payoutAccount: company.payoutAccount || company.iban || company.bankIban || '',
      accountantName: company.accountantName || '',
      accountantPhone: company.accountantPhone || ''
    });
  }, [company]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    try {
      await onSave({
        bankName: formData.bankName.trim(),
        iban: formData.iban.trim().toUpperCase(),
        bankIban: formData.iban.trim().toUpperCase(),
        bankVoen: formData.bankVoen.trim(),
        bankCode: formData.bankCode.trim(),
        swiftBic: formData.swiftBic.trim().toUpperCase(),
        payoutAccount: formData.payoutAccount.trim().toUpperCase(),
        accountantName: formData.accountantName.trim(),
        accountantPhone: formData.accountantPhone.trim()
      });

      setNotification({
        type: 'success',
        text: 'Bank hesablaşma rekvizitləri və mühasibatlıq əlaqələri uğurla yadda saxlanıldı!'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch {
      setNotification({
        type: 'error',
        text: 'Bank rekvizitlərini yadda saxlayarkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.'
      });
    }
  };

  return (
    <div className="tab-pane-content">
      {notification && (
        <div className={`tab-notification ${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'success' ? '✓' : '⚠️'}
          </div>
          <span>{notification.text}</span>
        </div>
      )}

      {/* Info Callout */}
      <div className="banking-security-callout">
        <div className="callout-icon">🛡️</div>
        <div className="callout-body">
          <h4>Rəsmi Hesablaşma və Çıxarış Təhlükəsizliyi</h4>
          <p>
            Maliyyə balansı üzrə bilet satış gəlirlərinin nağdsız köçürülməsi yalnız burada qeyd olunan rəsmi hüquqi IBAN hesabına həyata keçirilir.
            Rekvizitlərin doğruluğunu təmin etməyiniz xahiş olunur.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-edit-form">
        {/* Bank Details Section */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Xidmət Göstərən Bank Rekvizitləri</h3>
            <p className="section-desc">Agentliyinizin rəsmi bank hesabı və klirinq kodları</p>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="bankName">
                Xidmət Göstərən Bank <span className="req-star">*</span>
              </label>
              <input
                id="bankName"
                name="bankName"
                list="bank-suggestions"
                type="text"
                value={formData.bankName}
                onChange={handleChange}
                required
                placeholder="Bank adını seçin və ya daxil edin"
              />
              <datalist id="bank-suggestions">
                {COMMON_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="form-field-group">
              <label htmlFor="iban">
                Bank Hesablaşma Hesabı (IBAN) <span className="req-star">*</span>
              </label>
              <input
                id="iban"
                name="iban"
                type="text"
                value={formData.iban}
                onChange={handleChange}
                required
                placeholder="AZ12ABB0000000012345678901"
                maxLength={28}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
              />
              <span className="field-hint">Azərbaycan standartı üzrə 28 simvollu IBAN (Məs: AZ...ABB...)</span>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-field-group">
              <label htmlFor="bankVoen">Bankın VÖEN-i</label>
              <input
                id="bankVoen"
                name="bankVoen"
                type="text"
                value={formData.bankVoen}
                onChange={handleChange}
                placeholder="9900001881"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="bankCode">MFO / Bank Kodu</label>
              <input
                id="bankCode"
                name="bankCode"
                type="text"
                value={formData.bankCode}
                onChange={handleChange}
                placeholder="805624"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="swiftBic">SWIFT / BIC Kodu</label>
              <input
                id="swiftBic"
                name="swiftBic"
                type="text"
                value={formData.swiftBic}
                onChange={handleChange}
                placeholder="IBAZAZ2X"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          <div className="form-field-group full-width">
            <label htmlFor="payoutAccount">Pul Çıxarışı (Payout) Təyin Edilmiş Hesab</label>
            <input
              id="payoutAccount"
              name="payoutAccount"
              type="text"
              value={formData.payoutAccount}
              onChange={handleChange}
              placeholder="AZ12ABB0000000012345678901"
              style={{ fontFamily: 'monospace' }}
            />
            <span className="field-hint">Maliyyə & Balans bölməsindən çıxarış tələb etdikdə vəsait birbaşa bu hesaba köçürülür</span>
          </div>
        </div>

        {/* Accountant / Finance Contact */}
        <div className="form-card-section">
          <div className="section-title-wrap">
            <h3 className="section-title">Mühasibatlıq və Maliyyə Əlaqələri</h3>
            <p className="section-desc">Hesab-fakturalar və ödəniş uzlaşmaları üzrə məsul əməkdaş</p>
          </div>

          <div className="form-row-2">
            <div className="form-field-group">
              <label htmlFor="accountantName">Baş Mühasib / Maliyyə Meneceri</label>
              <input
                id="accountantName"
                name="accountantName"
                type="text"
                value={formData.accountantName}
                onChange={handleChange}
                placeholder="Məs: Fərid Quliyev"
              />
            </div>

            <div className="form-field-group">
              <label htmlFor="accountantPhone">Mühasibatlıq Əlaqə Nömrəsi</label>
              <input
                id="accountantPhone"
                name="accountantPhone"
                type="tel"
                value={formData.accountantPhone}
                onChange={handleChange}
                placeholder="+994 55 987 65 43"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="form-actions-bar">
          <Button variant="primary" type="submit" isLoading={saving}>
            Bank Rekvizitlərini Yadda Saxla
          </Button>
        </div>
      </form>
    </div>
  );
};
