import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { SUPPORT_CONTACTS } from '@/shared/constants/contacts';
import './FloatingWhatsAppButton.css';

export const FloatingWhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="web-floating-whatsapp-container"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Interactive Tooltip Card */}
      <div className={`web-floating-whatsapp-tooltip ${showTooltip ? 'visible' : ''}`}>
        <div className="web-wa-tooltip-header">
          <div className="web-wa-avatar-badge">
            <MessageCircle size={14} color="#ffffff" />
          </div>
          <div>
            <span className="web-wa-title">TOURSALES Dəstək</span>
            <span className="web-wa-status">● Onlayn (09:00 - 21:00)</span>
          </div>
        </div>
        <p className="web-wa-prompt">
          Səyahət və rezervasiya ilə bağlı sualınız var? Bizə WhatsApp-da yazın!
        </p>
        <span className="web-wa-number">{SUPPORT_CONTACTS.phoneDisplay}</span>
      </div>

      {/* Floating Action Button */}
      <a
        href={SUPPORT_CONTACTS.whatsappUrlWithText(SUPPORT_CONTACTS.defaultSupportMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className="web-floating-whatsapp-btn"
        aria-label="WhatsApp Canlı Dəstək"
        title="WhatsApp Dəstək (+994 77 599 00 95)"
      >
        <div className="web-wa-ripple-effect" />
        <MessageCircle size={28} className="web-wa-main-icon" />
      </a>
    </div>
  );
};
