import React, { useState, useEffect } from 'react';
import { Company } from '@toursales/types';
import { Button } from '@toursales/ui';
import './BankingTab.css';

interface BankingTabProps {
  company: Company;
  onSave: (data: Partial<Company>) => Promise<void>;
  saving: boolean;
}

interface BankMetadata {
  name: string;
  code: string;
  swift: string;
  voen: string;
}

const AZERBAIJAN_BANKS: Record<string, BankMetadata> = {
  NABZ: {
    name: 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
    code: '805655',
    swift: 'IBAZAZ2X',
    voen: '9900001881'
  },
  KAPZ: {
    name: 'Kapital Bank ASC',
    code: '200155',
    swift: 'AIIBAZ2X',
    voen: '9900003611'
  },
  PASZ: {
    name: 'PAŞA Bank ASC',
    code: '505199',
    swift: 'PASHAZ22',
    voen: '1401551061'
  },
  YKBZ: {
    name: 'Yapı Kredi Bank Azərbaycan QSC',
    code: '400122',
    swift: 'YAPIAZ22',
    voen: '9900019271'
  },
  UNBZ: {
    name: 'Unibank Kommersiya Bankı ASC',
    code: '505677',
    swift: 'UBNKAZ22',
    voen: '1300067601'
  },
  ASBZ: {
    name: 'AccessBank QSC',
    code: '300188',
    swift: 'ACNRAZ22',
    voen: '1400262101'
  },
  RABZ: {
    name: 'Rabitəbank ASC',
    code: '505888',
    swift: 'RABTAZ22',
    voen: '9900005791'
  },
  XALZ: {
    name: 'Xalq Bank ASC',
    code: '505999',
    swift: 'HAQZAZ22',
    voen: '1500332801'
  },
  RESZ: {
    name: 'Bank Respublika ASC',
    code: '505444',
    swift: 'BRESAZ22',
    voen: '9900000991'
  }
};

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
  // IBAN-ı 4 simvoldan bir boşluqla formatlayan köməkçi funksiya
  const formatIbanWithSpaces = (raw: string) => {
    const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 28);
    const parts = cleaned.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleaned;
  };

  const initialIban = company.iban || company.bankIban || '';
  const initialPayout = company.payoutAccount || company.iban || company.bankIban || '';

  const [formData, setFormData] = useState({
    bankName: company.bankName || 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
    iban: formatIbanWithSpaces(initialIban),
    bankVoen: company.bankVoen || '',
    bankCode: company.bankCode || '',
    swiftBic: company.swiftBic || '',
    payoutAccount: formatIbanWithSpaces(initialPayout),
    accountantName: company.accountantName || '',
    accountantPhone: company.accountantPhone || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const rawIban = company.iban || company.bankIban || '';
    const rawPayout = company.payoutAccount || company.iban || company.bankIban || '';

    setFormData({
      bankName: company.bankName || 'Azərbaycan Beynəlxalq Bankı (ABB ASC)',
      iban: formatIbanWithSpaces(rawIban),
      bankVoen: company.bankVoen || '',
      bankCode: company.bankCode || '',
      swiftBic: company.swiftBic || '',
      payoutAccount: formatIbanWithSpaces(rawPayout),
      accountantName: company.accountantName || '',
      accountantPhone: company.accountantPhone || ''
    });
    setErrors({});
  }, [company]);

  // IBAN-dan aşkar olunan bank
  const cleanIban = formData.iban.replace(/\s+/g, '');
  const detectedBankCode = cleanIban.length >= 8 ? cleanIban.slice(4, 8) : null;
  const detectedBank = detectedBankCode ? AZERBAIJAN_BANKS[detectedBankCode] : null;

  // Aşkarlanan bankın rekvizitlərini avtomatik doldurmaq
  const applyDetectedBank = () => {
    if (!detectedBank) return;
    setFormData((prev) => ({
      ...prev,
      bankName: detectedBank.name,
      bankCode: detectedBank.code,
      swiftBic: detectedBank.swift,
      bankVoen: detectedBank.voen
    }));
  };

  // Pul çıxarış hesabını əsas IBAN ilə sinxronlaşdır
  const syncPayoutAccount = () => {
    setFormData((prev) => ({
      ...prev,
      payoutAccount: prev.iban
    }));
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 28);
    const formatted = formatIbanWithSpaces(rawValue);
    setFormData((prev) => ({
      ...prev,
      iban: formatted
    }));

    if (errors.iban) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.iban;
        return next;
      });
    }

    // Əgər tanınan bankdırsa və bank sahəsi boşdursa, avtomatik təklif
    if (rawValue.length >= 8) {
      const code = rawValue.slice(4, 8);
      const bank = AZERBAIJAN_BANKS[code];
      if (bank && (!formData.swiftBic || !formData.bankCode)) {
        setFormData((prev) => ({
          ...prev,
          bankName: prev.bankName && prev.bankName !== 'Azərbaycan Beynəlxalq Bankı (ABB ASC)' ? prev.bankName : bank.name,
          bankCode: prev.bankCode || bank.code,
          swiftBic: prev.swiftBic || bank.swift,
          bankVoen: prev.bankVoen || bank.voen
        }));
      }
    }
  };

  const handlePayoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 28);
    const formatted = formatIbanWithSpaces(rawValue);
    setFormData((prev) => ({
      ...prev,
      payoutAccount: formatted
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const rawIban = formData.iban.replace(/\s+/g, '');

    if (!rawIban) {
      newErrors.iban = 'IBAN hesabı mütləq daxil edilməlidir';
    } else if (!rawIban.startsWith('AZ')) {
      newErrors.iban = "Azərbaycan IBAN-ı mütləq 'AZ' prefiksi ilə başlamalıdır";
    } else if (rawIban.length !== 28) {
      newErrors.iban = `IBAN 28 simvol olmalıdır (hazırda: ${rawIban.length} simvol)`;
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank adı mütləq daxil edilməlidir';
    }

    if (formData.swiftBic.trim()) {
      const cleanSwift = formData.swiftBic.trim().toUpperCase();
      if (cleanSwift.length !== 8 && cleanSwift.length !== 11) {
        newErrors.swiftBic = 'SWIFT / BIC kodu 8 və ya 11 simvol olmalıdır';
      }
    }

    if (formData.bankVoen.trim() && !/^\d{10}$/.test(formData.bankVoen.trim())) {
      newErrors.bankVoen = 'Bank VÖEN-i 10 rəqəmli olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    if (!validate()) {
      setNotification({
        type: 'error',
        text: 'Zəhmət olmasa bank rekvizitlərindəki format xətalarını aradan qaldırın.'
      });
      return;
    }

    const unspacedIban = formData.iban.replace(/\s+/g, '').toUpperCase();
    const unspacedPayout = formData.payoutAccount.replace(/\s+/g, '').toUpperCase();

    try {
      await onSave({
        bankName: formData.bankName.trim(),
        iban: unspacedIban,
        bankIban: unspacedIban,
        bankVoen: formData.bankVoen.trim(),
        bankCode: formData.bankCode.trim(),
        swiftBic: formData.swiftBic.trim().toUpperCase(),
        payoutAccount: unspacedPayout || unspacedIban,
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

      {/* Info Callout with Audit Notification */}
      <div className="banking-security-callout">
        <div className="callout-icon">🛡️</div>
        <div className="callout-body">
          <div className="callout-header-row">
            <h4>Rəsmi Hesablaşma və Çıxarış Təhlükəsizliyi</h4>
            <span className="audit-secure-badge">AuditLog Mühafizəsi</span>
          </div>
          <p>
            Maliyyə balansı üzrə bilet satış gəlirlərinin nağdsız köçürülməsi yalnız burada qeyd olunan rəsmi hüquqi IBAN hesabına həyata keçirilir.
            Rekvizitlərdə edilən hər bir dəyişiklik təhlükəsizlik jurnalında arxivlənir.
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
            <div className={`form-field-group ${errors.iban ? 'has-error' : ''}`}>
              <div className="label-with-tool">
                <label htmlFor="iban">
                  Bank Hesablaşma Hesabı (IBAN) <span className="req-star">*</span>
                </label>
                <span className={`iban-char-counter ${cleanIban.length === 28 ? 'valid' : ''}`}>
                  {cleanIban.length}/28 simvol
                </span>
              </div>
              <input
                id="iban"
                name="iban"
                type="text"
                value={formData.iban}
                onChange={handleIbanChange}
                placeholder="AZ21 NABZ 0135 0100 0000 0012 3456"
                maxLength={34}
                className="smart-iban-input"
              />
              {errors.iban ? (
                <span className="field-error-text">{errors.iban}</span>
              ) : (
                <span className="field-hint">Azərbaycan standartı üzrə 28 simvollu IBAN (4 simvoldan bir boşluqla)</span>
              )}

              {/* Detected Bank Card */}
              {detectedBank && (
                <div className="detected-bank-card">
                  <div className="detected-bank-info">
                    <span className="detected-bank-icon">🏦</span>
                    <div>
                      <strong className="detected-bank-title">{detectedBank.name}</strong>
                      <span className="detected-bank-meta">SWIFT: {detectedBank.swift} • Kod: {detectedBank.code}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="detected-bank-autofill-btn"
                    onClick={applyDetectedBank}
                    title="Bu bankın bütün rekvizitlərini avtomatik doldur"
                  >
                    Rekvizitləri Doldur
                  </button>
                </div>
              )}
            </div>

            <div className={`form-field-group ${errors.bankName ? 'has-error' : ''}`}>
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
                placeholder="Bank adını seçin və ya daxil edin"
              />
              <datalist id="bank-suggestions">
                {COMMON_BANKS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {errors.bankName && <span className="field-error-text">{errors.bankName}</span>}
            </div>
          </div>

          <div className="form-row-3">
            <div className={`form-field-group ${errors.bankVoen ? 'has-error' : ''}`}>
              <label htmlFor="bankVoen">Bankın VÖEN-i</label>
              <input
                id="bankVoen"
                name="bankVoen"
                type="text"
                value={formData.bankVoen}
                onChange={handleChange}
                placeholder="9900001881"
                maxLength={10}
              />
              {errors.bankVoen && <span className="field-error-text">{errors.bankVoen}</span>}
            </div>

            <div className="form-field-group">
              <label htmlFor="bankCode">MFO / Bank Kodu</label>
              <input
                id="bankCode"
                name="bankCode"
                type="text"
                value={formData.bankCode}
                onChange={handleChange}
                placeholder="805655"
              />
            </div>

            <div className={`form-field-group ${errors.swiftBic ? 'has-error' : ''}`}>
              <label htmlFor="swiftBic">SWIFT / BIC Kodu</label>
              <input
                id="swiftBic"
                name="swiftBic"
                type="text"
                value={formData.swiftBic}
                onChange={handleChange}
                placeholder="IBAZAZ2X"
                style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                maxLength={11}
              />
              {errors.swiftBic && <span className="field-error-text">{errors.swiftBic}</span>}
            </div>
          </div>

          <div className="form-field-group full-width">
            <div className="label-with-tool">
              <label htmlFor="payoutAccount">Pul Çıxarışı (Payout) Təyin Edilmiş Hesab</label>
              <button
                type="button"
                className="sync-payout-btn"
                onClick={syncPayoutAccount}
                title="Yuxarıdakı əsas IBAN ilə eyniləşdir"
              >
                🔄 Əsas IBAN-ı Tətbiq Et
              </button>
            </div>
            <input
              id="payoutAccount"
              name="payoutAccount"
              type="text"
              value={formData.payoutAccount}
              onChange={handlePayoutChange}
              placeholder="AZ21 NABZ 0135 0100 0000 0012 3456"
              className="smart-iban-input"
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
