import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQItem } from '../../api/cmsApi';
import './FAQAccordion.css';

interface FAQAccordionProps {
  items: FAQItem[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ items }) => {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="web-faq-accordion-list">
      {items.map((item) => {
        const isOpen = openId === item.id;

        return (
          <div
            key={item.id}
            className={`web-faq-item ${isOpen ? 'open' : ''}`}
          >
            <button
              type="button"
              className="web-faq-question-btn"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
            >
              <span className="web-faq-question-text">{item.question}</span>
              <ChevronDown size={18} className="web-faq-chevron" />
            </button>

            {isOpen && (
              <div className="web-faq-answer-pane">
                <p>{item.answer}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
