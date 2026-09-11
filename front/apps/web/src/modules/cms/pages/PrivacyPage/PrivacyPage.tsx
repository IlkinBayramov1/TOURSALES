import React, { useEffect, useState } from 'react';
import { ShieldCheck, Calendar } from 'lucide-react';
import { Spinner, Card } from '@toursales/ui';
import { cmsApi, LegalPageContent } from '../../api/cmsApi';
import './PrivacyPage.css';

export const PrivacyPage: React.FC = () => {
  const [data, setData] = useState<LegalPageContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchPrivacy = async () => {
      try {
        setLoading(true);
        const res = await cmsApi.getLegalPage('privacy');
        setData(res.data);
      } catch (err) {
        console.error('Məxfilik siyasəti yüklənərkən xəta:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacy();
  }, []);

  return (
    <div className="web-legal-page">
      <div className="web-legal-container">
        <div className="web-legal-header">
          <div className="web-legal-badge">
            <ShieldCheck size={16} />
            <span>MƏXFİLİK VƏ TƏHLÜKƏSİZLİK</span>
          </div>
          <h1>{data?.title || 'Məxfilik Siyasəti'}</h1>
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
