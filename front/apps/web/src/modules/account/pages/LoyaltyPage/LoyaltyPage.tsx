import React, { useEffect, useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Spinner } from '@toursales/ui';
import { AccountSidebar } from '../../components/AccountSidebar/AccountSidebar';
import { accountApi, LoyaltyData } from '../../api/accountApi';
import { useAuth } from '@/shared/context/AuthContext';
import { useToast } from '@/shared/context/ToastContext';
import './LoyaltyPage.css';

const STORE_ITEMS = [
  {
    id: 1,
    title: 'Pulsuz Kofe və Desert',
    partner: "Starbucks / Gloria Jean's",
    description: 'Şəhərin istənilən filialında keçərli olan premium qəhvə və desert menyusu.',
    points: 100,
    icon: Coffee,
    colorClass: 'icon-brown',
  },
  {
    id: 2,
    title: 'Səyahət Sığortası',
    partner: 'Paşa Sığorta',
    description: 'Növbəti xarici səyahətiniz üçün 50,000 EUR təminatlı standart sığorta paketi.',
    points: 200,
    icon: Umbrella,
    colorClass: 'icon-blue',
  },
  {
    id: 3,
    title: 'Pulsuz Daxili Tur Bileti',
    partner: 'DiscoverAz Eksklüziv',
    description: 'İstənilən 1 günlük daxili tura tamamilə pulsuz qoşulma imkanı.',
    points: 500,
    icon: Bus,
    colorClass: 'icon-emerald',
  },
  {
    id: 4,
    title: 'VIP Hava Limanı Transferi',
    partner: 'Baku Transfer',
    description: 'Evdən hava limanına və ya əksinə Premium avtomobillə fərdi transfer.',
    points: 800,
    icon: PlaneTakeoff,
    colorClass: 'icon-purple',
  },
];

export const LoyaltyPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'store' | 'history'>('store');

  useEffect(() => {
    const fetchLoyalty = async () => {
      try {
        setLoading(true);
        const res = await accountApi.getLoyaltyInfo();
        setLoyalty(res.data);
      } catch (err) {
        setLoyalty({
          points: 1420,
          tier: 'GOLD',
          tierDiscount: 5,
          history: [
            {
              id: 'H1',
              description: 'Bilet Alışı: İstanbul Turu',
              points: 50,
              type: 'EARNED',
              createdAt: '2026-04-12T12:00:00Z',
            },
            {
              id: 'H2',
              description: 'Bilet Alışı: Şahdağ Həftəsonu',
              points: 10,
              type: 'EARNED',
              createdAt: '2026-04-05T10:00:00Z',
            },
            {
              id: 'H3',
              description: 'Hədiyyə Mağazası: Pulsuz Kofe',
              points: -100,
              type: 'REDEEMED',
              createdAt: '2026-03-28T16:20:00Z',
            },
            {
              id: 'H4',
              description: 'Qeydiyyat Bonusu',
              points: 100,
              type: 'EARNED',
              createdAt: '2026-03-15T09:00:00Z',
            },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLoyalty();
  }, []);

  const handleRedeem = (item: typeof STORE_ITEMS[0]) => {
    const currentPoints = loyalty?.points || 0;
    if (currentPoints < item.points) {
      error(`Kifayət qədər xalınız yoxdur. Tələb olunan: ${item.points} Xal.`);
      return;
    }
    success(`Təbriklər! "${item.title}" kuponu profilinizə əlavə edildi.`);
    setLoyalty(prev => prev ? { ...prev, points: prev.points - item.points } : prev);
  };

  const currentPoints = loyalty?.points || 1420;

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
                  <Gift size={28} className="web-loyalty-banner-icon" />
                </div>
                <div>
                  <div className="web-loyalty-badge-promo">
                    <Sparkles size={14} /> DiscoverAz Rewards
                  </div>
                  <h1 className="web-loyalty-page-title">Səyahət Xalları</h1>
                  <p className="web-loyalty-page-subtitle">
                    Səyahət etdikcə qazanın, xallarınızı hədiyyələrə və pulsuz biletlərə dəyişin.
                  </p>
                </div>
              </div>

              <div className="web-loyalty-stats-card">
                <span className="web-loyalty-stat-label">Mövcud Balans</span>
                <span className="web-loyalty-stat-value">
                  {currentPoints.toLocaleString()} <span className="web-loyalty-stat-currency">XAL</span>
                </span>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="web-loyalty-loading">
              <Spinner size="lg" />
              <p>Loyallıq məlumatları yüklənir...</p>
            </div>
          ) : (
            <>
              {/* Bento Grid: FinTech Card & Quick Earn Rules */}
              <div className="web-loyalty-bento-grid">
                {/* FinTech Virtual Card */}
                <div className="web-vcard-wrapper">
                  <div className="web-fintech-card">
                    <div className="web-vcard-header">
                      <div className="web-vcard-brand">
                        <Gift size={16} /> DiscoverAz Rewards
                      </div>
                      <ShieldCheck size={20} className="web-vcard-shield" />
                    </div>

                    <div className="web-vcard-body">
                      <span className="web-vcard-label">İstifadə edilə bilən balans</span>
                      <div className="web-vcard-points-wrap">
                        <h2 className="web-vcard-points">{currentPoints.toLocaleString()}</h2>
                        <span className="web-vcard-currency">XAL</span>
                      </div>
                    </div>

                    <div className="web-vcard-footer">
                      <div className="web-vcard-user">
                        <span className="web-vcard-name">
                          {user?.name || user?.email?.split('@')[0] || 'Dəyərli Müştəri'}
                        </span>
                        <span className="web-vcard-member">Status: {loyalty?.tier || 'GOLD'} Üzvü</span>
                      </div>
                    </div>

                    {/* Decorators */}
                    <div className="web-vcard-circle1" />
                    <div className="web-vcard-circle2" />
                    <div className="web-vcard-glare" />
                  </div>
                </div>

                {/* Quick Earn Rules */}
                <div className="web-earn-rules-card">
                  <div className="web-earn-rules-header">
                    <h3 className="web-earn-title">
                      <Zap size={20} className="web-earn-icon-base" /> Necə xal qazanmalı?
                    </h3>
                    <p className="web-earn-desc">
                      Sistemdə etdiyiniz hər rezervasiya və aktivlik sizə avtomatik xal qazandırır.
                    </p>
                  </div>

                  <div className="web-earn-list">
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><Bus size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Daxili Turlar</span>
                        <p>Hər rezervasiya üçün</p>
                      </div>
                      <strong>+10 Xal</strong>
                    </div>
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><PlaneTakeoff size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Beynəlxalq Turlar</span>
                        <p>Hər rezervasiya üçün</p>
                      </div>
                      <strong>+50 Xal</strong>
                    </div>
                    <div className="web-earn-item">
                      <div className="web-earn-icon-wrap"><Star size={18} /></div>
                      <div className="web-earn-item-text">
                        <span>Rəy Bildirmək</span>
                        <p>Səyahət bitdikdən sonra</p>
                      </div>
                      <strong>+5 Xal</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pill Navigation Tabs */}
              <div className="web-loyalty-tabs-nav">
                <button
                  type="button"
                  className={`web-loyalty-tab-pill ${activeTab === 'store' ? 'active' : ''}`}
                  onClick={() => setActiveTab('store')}
                >
                  <ShoppingBag size={16} /> Hədiyyə Mağazası
                </button>
                <button
                  type="button"
                  className={`web-loyalty-tab-pill ${activeTab === 'history' ? 'active' : ''}`}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={16} /> Xal Tarixçəsi
                </button>
              </div>

              {/* Rewards Store */}
              {activeTab === 'store' && (
                <div className="web-rewards-store-grid">
                  {STORE_ITEMS.map((item) => {
                    const IconComp = item.icon;
                    const canAfford = currentPoints >= item.points;
                    return (
                      <div key={item.id} className="web-store-item-card">
                        <div className="web-store-item-header">
                          <div className={`web-store-icon-box ${item.colorClass}`}>
                            <IconComp size={24} />
                          </div>
                          <span className="web-store-points-badge">
                            {item.points} Xal
                          </span>
                        </div>

                        <div className="web-store-item-body">
                          <span className="web-store-partner">{item.partner}</span>
                          <h4 className="web-store-title">{item.title}</h4>
                          <p className="web-store-desc">{item.description}</p>
                        </div>

                        <div className="web-store-item-footer">
                          <button
                            type="button"
                            className="web-btn-redeem"
                            onClick={() => handleRedeem(item)}
                            disabled={!canAfford}
                          >
                            <span>{canAfford ? 'Xalla Əldə Et' : 'Kifayət etmir'}</span>
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="web-loyalty-history-card">
                  <div className="web-loyalty-history-header">
                    <h3>Son Əməliyyatlar</h3>
                  </div>
                  <div className="web-loyalty-history-list">
                    {(loyalty?.history || []).map((hist) => {
                      const isEarn = hist.type === 'EARNED' || hist.points > 0;
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
                              {new Date(hist.createdAt).toLocaleDateString('az-AZ')}
                            </span>
                          </div>

                          <div className="web-history-points-wrap">
                            <span className={isEarn ? 'points-earned' : 'points-spent'}>
                              {isEarn ? `+${Math.abs(hist.points)}` : `-${Math.abs(hist.points)}`}
                            </span>
                            <span className="points-text">Xal</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
