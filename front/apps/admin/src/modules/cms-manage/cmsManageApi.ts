import { adminAxiosClient } from '../../shared/api/adminAxiosClient';
import { ADMIN_ENDPOINTS } from '../../shared/api/adminEndpoints';
import { BlogPost, FAQItem, Ad } from '@toursales/types';

export const cmsManageApi = {
  getBlogs: async (): Promise<BlogPost[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.CMS.BLOGS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'blog_1',
          slug: 'susanin-tarixi-ve-abideleri',
          title: 'Şuşanın Tarixi və Mədəni Abidələri',
          summary: 'Qarabağın incisi Şuşa şəhərinin gəzməli-görməli yerləri haqqında bələdçi.',
          content: 'Şuşa qədim tarixi, zəngin mədəniyyəti ilə hər bir azərbaycanlının qəlbində xüsusi yer tutur...',
          coverImage: 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?w=800',
          publishedAt: '2026-08-10T12:00:00Z',
          tags: ['Qarabağ', 'Tarix', 'Şuşa']
        },
        {
          id: 'blog_2',
          slug: 'quba-xinaliq-kend-yolu',
          title: 'Quba Xınalıq Kəndi: Buludların Üzərində Səyahət',
          summary: 'Dünyanın ən qədim yaşayış məskənlərindən biri olan Xınalıq kəndinə unudulmaz tur.',
          content: 'Qafqaz dağlarının əzəmətli zirvələrində yerləşən Xınalıq kəndi...',
          coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
          publishedAt: '2026-08-22T10:00:00Z',
          tags: ['Dağlar', 'Quba', 'Xınalıq']
        }
      ];
    }
  },

  getFaqs: async (): Promise<FAQItem[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.CMS.FAQS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'faq_1',
          question: 'Qarabağ turlarına icazə (portal portal.gov.az) necə alınır?',
          answer: 'Rezervasiya etdiyiniz zaman daxil etdiyiniz Ş/V FİN kodu əsasında turizm agentliyi rəsmi portal icazəsini təmin edir.',
          category: 'İcazələr & Qaydalar'
        },
        {
          id: 'faq_2',
          question: 'Biletləri necə ləğv edib pulumu geri ala bilərəm?',
          answer: 'Turun çıxış vaxtına 48 saatdan çox qalmış ləğv edilən biletlərin məbləği 100% geri qaytarılır.',
          category: 'Ödəniş & Geri Qaytarma'
        }
      ];
    }
  },

  getBanners: async (): Promise<Ad[]> => {
    try {
      const res = await adminAxiosClient.get(ADMIN_ENDPOINTS.CMS.BANNERS);
      return res.data?.data || res.data;
    } catch {
      return [
        {
          id: 'ad_hero_1',
          title: 'Payızda Şuşa və Kəlbəcər Turları',
          imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200',
          linkUrl: '/catalog?region=Qarabağ',
          position: 'HERO',
          isActive: true,
          startDate: '2026-09-01T00:00:00Z',
          endDate: '2026-10-31T23:59:59Z',
          clicksCount: 840,
          impressionsCount: 22000
        }
      ];
    }
  },

  createBlog: async (data: Partial<BlogPost>): Promise<BlogPost> => {
    const res = await adminAxiosClient.post(ADMIN_ENDPOINTS.CMS.BLOGS, data);
    return res.data?.data || res.data;
  },

  deleteBlog: async (id: string): Promise<void> => {
    await adminAxiosClient.delete(ADMIN_ENDPOINTS.CMS.BLOG_DETAIL(id));
  },

  createFaq: async (data: Partial<FAQItem>): Promise<FAQItem> => {
    const res = await adminAxiosClient.post(ADMIN_ENDPOINTS.CMS.FAQS, data);
    return res.data?.data || res.data;
  },

  deleteFaq: async (id: string): Promise<void> => {
    await adminAxiosClient.delete(ADMIN_ENDPOINTS.CMS.FAQ_DETAIL(id));
  }
};
