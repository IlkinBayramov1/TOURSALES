import React from 'react';
import { ShieldCheck, FileCheck, HelpCircle } from 'lucide-react';
import { Card } from '@toursales/ui';
import './VisaSupportNotice.css';

export const VisaSupportNotice: React.FC = () => {
  return (
    <Card variant="glass" className="web-visa-notice-card">
      <div className="web-visa-notice-icon">
        <ShieldCheck size={28} />
      </div>
      <div className="web-visa-notice-content">
        <h4 className="web-visa-notice-title">Xarici Səyahət & Viza Dəstəyi Haqqında</h4>
        <p className="web-visa-notice-desc">
          Xarici turlarda iştirak üçün xarici pasportunuzun etibarlılıq müddəti ən azı <strong>6 ay</strong> olmalıdır.
          Türkiyə və Gürcüstana vizasız rejim tətbiq olunur. BƏƏ və Şengen ölkələri üçün tur şirkətlərimiz tam sənədləşmə və viza dəstəyi göstərir.
        </p>
      </div>
    </Card>
  );
};
