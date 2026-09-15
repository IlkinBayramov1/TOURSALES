import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Gift, 
  Coffee, 
  Umbrella, 
  Bus, 
  PlaneTakeoff, 
  History, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShoppingBag, 
  Zap,
  Sparkles,
  Award,
  Copy,
  Check,
  X,
  LogIn,
  Compass,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { loyaltyApi } from '../../api/loyaltyApi';
import { LoyaltyOffer, LoyaltyOverview, RedeemResult, LoyaltyHistoryItem } from '@toursales/types';
import { useAuth } from '@/shared/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import './LoyaltyPage.css';

export const LoyaltyPage: React.FC = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [offers, setOffers] = useState<LoyaltyOffer[]>([]);
  const [overview, setOverview] = useState<LoyaltyOverview>({
    points: 0,
    tier: 'BRONZE',
    tierDiscount: 0,
    history: []
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store' | 'history'>('store');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals
  const [redeemedVoucher, setRedeemedVoucher] = useState<RedeemResult | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<boolean>(false);
  const [guestModalOpen, setGuestModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersData, overviewData] = await Promise.all([
        loyaltyApi.getOffers().catch(() => []),
        isAuthenticated ? loyaltyApi.getOverview().catch(() => null) : Promise.resolve(null)
      ]);

      setOffers(offersData);
      if (overviewData) {
        setOverview(overviewData);
      } else {
        setOverview({
          points: user?.loyaltyPoints || 0,
          tier: 'BRONZE',
          tierDiscount: 0,
          history: []
        });
      }
    } catch (err) {
      console.error('Error loading loyalty data:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPoints = isAuthenticated ? (overview.points ?? user?.loyaltyPoints ?? 0) : 0;

  const getTierDetails = (points: number) => {
    if (points >= 3000) {
      return {
        currentTier: 'PLATINUM',
        label: 'VIP Platinum',
        colorClass: 'tier-platinum',
        discount: 10,
        nextTier: null,
        neededPoints: 0,
        progress: 100,
        badgeColor: '#c084fc',
        gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)',
      };
    }
    if (points >= 1500) {
      const diff = 3000 - points;
      const progress = Math.min(100, Math.round(((points - 1500) / 1500) * 100));
      return {
        currentTier: 'GOLD',
        label: 'Gold Üzv',
        colorClass: 'tier-gold',
        discount: 5,
        nextTier: 'Platinum',
        neededPoints: diff,
        progress,
        badgeColor: '#f59e0b',
        gradient: 'linear-gradient(135deg, #2a1e0b 0%, #453310 40%, #1c1404 100%)',
      };
    }
    if (points >= 500) {
      const diff = 1500 - points;
      const progress = Math.min(100, Math.round(((points - 500) / 1000) * 100));
      return {
        currentTier: 'SILVER',
        label: 'Silver Üzv',
        colorClass: 'tier-silver',
        discount: 3,
        nextTier: 'Gold',
        neededPoints: diff,
        progress,
        badgeColor: '#94a3b8',
        gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 40%, #0f172a 100%)',
      };
    }
    const diff = 500 - points;
    const progress = Math.min(100, Math.round((points / 500) * 100));
    return {
      currentTier: 'BRONZE',
      label: 'Bronze Üzv',
      colorClass: 'tier-bronze',
      discount: 0,
      nextTier: 'Silver',
      neededPoints: diff,
      progress,
      badgeColor: '#d97706',
      gradient: 'linear-gradient(135deg, #24160d 0%, #3d2b1f 40%, #17110e 100%)',
    };
  };

  const tierInfo = getTierDetails(currentPoints);

  const getCategoryIcon = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'FOOD':
        return Coffee;
      case 'SERVICE':
        return ShieldCheck;
      case 'TRANSPORT':
        return Bus;
      case 'TRAVEL':
        return Compass;
      default:
        return Gift;
    }
  };

  const getCategoryColorClass = (category: string) => {
    switch (category?.toUpperCase()) {
      case 'FOOD':
        return 'icon-brown';
      case 'SERVICE':
        return 'icon-blue';
      case 'TRANSPORT':
        return 'icon-purple';
      case 'TRAVEL':
        return 'icon-emerald';
      default:
        return 'icon-amber';
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (selectedCategory === 'ALL') return true;
    return offer.category?.toUpperCase() === selectedCategory;
  });

  const handleRedeemClick = async (offer: LoyaltyOffer) => {
    if (!isAuthenticated) {
      setGuestModalOpen(true);
      return;
    }

    if (currentPoints < offer.requiredPoints) {
      toastError(`Kifayət qədər xalınız yoxdur. Tələb olunan: ${offer.requiredPoints} Xal, Sizdə olan: ${currentPoints} Xal.`);
      return;
    }

    try {
      setRedeemingId(offer.id);
      const result = await loyaltyApi.redeemOffer(offer.id);
      
      // Update local state atomically
      setOverview(prev => ({
        ...prev,
        points: result.remainingPoints,
        history: [
          {
            id: result.id,
            points: result.pointsSpent,
            description: `${result.partnerName} - ${result.offerName} kuponu əldə edildi (${result.voucherCode})`,
            type: 'SPENT',
            date: result.createdAt || new Date().toISOString()
          },
          ...prev.history
        ]
      }));

      // Update global user state (so Navbar updates)
      if (refreshUser) {
        refreshUser().catch(() => {});
      }

      setRedeemedVoucher(result);
      success(`Təbriklər! "${offer.offerName}" vauçeri uğurla əldə edildi!`);
    } catch (err: any) {
      const msg = err.response?.data?.msg || err.response?.data?.message || 'Xal dəyişdirilməsi zamanı xəta baş verdi.';
      toastError(msg);
    } finally {
      setRedeemingId(null);
    }
  };

  const handleCopyVoucher = () => {
    if (!redeemedVoucher) return;
    navigator.clipboard.writeText(redeemedVoucher.voucherCode);
    setCopiedVoucher(true);
    setTimeout(() => setCopiedVoucher(false), 2500);
  };

  return (
    <div className="web-account-layout-container">
      <div className="web-account-grid">
        <aside className="web-account-sidebar-col">
          <AccountSidebar />
        </aside>

        <main className="web-account-main-col">
          {/* Header Banner */}
          <header className="web-loyalty-collection-banner">
            <div className="web-loyalty-banner-overlay" />
            <div className="web-loyalty-banner-content">
              <div className="web-loyalty-title-wrapper">
                <div className="web-loyalty-icon-pulse-wrap">
                  <Gift size={32} className="web-loyalty-banner-icon" />
                </div>
                <div>
                  <div className="web-loyalty-badge-promo">
                    <Sparkles size={14} /> TOURSALES Rewards & VIP Club
                  </div>
                  <h1 className="web-loyalty-page-title">Səyahət Xalları & Hədiyyələr</h1>
                  <p className="web-loyalty-page-subtitle">
                    Hər rezervasiyada xal qazanın, xallarınızı partnyor endirimlərinə, hədiyyə vauçerlərinə və pulsuz biletlərə dəyişin.
                  </p>
                </div>
              </div>

              <div className="web-loyalty-stats-card">
                <span className="web-loyalty-stat-label">Mövcud Balansınız</span>
                <span className="web-loyalty-stat-value">
                  {currentPoints.toLocaleString()} <span className="web-loyalty-stat-currency">XAL</span>
                </span>
                {isAuthenticated && (
                  <span className="web-loyalty-stat-tier-tag" style={{ color: tierInfo.badgeColor }}>
                    <Award size={12} /> {tierInfo.label}
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Guest Welcome Banner */}
          {!isAuthenticated && (
            <div className="web-loyalty-guest-banner">
              <div className="web-loyalty-guest-info">
                <div className="web-loyalty-guest-icon-box">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h4 className="web-loyalty-guest-title">Qeydiyyatdan keçin və dərhal 100 Xoş Gəldin Xalı qazanın!</h4>
                  <p className="web-loyalty-guest-desc">
                    İstifadəçi profilinizlə bütün hədiyyələrdən faydalana, rezervasiyalarınızdan bonus toplaya və xüsusi VIP endirimlər əldə edə bilərsiniz.
                  </p>
                </div>
              </div>
              <Link to="/login" className="web-loyalty-guest-btn">
                <LogIn size={16} /> Daxil Ol / Qeydiyyat
              </Link>
            </div>
          )}

          {loading ? (
            <div className="web-loyalty-loading">
              <Spinner size="lg" />
              <p>Məlumatlar yüklənir...</p>
            </div>
          ) : (
            <>
              {/* Bento Grid: FinTech Card & Quick Earn Rules */}
              <div className="web-loyalty-bento-grid">
                {/* FinTech Virtual Card */}
                <div className="web-vcard-wrapper">
                  <div className="web-fintech-card" style={{ background: tierInfo.gradient }}>
                    <div className="web-vcard-header">
                      <div className="web-vcard-brand">
                        <Gift size={16} /> TOURSALES Rewards
                      </div>
                      <div className="web-vcard-tier-chip" style={{ borderColor: tierInfo.badgeColor, color: tierInfo.badgeColor }}>
                        <Award size={14} /> {tierInfo.label}
                      </div>
                    </div>

                    <div className="web-vcard-body">
                      <span className="web-vcard-label">İstifadə edilə bilən balans</span>
                      <div className="web-vcard-points-wrap">
                        <h2 className="web-vcard-points">{currentPoints.toLocaleString()}</h2>
                        <span className="web-vcard-currency">XAL</span>
                      </div>

                      {/* Tier Progress Bar */}
                      <div className="web-vcard-progress-container">
                        <div className="web-vcard-progress-labels">
                          <span>Status: {tierInfo.currentTier}</span>
                          <span>{tierInfo.nextTier ? `${tierInfo.nextTier} üçün ${tierInfo.neededPoints} xal` : 'Maksimum Səviyyə'}</span>
                        </div>
                        <div className="web-vcard-progress-track">
                          <div 
                            className="web-vcard-progress-fill" 
                            style={{ width: `${tierInfo.progress}%`, backgroundColor: tierInfo.badgeColor }} 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="web-vcard-footer">
                      <div className="web-vcard-user">
                        <span className="web-vcard-name">
                          {isAuthenticated ? (user?.name || user?.email?.split('@')[0]) : 'Qonaq İstifadəçi'}
                        </span>
                        <span className="web-vcard-member">
                          {tierInfo.discount > 0 ? `Bütün turlara ${tierInfo.discount}% VIP Endirim` : 'Standart Üzvlük'}
                        </span>
                      </div>
                    </div>

                    {/* Ambient Glow Decorators */}
                    <div className="web-vcard-circle1" />
                    <div className="web-vcard-circle2" />
                    <div className="web-vcard-glare" />
                  </div>
                </div>

                {/* Quick Earn Rules */}
                <div className="web-earn-rules-card">
                  <div className="web-earn-rules-header">
                    <h3 className="web-earn-title">
                      <Zap size={20} className="web-earn-icon-base" /> Necə Xal Qazanmalı?
                    </h3>
                    <p className="web-earn-desc">
                      Sistemdə etdiyiniz hər rezervasiya və aktivlik sizə avtomatik xal qazandırır.
                    </p>
                  </div>

                  <div className="web-earn-list">
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><Sparkles size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Xoş Gəldin Bonusu</span>
                        <p>İlk dəfə qeydiyyatdan keçdikdə</p>
                      </div>
                      <strong>+100 Xal</strong>
                    </div>
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><Bus size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Daxili Turlar</span>
                        <p>Hər daxili tur sifarişi üçün</p>
                      </div>
                      <strong>+10 Xal</strong>
                    </div>
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><PlaneTakeoff size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Beynəlxalq Turlar</span>
                        <p>Hər xarici tur sifarişi üçün</p>
                      </div>
                      <strong>+50 Xal</strong>
                    </div>
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><Star size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Təsdiqlənmiş Rəy</span>
                        <p>Tur bitdikdən sonra təcrübənizi bölüşün</p>
                      </div>
                      <strong>+5 Xal</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="web-loyalty-tabs-nav">
                <button
                  type="button"
                  className={`web-loyalty-tab-pill ${activeTab === 'store' ? 'active' : ''}`}
                  onClick={() => setActiveTab('store')}
                >
                  <ShoppingBag size={16} /> Hədiyyə & Vauçer Kataloqu ({offers.length})
                </button>
                <button
                  type="button"
                  className={`web-loyalty-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={16} /> Xal Əməliyyatları Tarixçəsi ({overview.history?.length || 0})
                </button>
              </div>

              {/* Rewards Store Tab */}
              {activeTab === 'store' && (
                <div className="web-loyalty-store-section">
                  {/* Category Filter Pills */}
                  <div className="web-loyalty-cat-filter">
                    {[
                      { key: 'ALL', label: 'Hamısı' },
                      { key: 'SERVICE', label: 'Sığorta və Xidmət' },
                      { key: 'FOOD', label: 'Qida və Kafe' },
                      { key: 'TRAVEL', label: 'Turlar və Otellər' },
                      { key: 'TRANSPORT', label: 'Transfer və Nəqliyyat' }
                    ].map(cat => (
                      <button
                        key={cat.key}
                        type="button"
                        className={`web-loyalty-cat-btn ${selectedCategory === cat.key ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.key)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {filteredOffers.length === 0 ? (
                    <div className="web-loyalty-empty-state">
                      <ShoppingBag size={48} className="web-empty-icon" />
                      <h4>Bu kateqoriyada aktiv təklif tapılmadı</h4>
                      <p>Zəhmət olmasa digər kateqoriyaları yoxlayın və ya tezliklə yenidən baxın.</p>
                    </div>
                  ) : (
                    <div className="web-rewards-store-grid">
                      {filteredOffers.map((item) => {
                        const IconComp = getCategoryIcon(item.category);
                        const colorClass = getCategoryColorClass(item.category);
                        const canAfford = isAuthenticated && currentPoints >= item.requiredPoints;
                        const isRedeeming = redeemingId === item.id;

                        return (
                          <div key={item.id} className="web-store-item-card">
                            <div className="web-store-item-header">
                              <div className={`web-store-icon-box ${colorClass}`}>
                                <IconComp size={24} />
                              </div>
                              <span className="web-store-points-badge">
                                {item.requiredPoints} Xal
                              </span>
                            </div>

                            <div className="web-store-item-body">
                              <span className="web-store-partner">{item.partnerName}</span>
                              <h4 className="web-store-title">{item.offerName}</h4>
                              <p className="web-store-desc">{item.description}</p>
                            </div>

                            <div className="web-store-item-footer">
                              <button
                                type="button"
                                className={`web-btn-redeem ${canAfford ? 'can-afford' : ''}`}
                                onClick={() => handleRedeemClick(item)}
                                disabled={isRedeeming}
                              >
                                {isRedeeming ? (
                                  <>
                                    <Spinner size="sm" />
                                    <span>Gözləyin...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>
                                      {!isAuthenticated 
                                        ? 'Xalla Əldə Et' 
                                        : canAfford 
                                          ? 'Xalla Əldə Et' 
                                          : `Daha ${item.requiredPoints - currentPoints} xal lazımdır`}
                                    </span>
                                    <ArrowRight size={16} />
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="web-loyalty-history-card">
                  <div className="web-loyalty-history-header">
                    <h3>Xal Əməliyyatlarınız</h3>
                    <span className="web-loyalty-history-badge">Ümumi: {overview.history?.length || 0} qeyd</span>
                  </div>

                  {!isAuthenticated ? (
                    <div className="web-loyalty-empty-state">
                      <LogIn size={40} className="web-empty-icon" />
                      <h4>Tarixçənizi görmək üçün daxil olun</h4>
                      <p>Siz qonaq rejimindəsiniz. Hesabınıza daxil olaraq bütün xal hərəkətlərinizi izləyə bilərsiniz.</p>
                      <Link to="/login" className="web-loyalty-action-btn">
                        Daxil Ol
                      </Link>
                    </div>
                  ) : (overview.history || []).length === 0 ? (
                    <div className="web-loyalty-empty-state">
                      <History size={40} className="web-empty-icon" />
                      <h4>Hələ ki heç bir xal əməliyyatınız yoxdur</h4>
                      <p>Yeni turlar sifariş edərək və ya rəy yazaraq ilk bonus xallarınızı qazanın!</p>
                    </div>
                  ) : (
                    <div className="web-loyalty-history-list">
                      {overview.history.map((hist: LoyaltyHistoryItem) => {
                        const isEarn = hist.type === 'EARNED' || hist.points > 0;
                        const pointsVal = Math.abs(hist.points);
                        return (
                          <div key={hist.id} className="web-loyalty-history-item">
                            <div className="web-history-icon-wrap">
                              {isEarn ? (
                                <div className="web-icon-earn"><ArrowUpRight size={18} /></div>
                              ) : (
                                <div className="web-icon-spend"><ArrowDownRight size={18} /></div>
                              )}
                            </div>

                            <div className="web-history-details">
                              <h5 className="web-history-action">{hist.description}</h5>
                              <span className="web-history-date">
                                {new Date(hist.date).toLocaleString('az-AZ', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>

                            <div className="web-history-points-wrap">
                              <span className={isEarn ? 'points-earned' : 'points-spent'}>
                                {isEarn ? `+${pointsVal}` : `-${pointsVal}`}
                              </span>
                              <span className="points-text">Xal</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Success Voucher Modal */}
          {redeemedVoucher && (
            <div className="web-modal-overlay" onClick={() => setRedeemedVoucher(null)}>
              <div className="web-modal-container" onClick={e => e.stopPropagation()}>
                <button 
                  className="web-modal-close" 
                  onClick={() => setRedeemedVoucher(null)}
                  type="button"
                >
                  <X size={20} />
                </button>

                <div className="web-voucher-modal-content">
                  <div className="web-voucher-icon-badge">
                    <Sparkles size={32} />
                  </div>

                  <span className="web-voucher-congrats">Təbriklər! Kuponunuz Hazırdır</span>
                  <h3 className="web-voucher-title">{redeemedVoucher.offerName}</h3>
                  <span className="web-voucher-partner">{redeemedVoucher.partnerName}</span>

                  <div className="web-voucher-code-box">
                    <span className="web-voucher-code-label">Tərəfdaşa təqdim ediləcək unikal vauçer kodu:</span>
                    <div className="web-voucher-code-row">
                      <span className="web-voucher-code-text">{redeemedVoucher.voucherCode}</span>
                      <button 
                        type="button" 
                        className={`web-voucher-copy-btn ${copiedVoucher ? 'copied' : ''}`}
                        onClick={handleCopyVoucher}
                      >
                        {copiedVoucher ? (
                          <>
                            <Check size={16} /> Kopyalandı
                          </>
                        ) : (
                          <>
                            <Copy size={16} /> Kodu Kopyala
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="web-voucher-stats">
                    <div className="web-voucher-stat-item">
                      <span>Xərclənən Xal:</span>
                      <strong>-{redeemedVoucher.pointsSpent} Xal</strong>
                    </div>
                    <div className="web-voucher-stat-item">
                      <span>Qalan Balansınız:</span>
                      <strong>{redeemedVoucher.remainingPoints} Xal</strong>
                    </div>
                  </div>

                  <p className="web-voucher-instructions">
                    Bu vauçeri xidmət zamanı tərəfdaşa təqdim edin və ya platformada rezervasiya edərkən promokod yerinə daxil edin.
                  </p>

                  <button 
                    type="button" 
                    className="web-voucher-done-btn"
                    onClick={() => setRedeemedVoucher(null)}
                  >
                    Bağla
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Guest Action Prompt Modal */}
          {guestModalOpen && (
            <div className="web-modal-overlay" onClick={() => setGuestModalOpen(false)}>
              <div className="web-modal-container" onClick={e => e.stopPropagation()}>
                <button 
                  className="web-modal-close" 
                  onClick={() => setGuestModalOpen(false)}
                  type="button"
                >
                  <X size={20} />
                </button>

                <div className="web-voucher-modal-content">
                  <div className="web-voucher-icon-badge guest-mode">
                    <Gift size={32} />
                  </div>

                  <span className="web-voucher-congrats">Daxil Olmaq Tələb Olunur</span>
                  <h3 className="web-voucher-title">Hədiyyə və Vauçerlərdən Faydalanın</h3>
                  <p className="web-voucher-instructions">
                    Xallarınızı xərcləmək və yeni kuponlar əldə etmək üçün zəhmət olmasa sistemə daxil olun. Əgər hesabınız yoxdursa, qeydiyyatdan keçərək dərhal <strong>100 Xoş Gəldin Xalı</strong> qazanacaqsınız!
                  </p>

                  <div className="web-guest-modal-actions">
                    <button 
                      type="button" 
                      className="web-voucher-done-btn"
                      onClick={() => {
                        setGuestModalOpen(false);
                        navigate('/login');
                      }}
                    >
                      <LogIn size={16} /> Daxil Ol / Qeydiyyatdan Keç
                    </button>
                    <button 
                      type="button" 
                      className="web-btn-secondary"
                      onClick={() => setGuestModalOpen(false)}
                    >
                      Davam Et
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default LoyaltyPage;
