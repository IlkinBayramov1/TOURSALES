import React, { useState } from 'react';
import { 
  X, User, Phone, Mail, Calendar, ShieldCheck, 
  CheckCircle2, CreditCard, Plus, Minus
} from 'lucide-react';
import styles from './BookingModal.module.css';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourTitle?: string;
  tourPrice?: number;
  tourDate?: string;
  onConfirm?: (bookingData: any) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  tourTitle = 'Möhtəşəm Şahdağ Qış və Yay Kompleksi',
  tourPrice = 35,
  tourDate = '12 Aprel 2026',
  onConfirm
}) => {
  const [passengersCount, setPassengersCount] = useState(1);
  const [paymentMode, setPaymentMode] = useState<'deposit' | 'full'>('deposit');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    note: ''
  });

  if (!isOpen) return null;

  const depositAmount = 5 * passengersCount; // 5 AZN deposit per person
  const totalPrice = tourPrice * passengersCount;
  const remainingAmount = totalPrice - depositAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onConfirm) {
      onConfirm({
        ...formData,
        passengersCount,
        paymentMode,
        depositAmount,
        totalPrice,
        remainingAmount
      });
    }
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        
        {/* Close Button */}
        <button className={styles.btnClose} onClick={onClose} aria-label="Bağla">
          <X size={20} />
        </button>

        {!isSubmitted ? (
          <>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalTag}>
                <ShieldCheck size={14} /> Sürətli & Təhlükəsiz Rezervasiya
              </div>
              <h2 className={styles.modalTitle}>{tourTitle}</h2>
              <div className={styles.modalSubtitle}>
                <span><Calendar size={14} /> {tourDate}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  
                  {/* Passenger Counter Selector */}
                  <div className={styles.paxSelector}>
                    <div className={styles.paxInfo}>
                      <h4>Sərnişin Sayı</h4>
                      <p>Neçə nəfər səyahət edəcəksiniz?</p>
                    </div>
                    <div className={styles.counterWrap}>
                      <button 
                        type="button"
                        className={styles.btnCounter}
                        disabled={passengersCount <= 1}
                        onClick={() => setPassengersCount(prev => prev - 1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className={styles.counterValue}>{passengersCount}</span>
                      <button 
                        type="button"
                        className={styles.btnCounter}
                        disabled={passengersCount >= 10}
                        onClick={() => setPassengersCount(prev => prev + 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Input 1: Full Name */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Ad və Soyadınız *</label>
                    <div className={styles.inputWrap}>
                      <User size={18} className={styles.inputIcon} />
                      <input 
                        type="text" 
                        required
                        placeholder="Əli Məmmədov"
                        className={styles.fieldInput}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Input 2 & 3: Phone & Email */}
                  <div className={styles.formRow}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Mobil Telefon *</label>
                      <div className={styles.inputWrap}>
                        <Phone size={18} className={styles.inputIcon} />
                        <input 
                          type="tel" 
                          required
                          placeholder="+994 (50) 000-0000"
                          className={styles.fieldInput}
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>E-poçt Ünvanı</label>
                      <div className={styles.inputWrap}>
                        <Mail size={18} className={styles.inputIcon} />
                        <input 
                          type="email" 
                          placeholder="ornek@mail.com"
                          className={styles.fieldInput}
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Ödəniş Üsulu Seçimi</label>
                    <div className={styles.paymentModeGroup}>
                      <div 
                        className={`${styles.paymentModeCard} ${paymentMode === 'deposit' ? styles.paymentModeSelected : ''}`}
                        onClick={() => setPaymentMode('deposit')}
                      >
                        <span className={styles.modeTitle}>Beh Ödənişi ({depositAmount} AZN)</span>
                        <span className={styles.modeDesc}>Yerinizi saxlayın, qalıq {remainingAmount} AZN nəğd ödənsin.</span>
                      </div>
                      <div 
                        className={`${styles.paymentModeCard} ${paymentMode === 'full' ? styles.paymentModeSelected : ''}`}
                        onClick={() => setPaymentMode('full')}
                      >
                        <span className={styles.modeTitle}>Tam Ödəniş ({totalPrice} AZN)</span>
                        <span className={styles.modeDesc}>Bütün məbləği kartla indi rahatlıqla ödəyin.</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className={styles.summaryBox}>
                    <div className={styles.summaryRow}>
                      <span>Adambaşı tur qiyməti:</span>
                      <span>{tourPrice} AZN</span>
                    </div>
                    <div className={styles.summaryRow}>
                      <span>Sərnişin sayı:</span>
                      <span>{passengersCount} nəfər</span>
                    </div>
                    <div className={styles.summaryTotal}>
                      <span className={styles.totalLabel}>İndi Ödəniləcək Məbləğ:</span>
                      <span className={styles.totalPrice}>
                        {paymentMode === 'deposit' ? depositAmount : totalPrice} AZN
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Footer */}
              <div className={styles.modalFooter}>
                <button type="submit" className={styles.btnSubmit}>
                  <CreditCard size={20} /> Sifarişi Təsdiqlə və Ödə
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className={styles.successScreen}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={48} />
            </div>
            <h2 className={styles.successTitle}>Rezervasiyanız Qəbul Olundu!</h2>
            <p className={styles.successText}>
              Hörmətli <strong>{formData.fullName || 'Müştərimiz'}</strong>, bilet məlumatlarınız SMS və WhatsApp vasitəsilə <strong>{formData.phone || 'telefonunuza'}</strong> göndərildi.
            </p>
            <button className={styles.btnDone} onClick={handleResetAndClose}>
              Tamam
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
