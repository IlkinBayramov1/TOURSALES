import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import './SubscriptionFaq.css';

export const SubscriptionFaq: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Abunəlik planımı istənilən vaxt dəyişə bilərəmmi?',
      a: 'Bəli, ehtiyacınız yarandıqda istənilən vaxt daha yüksək və ya daha münasib plana keçə bilərsiniz. Yeni planın güzəştli komissiya dərəcələri və genişləndirilmiş tur limitləri keçid etdiyiniz andan dərhal qüvvəyə minir.',
    },
    {
      q: 'Mövcud aktiv tur limitim dolsa nə baş verir?',
      a: 'Əgər planınızın maksimum tur limiti dolarsa (məsələn, Başlanğıc planında 5 tur), aktiv turlarınız normal qaydada satışda qalmağa davam edir. Lakin yeni tur yaratmaq üçün planınızı "Peşəkar" və ya "Korporativ" səviyyəsinə yüksəltməyiniz tələb olunacaq.',
    },
    {
      q: 'Abunəlik haqqı platformadakı mövcud balansdan ödənilə bilərmi?',
      a: 'Bəli, TOURSALES Partner sistemində bilet satışlarından formalaşan çıxarış balansınız varsa, hər hansı kənar bank kartına ehtiyac olmadan birbaşa platforma balansınızdan ödəniş edə bilərsiniz.',
    },
    {
      q: 'İllik hesablaşma rejimində hansı üstünlüklər təqdim olunur?',
      a: 'İllik seçim etdikdə illik paketə 20% xüsusi qənaət tətbiq olunur (faktiki olaraq 2 ayı pulsuz əldə edirsiniz). Həmçinin Korporativ planda fərdi menecer və reklam bannerlərinə əlavə endirimlər təqdim edilir.',
    },
  ];

  const toggleFaq = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <div className="sub-faq-card">
      <div className="sub-faq-header">
        <HelpCircle size={22} className="text-primary" />
        <div>
          <h3>Tez-tez Verilən Suallar</h3>
          <p>Abunəlik və hesablaşma sistemi haqqında ən çox maraqlanılan məqamlar</p>
        </div>
      </div>

      <div className="sub-faq-list">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className={`sub-faq-item ${isOpen ? 'open' : ''}`}>
              <button
                type="button"
                className="sub-faq-question"
                onClick={() => toggleFaq(idx)}
              >
                <span>{item.q}</span>
                <ChevronDown size={18} className={`sub-faq-arrow ${isOpen ? 'rotate' : ''}`} />
              </button>
              {isOpen && (
                <div className="sub-faq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
