import React, { useEffect, useState } from 'react';
import { Button, Badge } from '@toursales/ui';
import { FileText, HelpCircle, Image, Plus, Trash2 } from 'lucide-react';
import { DataTable } from '../../../../shared/components/DataTable/DataTable';
import { cmsManageApi } from '../../cmsManageApi';
import { BlogPost, FAQItem, Ad } from '@toursales/types';
import './CmsManagePage.css';

export const CmsManagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'blogs' | 'faqs' | 'banners'>('blogs');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [banners, setBanners] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [blogData, faqData, bannerData] = await Promise.all([
        cmsManageApi.getBlogs(),
        cmsManageApi.getFaqs(),
        cmsManageApi.getBanners()
      ]);
      setBlogs(blogData);
      setFaqs(faqData);
      setBanners(bannerData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Bu bloq məqaləsini silmək istədiyinizə əminsiniz?')) return;
    try {
      await cmsManageApi.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm('Bu sualı silmək istədiyinizə əminsiniz?')) return;
    try {
      await cmsManageApi.deleteFaq(id);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="cms-page">
      <div className="cms-header">
        <div>
          <h1>CMS & Məzmun İdarəsi</h1>
          <p>Müştəri portalında (apps/web) görünən bloq məqalələri, FAQ sualları və əsas reklam bannerləri</p>
        </div>
      </div>

      <div className="cms-tabs">
        <button
          type="button"
          className={`cms-tab-btn ${activeTab === 'blogs' ? 'active' : ''}`}
          onClick={() => setActiveTab('blogs')}
        >
          Bloq Məqalələri ({blogs.length})
        </button>
        <button
          type="button"
          className={`cms-tab-btn ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          Tez-tez Verilən Suallar ({faqs.length})
        </button>
        <button
          type="button"
          className={`cms-tab-btn ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          Reklam & Vitrin Bannerləri ({banners.length})
        </button>
      </div>

      {activeTab === 'blogs' && (
        <DataTable
          data={blogs}
          searchPlaceholder="Məqalə başlığı ilə axtarın..."
          searchField={(b: BlogPost) => b.title}
          columns={[
            {
              header: 'Məqalə',
              accessor: (b: BlogPost) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={b.coverImage}
                    alt={b.title}
                    style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{b.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>/{b.slug}</div>
                  </div>
                </div>
              )
            },
            {
              header: 'Teqlər',
              accessor: (b: BlogPost) => (
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {b.tags.map((t: string, idx: number) => (
                    <Badge key={idx} variant="neutral" size="sm">{t}</Badge>
                  ))}
                </div>
              )
            },
            {
              header: 'Dərc Tarixi',
              accessor: (b: BlogPost) => new Date(b.publishedAt).toLocaleDateString('az-AZ')
            },
            {
              header: 'Əməliyyat',
              accessor: (b: BlogPost) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteBlog(b.id)}
                  style={{ color: 'var(--color-error)' }}
                >
                  <Trash2 size={14} />
                </Button>
              )
            }
          ]}
        />
      )}

      {activeTab === 'faqs' && (
        <DataTable
          data={faqs}
          searchPlaceholder="Sual mətni ilə axtarın..."
          searchField={(f: FAQItem) => `${f.question} ${f.category || ''}`}
          columns={[
            {
              header: 'Kateqoriya',
              accessor: (f: FAQItem) => <Badge variant="primary">{f.category || 'Ümumi'}</Badge>
            },
            {
              header: 'Sual & Cavab',
              accessor: (f: FAQItem) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{f.question}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{f.answer}</div>
                </div>
              )
            },
            {
              header: 'Əməliyyat',
              accessor: (f: FAQItem) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteFaq(f.id)}
                  style={{ color: 'var(--color-error)' }}
                >
                  <Trash2 size={14} />
                </Button>
              )
            }
          ]}
        />
      )}

      {activeTab === 'banners' && (
        <DataTable
          data={banners}
          searchPlaceholder="Banner adı ilə axtarın..."
          searchField={(bn: Ad) => bn.title}
          columns={[
            {
              header: 'Banner Önizləmə',
              accessor: (bn: Ad) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img
                    src={bn.imageUrl}
                    alt={bn.title}
                    style={{ width: '80px', height: '45px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{bn.title}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{bn.linkUrl || 'Keçid yoxdur'}</div>
                  </div>
                </div>
              )
            },
            {
              header: 'Mövqe',
              accessor: (bn: Ad) => <Badge variant={bn.position === 'HERO' ? 'primary' : 'neutral'}>{bn.position}</Badge>
            },
            {
              header: 'Baxış & Klik',
              accessor: (bn: Ad) => (
                <span>{bn.impressionsCount || 0} baxış / {bn.clicksCount || 0} klik</span>
              )
            },
            {
              header: 'Status',
              accessor: (bn: Ad) => <Badge variant={bn.isActive ? 'success' : 'neutral'}>{bn.isActive ? 'Aktiv' : 'Deaktiv'}</Badge>
            }
          ]}
        />
      )}
    </div>
  );
};
