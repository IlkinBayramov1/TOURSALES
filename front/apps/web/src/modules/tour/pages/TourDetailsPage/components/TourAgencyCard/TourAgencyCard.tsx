import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Star, MapPin, Phone, MessageCircle, ArrowRight, Building2 } from 'lucide-react';
import { SUPPORT_CONTACTS } from '@/shared/constants/contacts';
import './TourAgencyCard.css';

interface TourAgencyCardProps {
  company?: {
    id: string;
    name: string;
    legalName?: string;
    logoUrl?: string | null;
    rating: number;
    phoneNumber?: string;
    city?: string;
    isVerified: boolean;
  } | null;
}

export const TourAgencyCard: React.FC<TourAgencyCardProps> = ({ company }) => {
  if (!company) {
    return (
      <div className="web-agency-card web-agency-card-placeholder">
        <div className="web-agency-header">
          <div className="web-agency-avatar-wrap">
            <Building2 size={24} className="web-agency-placeholder-icon" />
          </div>
          <div className="web-agency-main-meta">
            <h4 className="web-agency-title">Rəsmi Tərəfdaş Operator</h4>
            <span className="web-agency-badge-verified">
              <ShieldCheck size={13} /> Rəsmi Təsdiqli
            </span>
          </div>
        </div>
        <p className="web-agency-desc">
          Bu tur dövlət reyestrindən keçmiş təsdiqli tərəfdaş tərəfindən təşkil olunur.
        </p>
        <div className="web-agency-contact-actions">
          <a 
            href={SUPPORT_CONTACTS.whatsappUrlWithText('Salam, tur haqqında məlumat almaq istəyirəm.')} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="web-btn-agency-wa" 
            title="WhatsApp Dəstək"
          >
            <MessageCircle size={15} />
            <span>WhatsApp Dəstək</span>
          </a>
        </div>
      </div>
    );
  }

  const cleanPhone = company.phoneNumber?.replace(/\D/g, '') || '';
  const waLink = cleanPhone 
    ? `https://wa.me/${cleanPhone.startsWith('994') ? cleanPhone : '994' + cleanPhone}` 
    : SUPPORT_CONTACTS.whatsappUrlWithText(`Salam, "${company.name}" turu haqqında məlumat almaq istəyirəm.`);

  return (
    <div className="web-agency-card">
      <div className="web-agency-header">
        <div className="web-agency-avatar-wrap">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="web-agency-avatar-img" />
          ) : (
            <div className="web-agency-avatar-fallback">
              {company.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="web-agency-main-meta">
          <div className="web-agency-name-row">
            <h4 className="web-agency-title">{company.name}</h4>
            {company.isVerified && (
              <span title="Lisenziyalı Operator" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ShieldCheck size={16} className="web-verified-shield" />
              </span>
            )}
          </div>
          {company.legalName && company.legalName !== company.name && (
            <span className="web-agency-legal-name">{company.legalName}</span>
          )}
          <span className="web-agency-verified-pill">
            <ShieldCheck size={12} /> Lisenziyalı Turizm Şirkəti
          </span>
        </div>
      </div>

      <div className="web-agency-details-grid">
        <div className="web-agency-detail-item">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span>{(company.rating || 5.0).toFixed(1)} / 5.0 Reytinq</span>
        </div>
        <div className="web-agency-detail-item">
          <MapPin size={14} color="#64748b" />
          <span>{company.city || 'Bakı, Azərbaycan'}</span>
        </div>
      </div>

      {/* Quick Action Contacts */}
      <div className="web-agency-contact-actions">
        {company.phoneNumber && (
          <a href={`tel:${company.phoneNumber}`} className="web-btn-agency-call" title="Zəng et">
            <Phone size={14} />
            <span>{company.phoneNumber}</span>
          </a>
        )}
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="web-btn-agency-wa" title="WhatsApp">
            <MessageCircle size={15} />
            <span>WhatsApp</span>
          </a>
        )}
      </div>

      {/* View All Company Tours */}
      <Link to={`/tours?companyId=${company.id}`} className="web-agency-view-all-link">
        <span>Agentliyin Bütün Turları</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
};
