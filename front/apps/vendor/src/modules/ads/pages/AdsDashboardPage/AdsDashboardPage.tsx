import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@toursales/ui';
import { Megaphone, Ticket, Search, Zap, Layers, Sparkles } from 'lucide-react';
import { Ad, AdPackage, CampaignPromo, VendorAdsKPI } from '@toursales/types';
import { vendorAdsApi } from '../../vendorAdsApi';
import { vendorFinanceApi } from '../../../finance/vendorFinanceApi';
import { AdsKpiCards } from '../../components/AdsKpiCards/AdsKpiCards';
import { AdsTable } from '../../components/AdsTable/AdsTable';
import { PromoCodesTable } from '../../components/PromoCodesTable/PromoCodesTable';
import { AdPackagesGrid } from '../../components/AdPackagesGrid/AdPackagesGrid';
import { CreateAdModal } from '../../components/CreateAdModal/CreateAdModal';
import { CreatePromoModal } from '../../components/CreatePromoModal/CreatePromoModal';
import './AdsDashboardPage.css';

type AdsTab = 'ADS' | 'PROMOS' | 'PACKAGES';

export const AdsDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdsTab>('ADS');
  const [loading, setLoading] = useState(true);

  // Data states
  const [ads, setAds] = useState<Ad[]>([]);
  const [promos, setPromos] = useState<CampaignPromo[]>([]);
  const [packages, setPackages] = useState<AdPackage[]>([]);
  const [kpi, setKpi] = useState<VendorAdsKPI['summary'] | undefined>(undefined);
  const [availableBalance, setAvailableBalance] = useState<number>(0);

  // Modals state
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [preselectedPackageId, setPreselectedPackageId] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');

  const loadData = async () => {
    try {
      setLoading(true);
      const [adsData, promosData, packagesData, kpiData, financeData] = await Promise.all([
        vendorAdsApi.getAds(),
        vendorAdsApi.getPromoCodes(),
        vendorAdsApi.getPackages(),
        vendorAdsApi.getKPI(),
        vendorFinanceApi.getBalance().catch(() => ({ availableBalance: 0 }))
      ]);

      setAds(adsData);
      setPromos(promosData);
      setPackages(packagesData);
      setKpi(kpiData?.summary);
      setAvailableBalance(Number(financeData?.availableBalance || 0));
    } catch (err) {
      console.error('Reklam məlumatlarının yüklənməsində xəta:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Ads
  const filteredAds = useMemo(() => {
    return ads.filter((ad) => {
      // Search
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        ad.title?.toLowerCase().includes(searchLower) ||
        ad.tour?.title?.toLowerCase().includes(searchLower);

      // Status
      const matchStatus = statusFilter === 'ALL' || ad.status === statusFilter;

      // Position
      const matchPosition = positionFilter === 'ALL' || ad.position === positionFilter;

      return matchSearch && matchStatus && matchPosition;
    });
  }, [ads, searchQuery, statusFilter, positionFilter]);

  // Filtered Promos
  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        p.promoCode?.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower);

      const isExpired = new Date(p.endDate) < new Date() || p.status === 'Expired';
      const effectiveStatus = isExpired ? 'Expired' : 'Active';
      const matchStatus = statusFilter === 'ALL' || effectiveStatus === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [promos, searchQuery, statusFilter]);

  // Handlers
  const handleToggleAdStatus = async (id: string) => {
    try {
      await vendorAdsApi.toggleStatus(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Status dəyişdirilərkən xəta baş verdi');
    }
  };

  const handleDeleteAd = async (id: string) => {
    try {
      await vendorAdsApi.deleteAd(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Reklam silinərkən xəta baş verdi');
    }
  };

  const handleDeletePromo = async (id: string) => {
    try {
      await vendorAdsApi.deletePromoCode(id);
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.msg || err?.message || 'Promokod silinərkən xəta baş verdi');
    }
  };

  const handleSelectPackageFromGrid = (pkg: AdPackage) => {
    setPreselectedPackageId(pkg.id);
    setIsAdModalOpen(true);
  };

  const openCreateAdModal = () => {
    setPreselectedPackageId(null);
    setIsAdModalOpen(true);
  };

  return (
    <div className="ads-dashboard-page">
      {/* Header */}
      <div className="ads-header">
        <div>
          <h1>Reklam & Tanıtım Kampaniyaları</h1>
          <p>Turlarınızı vitrinə qaldırın, xüsusi kuponlar yaradın və satışlarınızı qat-qat artırın</p>
        </div>

        <div className="ads-header-actions">
          <Button
            variant="outline"
            onClick={() => setIsPromoModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Ticket size={16} />
            <span>+ Yeni Promokod</span>
          </Button>

          <Button
            variant="primary"
            onClick={openCreateAdModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Zap size={16} />
            <span>+ Yeni Reklam Başlat</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <AdsKpiCards kpi={kpi} loading={loading} />

      {/* Nav Tabs */}
      <div className="ads-nav-tabs">
        <button
          type="button"
          className={`ads-nav-tab ${activeTab === 'ADS' ? 'active' : ''}`}
          onClick={() => setActiveTab('ADS')}
        >
          <Megaphone size={16} />
          <span>Sponsorlu Turlar & Vitrinlər</span>
          <span className="ads-tab-badge">{ads.length}</span>
        </button>

        <button
          type="button"
          className={`ads-nav-tab ${activeTab === 'PROMOS' ? 'active' : ''}`}
          onClick={() => setActiveTab('PROMOS')}
        >
          <Ticket size={16} />
          <span>Endirim Promokodları & Kuponlar</span>
          <span className="ads-tab-badge">{promos.length}</span>
        </button>

        <button
          type="button"
          className={`ads-nav-tab ${activeTab === 'PACKAGES' ? 'active' : ''}`}
          onClick={() => setActiveTab('PACKAGES')}
        >
          <Sparkles size={16} />
          <span>VIP Reklam Paketləri</span>
          <span className="ads-tab-badge">{packages.length}</span>
        </button>
      </div>

      {/* Filters (only on ADS and PROMOS tabs) */}
      {activeTab !== 'PACKAGES' && (
        <div className="ads-filters-bar">
          <div className="ads-search-box">
            <Search size={16} className="ads-search-icon" />
            <input
              type="text"
              className="ads-search-input"
              placeholder={
                activeTab === 'ADS'
                  ? 'Reklam və ya tur adı ilə axtarış...'
                  : 'Promokod və ya təsvir ilə axtarış...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="ads-filter-dropdowns">
            <select
              className="ads-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Bütün Statuslar</option>
              <option value="Active">Aktiv</option>
              <option value="Paused">Dayandırılıb</option>
              <option value="Expired">Müddəti bitib</option>
            </select>

            {activeTab === 'ADS' && (
              <select
                className="ads-filter-select"
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
              >
                <option value="ALL">Bütün Mövqelər</option>
                <option value="HERO">Ana Səhifə Hero</option>
                <option value="VIP_LIST">VIP Vitrin</option>
                <option value="SIDEBAR">Yan Panel</option>
                <option value="POPUP">Xüsusi Popup</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'ADS' && (
        <AdsTable
          ads={filteredAds}
          loading={loading}
          onToggleStatus={handleToggleAdStatus}
          onDelete={handleDeleteAd}
        />
      )}

      {activeTab === 'PROMOS' && (
        <PromoCodesTable
          promos={filteredPromos}
          loading={loading}
          onDelete={handleDeletePromo}
        />
      )}

      {activeTab === 'PACKAGES' && (
        <AdPackagesGrid
          packages={packages}
          loading={loading}
          onSelectPackage={handleSelectPackageFromGrid}
        />
      )}

      {/* Modals */}
      <CreateAdModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onSuccess={loadData}
        packages={packages}
        preselectedPackageId={preselectedPackageId}
        availableBalance={availableBalance}
      />

      <CreatePromoModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
