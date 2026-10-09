import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  Star,
  Users,
  Calendar,
  Check,
  ArrowRight,
  HelpCircle,
  Compass,
  MapPin,
  Flame,
  DollarSign
} from 'lucide-react';
import { aiConciergeApi } from '../../api/aiConciergeApi';
import { AiConciergeResponse } from '@toursales/types';
import './AiTravelConciergeModal.css';

interface AiTravelConciergeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_PROMPTS = [
  '4 nəfərlik ailə üçün 400 AZN büdcə ilə Qəbələ və Şəkidə sakit təbiət turu',
  'Cütlüklər üçün sakit göl kənarı romantik istirahət və dağ mənzərəsi',
  'Dostlarla Şahdağ və Qubada macəra, kanat və xizək turu',
  'Tarixi məkanlar, Şəki Xan Sarayı və yerli ləziz qastronomiya turu',
];

export const AiTravelConciergeModal: React.FC<AiTravelConciergeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [result, setResult] = useState<AiConciergeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (queryText?: string) => {
    const q = queryText || prompt;
    if (!q || !q.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Step simulation for realistic generative UX
      setLoadingStep(1);
      const stepTimer1 = setTimeout(() => setLoadingStep(2), 700);
      const stepTimer2 = setTimeout(() => setLoadingStep(3), 1400);

      const data = await aiConciergeApi.getRecommendations(q.trim());
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      setResult(data);
    } catch (err: any) {
      console.error('AI Concierge error:', err);
      setError(err.response?.data?.message || 'Süni intellekt tövsiyələri hazırlanarkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    setPrompt(preset);
    handleSearch(preset);
  };

  const handleSelectPackage = (tourId: string, pax: number) => {
    onClose();
    navigate(`/tours/${tourId}?pax=${pax}`);
  };

  return (
    <div className="ai-concierge-modal-backdrop" onClick={onClose}>
      <div className="ai-concierge-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ai-concierge-modal-header">
          <div className="ai-header-branding">
            <div className="ai-sparkle-avatar">
              <Sparkles size={20} color="#ffffff" />
            </div>
            <div>
              <div className="ai-title-row">
                <h2>TOURSALES AI Concierge</h2>
                <span className="ai-beta-tag">GPT-4o Smart Match</span>
              </div>
              <p>Öz sözlərinizlə yazın, süni intellekt qrupunuz və büdcəniz üçün ən ideal 3 paketi hazırlasın.</p>
            </div>
          </div>

          <button className="ai-close-btn" onClick={onClose} aria-label="Bağla">
            <X size={20} />
          </button>
        </div>

        {/* Input & Search Area */}
        <div className="ai-concierge-search-section">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="ai-prompt-form"
          >
            <div className="ai-input-glow-wrapper">
              <input
                type="text"
                className="ai-prompt-input"
                placeholder="Məsələn: 4 nəfərlik ailə üçün 450 AZN büdcə ilə Qəbələdə sakit göl kənarı istirahət..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="ai-submit-btn"
                disabled={loading || !prompt.trim()}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Planla</span>
              </button>
            </div>
          </form>

          {/* Quick presets */}
          <div className="ai-presets-row">
            <span className="ai-presets-label">Populyar istəklər:</span>
            <div className="ai-presets-chips">
              {PRESET_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className="ai-preset-chip"
                  onClick={() => handlePresetClick(p)}
                  disabled={loading}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="ai-concierge-alert-error">
            <HelpCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Generative Loading State */}
        {loading && (
          <div className="ai-loading-stepper-box">
            <div className="ai-pulsing-circle">
              <Sparkles size={28} className="ai-pulsing-icon" />
            </div>
            <div className="ai-stepper-text">
              <h4>Süni İntellekt Səyahət Planınızı Hazırlayır</h4>
              <p>
                {loadingStep === 1 && 'Təbii dildə sorğunuz analiz edilir (sərnişinlər, büdcə, maraqlar)...'}
                {loadingStep === 2 && 'Bazada olan lisenziyalı turlar və otellər üzrə qiymətlər uzlaşdırılır...'}
                {loadingStep === 3 && 'Sizin üçün ən uyğun 3 fərdi paket formalaşdırılır...'}
              </p>
            </div>
          </div>
        )}

        {/* Results Area */}
        {result && !loading && (
          <div className="ai-results-content">
            {/* Parsed Meta Pills & Personalized Advice Card */}
            <div className="ai-advice-card">
              <div className="ai-advice-header">
                <div className="ai-bot-circle">
                  <Bot size={20} />
                </div>
                <div className="ai-advice-title-wrap">
                  <h4>AI Səyahət Ekspertinin Məsləhəti</h4>
                  <div className="ai-criteria-tags">
                    <span className="ai-tag">👥 {result.criteria.pax} Nəfər ({result.criteria.groupType})</span>
                    {result.criteria.maxBudget && (
                      <span className="ai-tag">💰 Maks: {result.criteria.maxBudget} AZN</span>
                    )}
                    {result.criteria.destinations.length > 0 && (
                      <span className="ai-tag">📍 {result.criteria.destinations.join(', ')}</span>
                    )}
                    {result.criteria.tags.length > 0 && (
                      <span className="ai-tag">🏷️ {result.criteria.tags.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="ai-advice-body-text">{result.advice}</p>
            </div>

            {/* 3 Curated Packages Grid */}
            <h3 className="ai-packages-heading">Sizin Üçün Seçilmiş 3 Tam Paket</h3>
            <div className="ai-packages-grid">
              {result.packages.map((pkg, idx) => (
                <div key={idx} className={`ai-package-card card-rank-${idx}`}>
                  {/* Badge */}
                  <div className="ai-pkg-badge-header">
                    <span>{pkg.badge}</span>
                  </div>

                  <div className="ai-pkg-body">
                    <h4 className="ai-pkg-title">{pkg.tour.title}</h4>
                    <p className="ai-pkg-tagline">{pkg.tagline}</p>

                    {/* Operator info */}
                    <div className="ai-pkg-operator-row">
                      <span className="ai-pkg-company">{pkg.tour.companyName}</span>
                      <div className="ai-pkg-rating">
                        <Star size={13} fill="#f59e0b" color="#f59e0b" />
                        <span>{(pkg.tour.rating || 5.0).toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Price Breakdown */}
                    <div className="ai-pkg-price-row">
                      <div>
                        <span className="ai-price-label">Adambaşı:</span>
                        <strong className="ai-price-per-person">{pkg.tour.price} AZN</strong>
                      </div>
                      <div className="ai-price-total-box">
                        <span className="ai-price-total-label">Cəmi ({result.criteria.pax} nəfər):</span>
                        <strong className="ai-price-total">{pkg.tour.estTotalPrice} AZN</strong>
                      </div>
                    </div>

                    {/* Highlights List */}
                    <div className="ai-pkg-highlights">
                      {pkg.highlights.map((h, hIdx) => (
                        <div key={hIdx} className="ai-highlight-item">
                          <Check size={14} color="#10b981" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      className="ai-btn-book-package"
                      onClick={() => handleSelectPackage(pkg.tour.id, result.criteria.pax)}
                    >
                      <span>Tura Bax və Bron Et</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
