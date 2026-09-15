import React, { useEffect, useState } from 'react';
import { HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { Spinner, Card, Button } from '@toursales/ui';
import { cmsApi, FAQItem } from '../../api/cmsApi';
import { FAQAccordion } from '../../components/FAQAccordion/FAQAccordion';
import { SUPPORT_CONTACTS } from '@/shared/constants/contacts';
import './FAQPage.css';

export const FAQPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setLoading(true);
        const res = await cmsApi.getFaqs();
        setFaqs(res.data);
      } catch (err) {
        console.error('FAQ yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(faqs.map((item) => item.category)))];

  const filteredFaqs = selectedCategory === 'ALL' 
    ? faqs 
    : faqs.filter((item) => item.category === selectedCategory);

  return (
    <div className="web-faq-page-container">
      <div className="web-faq-header">
        <h1>Tez-tez Verilən Suallar</h1>
        <p>Səyahətiniz, rezervasiya qaydaları və ödənişlə bağlı ən çox soruşulan sualların cavabları.</p>
      </div>

      <div className="web-faq-content-layout">
        {/* Category Filter Pills */}
        <div className="web-faq-category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`web-category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'Bütün Suallar' : cat}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="web-faq-list-section">
          {loading ? (
            <div className="web-faq-loading">
              <Spinner size="lg" />
              <p>Məlumatlar hazırlanır...</p>
            </div>
          ) : (
            <FAQAccordion items={filteredFaqs} />
          )}
        </div>

        {/* Support CTA Card */}
        <Card variant="default" className="web-support-cta-card">
          <div className="web-support-icon-wrap">
            <MessageCircle size={32} />
          </div>
          <div className="web-support-content">
            <h3>Sualınıza cavab tapmadınız?</h3>
            <p>
              Müştəri xidmətləri komandamız həftənin 7 günü 09:00 - 21:00 arası sizə kömək etməyə hazırdır.
            </p>
          </div>
          <div className="web-support-actions">
            <a
              href={SUPPORT_CONTACTS.whatsappUrlWithText('Salam, TOURSALES platforması ilə bağlı sualım var.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary">
                <Phone size={16} />
                <span>WhatsApp Dəstək (+994 77 599 00 95)</span>
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
