import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { AiTravelConciergeModal } from '../AiTravelConciergeModal/AiTravelConciergeModal';
import './FloatingAiConciergeButton.css';

export const FloatingAiConciergeButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleGlobalOpen = () => setIsOpen(true);
    window.addEventListener('open-ai-concierge', handleGlobalOpen);
    return () => window.removeEventListener('open-ai-concierge', handleGlobalOpen);
  }, []);

  return (
    <>
      <button
        type="button"
        className="floating-ai-concierge-btn"
        onClick={() => setIsOpen(true)}
        aria-label="AI Səyahət Köməkçisi"
      >
        <div className="ai-btn-sparkle-box">
          <Sparkles size={18} className="ai-sparkle-spin" />
        </div>
        <span className="ai-btn-text">AI Köməkçi</span>
      </button>

      <AiTravelConciergeModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};
