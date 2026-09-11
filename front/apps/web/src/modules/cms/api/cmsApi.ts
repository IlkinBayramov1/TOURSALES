import { axiosClient } from '../../../shared/api/axiosClient';
import { ApiResponse } from '@toursales/types';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  coverImage: string;
  author: string;
  readTimeMinutes: number;
  tags: string[];
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface LegalPageContent {
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export const cmsApi = {
  getBlogPosts: async (params?: { page?: number; limit?: number; tag?: string }): Promise<ApiResponse<BlogPost[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<BlogPost[]>>('/common/blogs', { params });
      return res.data;
    } catch {
      return {
        success: true,
        data: [
          {
            id: 'b-1',
            slug: 'shusha-qarabag-seyahet-rehberi',
            title: 'Şuşa və Qarabağ Səyahət Bələdçisi: Tarix və Təbiətin Qovuşduğu Məkan',
            summary: 'Cıdır düzü, Yuxarı Gövhər Ağa məscidi və İsa bulağı haqqında ətraflı məlumat və səyahət tövsiyələri.',
            content: `
              <h2>Şuşanın Möhtəşəm Tarixi və Təbii Gözəlliyi</h2>
              <p>Qarabağın incisi sayılan Şuşa şəhəri həm zəngin tarixi, həm də bənzərsiz təbiəti ilə hər bir azərbaycanlının qəlbində xüsusi yer tutur. Zəfər yolunun açılışı ilə Şuşaya səyahət etmək artıq daha rahat və əlçatan olmuşdur.</p>
              <h3>Görməli Olduğunuz Əsas Məkanlar:</h3>
              <ul>
                <li><strong>Cıdır Düzü:</strong> Dərin dərəyə açılan heyrətamiz mənzərəsi ilə məşhur olan tarixi məkan.</li>
                <li><strong>Yuxarı və Aşağı Gövhər Ağa Məscidləri:</strong> İslam memarlığının nadir inciləri.</li>
                <li><strong>Vaqifin Məqbərəsi:</strong> Dahi şair Molla Pənah Vaqifin bərpa olunmuş möhtəşəm türbəsi.</li>
                <li><strong>İsa Bulağı:</strong> Sərin dağ suları və təmiz dağ havası ilə tanınan istirahət ocağı.</li>
              </ul>
              <p>TOURSALES vasitəsilə təşkil olunan turlarda peşəkar bələdçilər sizi bu tarixi abidələrlə yaxından tanış edəcək.</p>
            `,
            coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
            author: 'TOURSALES Ekspert',
            readTimeMinutes: 5,
            tags: ['Qarabağ', 'Şuşa', 'Tarix', 'Bələdçi'],
            createdAt: '2026-03-01T10:00:00Z',
          },
          {
            id: 'b-2',
            slug: 'avtobus-turlarinda-rahat-seyahet-etmeyin-yollari',
            title: 'Avtobus Turlarında Rahat və Zövqlü Səyahət Etməyin 7 Qaydası',
            summary: 'Uzun məsafəli turlarda özünüzü gümrah hiss etmək üçün təcrübəli səyahətçilərdən məsləhətlər.',
            content: `
              <h2>Avtobus Səfərlərini Zövqə Çevirin</h2>
              <p>Avtobus turları yeni yerlər kəşf etməyin ən sosial və büdcəyə uyğun yollarından biridir. Səyahətinizin rahat keçməsi üçün aşağıdakı tövsiyələrimizi nəzərə alın:</p>
              <ol>
                <li><strong>Rahat Geyim Seçin:</strong> Qat-qat və elastik parçalardan ibarət geyimlər uzun yollarda ən yaxşı seçimdir.</li>
                <li><strong>Boyun Yastığı Götürün:</strong> Xüsusilə gecə və ya səhər tezdən olan səfərlərdə boyun yastığı yuxunuzu keyfiyyətli edəcək.</li>
                <li><strong>Su və Yüngül Qəlyanaltı:</strong> Quru meyvələr, çərəzlər və yetərli qədər su götürməyi unutmayın.</li>
                <li><strong>Powerbank:</strong> Yol boyu çəkiliş edəcəyiniz üçün enerji bankı vacibdir.</li>
              </ol>
            `,
            coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
            author: 'Elmir Məmmədov',
            readTimeMinutes: 4,
            tags: ['Məsləhətlər', 'Avtobus', 'Səyahət'],
            createdAt: '2026-02-20T14:30:00Z',
          },
        ],
      };
    }
  },

  getBlogPostBySlug: async (slug: string): Promise<ApiResponse<BlogPost>> => {
    try {
      const res = await axiosClient.get<ApiResponse<BlogPost>>(`/common/blogs/${slug}`);
      return res.data;
    } catch {
      const all = await cmsApi.getBlogPosts();
      const found = all.data.find((b) => b.slug === slug) || all.data[0];
      return { success: true, data: found };
    }
  },

  getFaqs: async (): Promise<ApiResponse<FAQItem[]>> => {
    try {
      const res = await axiosClient.get<ApiResponse<FAQItem[]>>('/common/faqs');
      return res.data;
    } catch {
      return {
        success: true,
        data: [
          {
            id: 'faq-1',
            category: 'Rezervasiya və Biletlər',
            question: 'Bileti necə əldə edə bilərəm?',
            answer: 'Saytımızda istədiyiniz turu seçdikdən sonra avtobusda oturacaq yerinizi interaktiv xəritədən seçib onlayn kartla ödəniş edirsiniz. Dərhal sonra ekranda canlı QR-kodlu rəsmi voucher yaranır və e-poçtunuza göndərilir.',
          },
          {
            id: 'faq-2',
            category: 'Rezervasiya və Biletlər',
            question: 'Avtobusda yerimi dəyişə bilərəmmi?',
            answer: 'Rezervasiya zamanı seçdiyiniz yer sizin adınıza qeydiyyata alınır. Turun çıxışına ən geci 24 saat qalmış müştəri dəstəyi və ya profiliniz vasitəsilə boş yer varsa dəyişiklik edə bilərsiniz.',
          },
          {
            id: 'faq-3',
            category: 'Ödəniş və Təhlükəsizlik',
            question: 'Hansı ödəniş üsullarını qəbul edirsiniz?',
            answer: 'Biz yerli bank kartları (BirBank, Kapital Bank, ABB, LeoBank) və beynəlxalq Visa / MasterCard vasitəsilə 3D Secure təhlükəsizlik protokolu ilə ödənişləri qəbul edirik.',
          },
          {
            id: 'faq-4',
            category: 'Ləğvetmə və Geri Qaytarma',
            question: 'Sifarişi ləğv etsəm pulum necə geri qayıdır?',
            answer: 'Turun başlanmasına 48 saatdan çox müddət qaldıqda sifarişinizi profilinizdən ləğv etdikdə ödəniş tam şəkildə eyni bank kartınıza 3-7 iş günü ərzində geri qaytarılır.',
          },
          {
            id: 'faq-5',
            category: 'Qarabağ Turları',
            question: 'Qarabağ turları üçün xüsusi icazə tələb olunurmu?',
            answer: 'Bəli, işğaldan azad olunmuş ərazilərə səfərlər üçün "Yolumuz Qarabağa" portalı üzərindən icazə tələb olunur. TOURSALES tərəfdaş agentlikləri bu icazələrin qeydiyyatını sərnişinlərin FİN kodlarına əsasən rəsmi qaydada həyata keçirir.',
          },
        ],
      };
    }
  },

  getLegalPage: async (slug: 'terms' | 'privacy'): Promise<ApiResponse<LegalPageContent>> => {
    try {
      const res = await axiosClient.get<ApiResponse<LegalPageContent>>(`/common/pages/${slug}`);
      return res.data;
    } catch {
      return {
        success: true,
        data: {
          slug,
          title: slug === 'terms' ? 'İstifadəçi Şərtləri və Qaydaları' : 'Məxfilik Siyasəti',
          content: slug === 'terms' 
            ? `
              <h3>1. Ümumi Müddəalar</h3>
              <p>TOURSALES platformasından istifadə etməklə siz bu istifadəçi razılaşmasının bütün şərtlərini qəbul etmiş sayılırsınız.</p>
              <h3>2. Bilet Rezervasiyası və Ödənişlər</h3>
              <p>Platforma üzərindən həyata keçirilən bütün sifarişlər bank tərəfindən təsdiqləndikdən sonra rəsmi elektron bilet statusu alır. QR kodun unikal identifikasiyası mövcuddur.</p>
              <h3>3. Təşkilatçı və Sərnişin Məsuliyyəti</h3>
              <p>Turların vaxtında həyata keçirilməsi və nəqliyyat təhlükəsizliyi lisenziyalı turizm şirkətlərinin məsuliyyətindədir.</p>
            `
            : `
              <h3>1. Məlumatların Toplanması</h3>
              <p>Siz qeydiyyatdan keçərkən və ya bilet alarkən ad, soyad, əlaqə nömrəsi, e-poçt və FİN kod kimi zəruri məlumatlar toplanır.</p>
              <h3>2. Məlumatların Təhlükəsizliyi</h3>
              <p>Bütün fərdi məlumatlar müasir SSL/TLS şifrələmə üsulları ilə qorunur və üçüncü tərəflərə ötürülmür.</p>
              <h3>3. Kart Məlumatları</h3>
              <p>Bank kartı məlumatlarınız TOURSALES serverlərində qətiyyən saxlanılmır, birbaşa beynəlxalq ödəniş provayderləri tərəfindən emal edilir.</p>
            `,
          updatedAt: '2026-01-01T00:00:00Z',
        },
      };
    }
  },
};
