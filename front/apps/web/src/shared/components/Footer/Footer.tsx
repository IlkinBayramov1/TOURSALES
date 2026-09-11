import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, ShieldCheck } from 'lucide-react';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="web-footer">
      <div className="web-footer-container">
        <div className="web-footer-grid">
          
          {/* Col 1: Brand & Trust */}
          <div className="web-footer-col">
            <div className="web-footer-logo">
              <MapPin size={24} className="web-footer-pin" /> TOUR<span>SALES</span>
            </div>
            <p className="web-footer-desc">
              Azərbaycanın və dünyanın ən etibarlı turizm platforması. Biz sadəcə bilet satmırıq, unudulmaz xatirələr yaradırıq.
            </p>
            <div className="web-trust-badge">
              <ShieldCheck size={18} className="web-text-success" />
              <span>Dövlət Lisenziyalı Tərəfdaşlar</span>
            </div>
          </div>

          {/* Col 2: Destinations */}
          <div className="web-footer-col">
            <h4 className="web-footer-col-title">İstiqamətlər</h4>
            <ul className="web-footer-links">
              <li><Link to="/domestic?region=Shahdag">Şahdağ və Tufandağ</Link></li>
              <li><Link to="/domestic?region=Quba">Quba və Qusar</Link></li>
              <li><Link to="/domestic?region=Ismayilli">İsmayıllı və Qəbələ</Link></li>
              <li><Link to="/foreign?country=Turkey">İstanbul və Kapadokya</Link></li>
              <li><Link to="/foreign?country=Europe">Avropa Turları</Link></li>
            </ul>
          </div>

          {/* Col 3: Ecosystem */}
          <div className="web-footer-col">
            <h4 className="web-footer-col-title">Ekosistem</h4>
            <ul className="web-footer-links">
              <li><Link to="/account/loyalty">Səyahət Xalları (Rewards)</Link></li>
              <li><Link to="/terms">Ödəniş və Qaytarma Şərtləri</Link></li>
              <li><Link to="/faq">Tez-tez Verilən Suallar</Link></li>
              <li><Link to="/blog">Səyahət Bələdçisi</Link></li>
              <li><a href="http://localhost:5174" target="_blank" rel="noreferrer">Turizm Şirkətləri üçün (B2B)</a></li>
            </ul>
          </div>

          {/* Col 4: Central Office & Support */}
          <div className="web-footer-col">
            <h4 className="web-footer-col-title">Mərkəzi Ofis</h4>
            <ul className="web-contact-list">
              <li><Phone size={16} /> <span>+994 (50) 123 45 67</span></li>
              <li><Mail size={16} /> <span>support@toursales.az</span></li>
              <li><MapPin size={16} /> <span>Bakı ş., Nizami r-nu, Heydər Əliyev pr.</span></li>
            </ul>
          </div>

        </div>

        <div className="web-footer-bottom">
          <div className="web-footer-copyright">
            © {new Date().getFullYear()} TOURSALES Marketplace. Bütün hüquqlar qorunur.
          </div>
          <div className="web-footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="web-social-btn" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="web-social-btn" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="web-social-btn" aria-label="Twitter">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
