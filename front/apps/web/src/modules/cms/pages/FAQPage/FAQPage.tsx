import React, { useEffect, useState } from 'react';
import { HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { Spinner, Card, Button } from '@toursales/ui';
import { cmsApi, FAQItem } from '../../api/cmsApi';
import { FAQAccordion } from '../../components/FAQAccordion/FAQAccordion';
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
        setFaqs(res.data || []);
      } catch (err) {
        console.error('Suallar yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const categories = ['ALL', ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filteredFaqs = faqs.filter(
    (faq) => selectedCategory === 'ALL' || faq.category === selectedCategory
  );

  return (
    <div className="web-faq-page">
      <div className="web-faq-hero">
        <div className="web-faq-hero-badge">
          <HelpCircle size={16} />
          <span>KÖMƏK VƏ DƏSTƏK</span>
        </div>
        <h1>Tez-tez Verilən Suallar</h1>
        <p>
          Rezervasiya, ödənişlər, Qarabağ turları icazələri və ləğvetmə şərtləri haqqında bütün sualların cavabları.
        </p>
      </div>

      <div className="web-faq-container">
        <div className="web-faq-category-row">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`web-faq-category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'Bütün Suallar' : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="web-faq-loading">
            <Spinner size="lg" />
            <p>Məlumatlar yüklənir...</p>
          </div>
        ) : (
          <div className="web-faq-accordion-wrapper">
            <FAQAccordion items={filteredFaqs} />
          </div>
        )}

        <Card variant="default" className="web-faq-support-card">
          <div className="web-support-icon">
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
              href="https://wa.me/994500000000"
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="primary">
                <Phone size={16} />
                <span>WhatsApp Dəstək</span>
              </Button>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
