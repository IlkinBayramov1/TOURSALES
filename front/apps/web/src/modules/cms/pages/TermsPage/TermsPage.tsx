import React, { useEffect, useState } from 'react';
import { FileText, ShieldAlert, Calendar } from 'lucide-react';
import { Spinner, Card } from '@toursales/ui';
import { cmsApi, LegalPageContent } from '../../api/cmsApi';
import './TermsPage.css';

export const TermsPage: React.FC = () => {
  const [data, setData] = useState<LegalPageContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const res = await cmsApi.getLegalPage('terms');
        setData(res.data);
      } catch (err) {
        console.error('Şərtlər yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, []);

  return (
    <div className="web-legal-page">
      <div className="web-legal-container">
        <div className="web-legal-header">
          <div className="web-legal-badge">
            <FileText size={16} />
            <span>HÜQUQİ SƏNƏD</span>
          </div>
          <h1>{data?.title || 'İstifadəçi Şərtləri və Qaydaları'}</h1>
          <div className="web-legal-update-date">
            <Calendar size={14} />
            <span>Son yenilənmə: 1 Yanvar 2026</span>
          </div>
        </div>

        {loading ? (
          <div className="web-legal-loading">
            <Spinner size="lg" />
            <p>Məlumatlar yüklənir...</p>
          </div>
        ) : (
          <Card variant="default" className="web-legal-content-card">
            <div
              className="web-legal-body"
              dangerouslySetInnerHTML={{ __html: data?.content || '' }}
            />
          </Card>
        )}
      </div>
    </div>
  );
};
