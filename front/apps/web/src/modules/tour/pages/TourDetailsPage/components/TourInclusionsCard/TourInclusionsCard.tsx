import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@toursales/ui';
import './TourInclusionsCard.css';

interface TourInclusionsCardProps {
  inclusions?: string[];
  exclusions?: string[];
}

export const TourInclusionsCard: React.FC<TourInclusionsCardProps> = ({
  inclusions = [],
  exclusions = [],
}) => {
  const defaultInclusions = inclusions.length > 0 ? inclusions : [
    'Komfortlu nəqliyyat və peşəkar sürücü',
    'Peşəkar və sertifikatlı tur bələdçisi',
    'Səhər yeməyi və çay fasiləsi',
    'Giriş biletləri və fotosessiya',
    'Səyahət sığortası',
  ];

  const defaultExclusions = exclusions.length > 0 ? exclusions : [
    'Nahar və şam yeməkləri',
    'Şəxsi xərclər və suvenirlər',
    'Əlavə attraksion biletləri (Teleferik, Qayıq və s.)',
  ];

  return (
    <div className="web-inclusions-wrapper">
      <h3 className="web-section-heading">Xidmət Şərtləri</h3>

      <div className="web-inclusions-grid">
        <Card variant="glass" className="web-inclusions-box included">
          <h4 className="web-inclusions-title text-success">
            <CheckCircle2 size={20} /> Qiymətə Daxildir
          </h4>
          <ul className="web-inclusions-list">
            {defaultInclusions.map((item, idx) => (
              <li key={idx} className="web-inclusions-item">
                <CheckCircle2 size={16} className="item-icon success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card variant="glass" className="web-inclusions-box excluded">
          <h4 className="web-inclusions-title text-danger">
            <XCircle size={20} /> Qiymətə Daxil Deyil
          </h4>
          <ul className="web-inclusions-list">
            {defaultExclusions.map((item, idx) => (
              <li key={idx} className="web-inclusions-item">
                <XCircle size={16} className="item-icon danger" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
