import React, { useState } from 'react';
import { PassengerInfo } from '@toursales/types';
import { Card, Input, Badge, Button } from '@toursales/ui';
import {
  User,
  Phone,
  CreditCard,
  Upload,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info,
  Copy,
  Check,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import './PassengerForm.css';

interface PassengerFormProps {
  passengers: PassengerInfo[];
  onUpdatePassenger: (seatNumber: number, field: keyof PassengerInfo, value: any) => void;
  onCopyDetailsToAll?: (sourceSeatNumber: number) => void;
  isForeignTour?: boolean;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  passengers,
  onUpdatePassenger,
  onCopyDetailsToAll,
  isForeignTour = false,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleFinChange = (seatNumber: number, rawVal: string) => {
    const cleaned = rawVal.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
    onUpdatePassenger(seatNumber, 'finCode', cleaned);
    onUpdatePassenger(seatNumber, 'idNumber', cleaned);
  };

  const handlePassportChange = (seatNumber: number, rawVal: string) => {
    const cleaned = rawVal.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    onUpdatePassenger(seatNumber, 'passportNumber', cleaned);
  };

  const handleCopyContacts = (seatNumber: number, idx: number) => {
    if (onCopyDetailsToAll) {
      onCopyDetailsToAll(seatNumber);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  return (
    <div className="web-passenger-form-list">
      {/* Regulatory Compliance Notice */}
      <div className="web-passenger-compliance-banner">
        <div className="compliance-icon-wrap">
          <ShieldCheck size={24} className="compliance-icon" />
        </div>
        <div className="compliance-content">
          <h4 className="compliance-title">Dövlət Turizm və Sığorta Qaydaları</h4>
          <p className="compliance-text">
            Azərbaycan Respublikasının turizm və sərnişindaşıma tələblərinə uyğun olaraq, hər bir sərnişin üçün
            7 simvollu FİN kod və ya şəxsiyyət vəsiqəsi məlumatları sığorta polisinə daxil edilir.
            {isForeignTour && ' Xarici turlar üçün xarici pasport nömrəsi və doğum tarixi tələb olunur.'}
          </p>
        </div>
      </div>

      {passengers.map((p, idx) => {
        const isPrimary = idx === 0;
        const finLength = (p.finCode || p.idNumber || '').length;
        const isFinValid = /^[A-Z0-9]{7}$/.test(p.finCode || p.idNumber || '');
        const finHelper =
          finLength === 7
            ? isFinValid
              ? '✓ 7 simvol tamamlandı'
              : 'Xəta: Yalnız ingilis hərfləri və rəqəmlər'
            : `${finLength}/7 simvol`;

        return (
          <Card key={p.seatNumber} variant="default" className="web-passenger-card">
            {/* Passenger Header */}
            <div className="web-passenger-card-header">
              <div className="web-passenger-title-group">
                <div className="passenger-avatar-badge">
                  {p.seatNumber}
                </div>
                <div>
                  <h4 className="web-passenger-title">
                    Sərnişin #{idx + 1}
                  </h4>
                  <div className="web-passenger-subtags">
                    <span className="seat-badge">Oturacaq №{p.seatNumber}</span>
                    {isPrimary && <span className="primary-passenger-badge">Əsas Sifarişçi</span>}
                  </div>
                </div>
              </div>

              {/* Quick Copy Contact Button */}
              {passengers.length > 1 && onCopyDetailsToAll && (
                <button
                  type="button"
                  className={`web-passenger-copy-btn ${copiedIndex === idx ? 'copied' : ''}`}
                  onClick={() => handleCopyContacts(p.seatNumber, idx)}
                  title="Bu sərnişinin əlaqə nömrəsini digər sərnişinlərə tətbiq et"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check size={14} /> Tətbiq olundu
                    </>
                  ) : (
                    <>
                      <Copy size={14} /> Əlaqəni hamısına tətbiq et
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="web-passenger-inputs-grid">
              {/* Ad və Soyad */}
              <Input
                label="Ad və Soyad"
                placeholder="Məs: Əli Məmmədov"
                value={p.fullName}
                onChange={(e) => onUpdatePassenger(p.seatNumber, 'fullName', e.target.value)}
                leftIcon={<User size={16} />}
                required
                helperText="Şəxsiyyət vəsiqəsindəki kimi qeyd edin"
              />

              {/* Əlaqə Nömrəsi */}
              <Input
                label="Əlaqə Nömrəsi"
                placeholder="+994 50 123 45 67"
                value={p.phone}
                onChange={(e) => onUpdatePassenger(p.seatNumber, 'phone', e.target.value)}
                leftIcon={<Phone size={16} />}
                required
                helperText="SMS bildiriş və vauçer üçün"
              />

              {/* FİN Kod */}
              <div className="web-fin-input-wrapper">
                <div className="web-field-top-label">
                  <span className="field-label-text">FİN Kod (7 simvol) *</span>
                  <span
                    className={`fin-status-pill ${
                      finLength === 7 && isFinValid
                        ? 'status-valid'
                        : finLength > 0
                        ? 'status-incomplete'
                        : 'status-empty'
                    }`}
                  >
                    {finHelper}
                  </span>
                </div>
                <Input
                  placeholder="Məs: 7ABC123"
                  value={p.finCode || p.idNumber || ''}
                  onChange={(e) => handleFinChange(p.seatNumber, e.target.value)}
                  leftIcon={<CreditCard size={16} />}
                  maxLength={7}
                  required
                />
              </div>

              {/* Təcili Əlaqə Nömrəsi */}
              <Input
                label="Təcili Əlaqə Nömrəsi (Könüllü)"
                placeholder="+994 55 987 65 43"
                value={p.emergencyPhone || ''}
                onChange={(e) => onUpdatePassenger(p.seatNumber, 'emergencyPhone', e.target.value)}
                leftIcon={<AlertCircle size={16} />}
                helperText="Ailə üzvü və ya yaxın qohum"
              />

              {/* Foreign Tour Specifics */}
              {isForeignTour && (
                <>
                  <Input
                    label="Xarici Pasport Nömrəsi *"
                    placeholder="Məs: C12345678"
                    value={p.passportNumber || ''}
                    onChange={(e) => handlePassportChange(p.seatNumber, e.target.value)}
                    leftIcon={<CreditCard size={16} />}
                    required
                  />

                  <div className="web-date-input-wrapper">
                    <label className="field-label-text">Doğum Tarixi *</label>
                    <div className="web-native-input-wrap">
                      <Calendar size={16} className="input-icon-decor" />
                      <input
                        type="date"
                        className="web-styled-native-input"
                        value={p.birthDate || ''}
                        onChange={(e) => onUpdatePassenger(p.seatNumber, 'birthDate', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Gender Select */}
                  <div className="web-gender-group">
                    <label className="field-label-text">Cinsiyyət *</label>
                    <div className="web-gender-options">
                      <button
                        type="button"
                        className={`web-gender-btn ${p.gender === 'MALE' ? 'active' : ''}`}
                        onClick={() => onUpdatePassenger(p.seatNumber, 'gender', 'MALE')}
                      >
                        Kişi
                      </button>
                      <button
                        type="button"
                        className={`web-gender-btn ${p.gender === 'FEMALE' ? 'active' : ''}`}
                        onClick={() => onUpdatePassenger(p.seatNumber, 'gender', 'FEMALE')}
                      >
                        Qadın
                      </button>
                    </div>
                  </div>

                  <Input
                    label="Pasport Sənədi / Linki (Könüllü)"
                    placeholder="Pasport şəklinin linki və ya fayl adı"
                    value={p.passportUrl || ''}
                    onChange={(e) => onUpdatePassenger(p.seatNumber, 'passportUrl', e.target.value)}
                    leftIcon={<Upload size={16} />}
                  />
                </>
              )}

              {/* Xüsusi Tələblər / Qeydlər */}
              <div className="web-passenger-notes-span">
                <Input
                  label="Xüsusi Qeydlər (Könüllü)"
                  placeholder="Məs: vegetarian menyu, xüsusi tibbi ehtiyac və ya oturacaq xahişi"
                  value={p.notes || ''}
                  onChange={(e) => onUpdatePassenger(p.seatNumber, 'notes', e.target.value)}
                  leftIcon={<FileText size={16} />}
                />
              </div>
            </div>
          </Card>
        );
      })}

      {/* FIN code helper box */}
      <div className="web-passenger-fin-guide">
        <Info size={18} className="guide-icon" />
        <div className="guide-text">
          <strong>FİN kodu necə tapmaq olar?</strong>
          <span>
            Yeni nəsil şəxsiyyət vəsiqələrində sağ aşağı küncdə yerləşən 7 simvollu unikal koddur.
            Köhnə vəsiqələrdə isə sağ aşağıdakı son 8 rəqəmin sonuncu rəqəmi istisna olmaqla əvvəlki 7 simvoludur.
          </span>
        </div>
      </div>
    </div>
  );
};
