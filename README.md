# TOURSALES — Onlayn Tur və Səyahət Rezervasiya Portalı

TOURSALES — turizm şirkətləri (vendorlar), səyahətçilər və platforma administratorlarını bir araya gətirən çoxşaxəli, çoxicarəli (multi-tenant) B2B və B2C səyahət texnologiyaları ekosistemidir. Platforma Node.js, Express, Prisma ORM və MySQL əsaslı dayanıqlı arxa tərəf (backend) və React, TypeScript, Vite əsaslı müasir ön tərəf (frontend) monorepo arxitekturası üzərində qurulmuşdur.

---

## Layihə Haqqında

Platforma ölkədaxili və beynəlxalq turların axtarışı, interaktiv avtobus oturacaqlarının seçimi, təhlükəsiz onlayn ödəniş, QR-kodlu elektron vauçerlərin generasiyası, partnyor agentliklərin idarəetmə kabineti və loyallıq proqramını vahid mühitdə birləşdirir.

---

## Əsas Funksionallıqlar və Modullar

### 1. Tur və Səyahət Kataloqu
- Daxili və beynəlxalq turların kateqoriyalaşdırılması.
- Çoxölçülü filtrləmə sistemi: regionlar (Quba, Qusar, Şəki, Lənkəran və s.), qiymət aralığı, müddət (1 günlük, həftəsonu, çoxgünlük), reytinq və nəqliyyat növü.
- Hər bir tur üçün proqram (itinerary), daxil olan və daxil olmayan xidmətlər, foto qalereya və təsdiqlənmiş müştəri rəyləri.

### 2. İnteraktiv Avtobus və Oturacaq Sistemi
- Daxili turlar üçün real vaxt rejimində vizual avtobus sxemi.
- Oturacaqların bloklanması (mutex locking mexanizmi) vasitəsilə eyni yerin bir neçə müştəri tərəfindən eyni vaxtda alınmasının qarşısının alınması.
- Hər bir sərnişin üçün xüsusi oturacaq nömrəsinin biletə və QR vauçerə inteqrasiyası.

### 3. Sifariş və Təhlükəsiz Ödəniş Axını
- Sərnişin məlumatlarının (ad, soyad, əlaqə vasitələri, FİN/pasport) qeydiyyatı.
- BirBank / Kapital Bank, Bank Kartı və Stripe ödəniş şlüzləri inteqrasiyası.
- İdempotent vebhuk (webhook) idarəetməsi ilə təkrar tranzaksiyaların qarşısının alınması (`SKIPPED_DUPLICATE`).
- 100% öncədən ödəniş modeli ilə maliyyə intizamı və borcsuz sifariş modeli.

### 4. Kriptoqrafik QR Vauçer və Bilet Sistemi
- Sifariş təsdiqləndikdən sonra avtomatik generasiya olunan unikal QR kod və vauçer.
- HMAC-SHA256 əsaslı bilet doğrulama modulu (saxta biletlərin qarşısının alınması).
- Çapa uyğun PDF və rəqəmsal vauçer görünüşü, bələdçilər üçün QR skan vasitəsilə sərnişin yoxlanışı (check-in).

### 5. Loyallıq və Bonus Xalları Proqramı
- Yeni qeydiyyatdan keçən hər bir müştəriyə avtomatik 100 Xoş Gəldin Xalı hədiyyə olunması.
- Dinamik FinTech virtual kart interfeysi və status dərəcələri: Bronze, Silver, Gold, Platinum.
- Statusa uyğun daimi endirimlər və növbəti səviyyə üçün tərəqqi xətti (progress bar).
- Partnyor təklifləri (Starbucks, PAŞA Sığorta, Hava Limanı Transferi, DiscoverAz, Otellər) üzrə xal dəyişdirmə və `RW-XXXXXX` vauçer kodu generasiyası.
- Həm daxil olmuş istifadəçilər, həm də qonaqlar üçün optimallaşdırılmış kataloq.

### 6. Seçilmişlər və Sevimlilər (Wishlist)
- Tur kartlarında və tur detallarında bəyənmə (ürək) funksionallığı.
- Qonaqlar üçün brauzerin yerli yaddaşında (LocalStorage), daxil olmuş istifadəçilər üçün isə verilənlər bazasında avtomatik sinxronizasiya.
- `/account/favorites` səhifəsində seçilmiş turların rahat idarəedilməsi.

### 7. Çoxvalyutalı Mühit və Dəstək Xətti
- AZN, USD və EUR valyuta dəstəyi ilə anlıq avtomatik məzənnə konversiyası.
- Bütün platforma üzrə vahid mərkəzləşdirilmiş əlaqə və WhatsApp dəstək xətti: +994 (77) 599 00 95.
- Səhifələrdə daimi aktiv üzən (floating) WhatsApp dəstək düyməsi.

### 8. Vendor və B2B İdarəetmə Paneli
- Turizm şirkətləri üçün fərdi idarəetmə kabineti.
- Tur əlavə etmə, redaktə etmə və qiymət tənzimləmələri.
- Sərnişin siyahıları, sifariş statusları və gəlir/komissiya analitikası.
- İki faktorlu autentifikasiya (2FA TOTP) və sessiya təhlükəsizliyi.

---

## Texnologiya Yığını

### Backend
- Platforma: Node.js (ESM)
- Veb Çərçivə: Express.js
- Verilənlər Bazası və ORM: MySQL, Prisma ORM
- Təhlükəsizlik: JSON Web Token (JWT), Refresh Token Sessions, Bcrypt, HMAC-SHA256
- Fayl və Media: Multer, Yerli Təhlükəsiz Yaddaş

### Frontend
- Əsas Kitabxana: React 18
- Dil: TypeScript
- Qurucu: Vite
- Marşrutlaşdırma: React Router DOM (v6)
- Şəbəkə Sorğuları: Axios (Avtomatik token yeniləmə və növbə mexanizmi ilə)
- İkonlar: Lucide React
- Stilləmə: Vanilla CSS və Design Token arxitekturası (Tailwind asılılığı yoxdur)

---

## Layihənin Qovluq Strukturu

```
TOURSALES/
├── back/
│   ├── config/             # Mühit parametrləri və verilənlər bazası konfiqurasiyası
│   ├── core/               # Baza xəta və cavab sinifləri
│   ├── middlewares/        # Autentifikasiya, RBAC və təhlükəsizlik aralıq proqramları
│   ├── modules/            # Modul arxitekturası (auth, tours, bookings, loyalty, users və s.)
│   ├── prisma/             # Verilənlər bazası sxemi (schema.prisma)
│   ├── scripts/            # Verilənlər bazası toxum (seed) və inteqrasiya test skriptləri
│   ├── app.js              # Express tətbiqi və marşrutların birləşdirilməsi
│   └── server.js           # Serverin işə salınması
│
└── front/
    ├── apps/
    │   └── web/            # Əsas müştəri veb tətbiqi (React + Vite)
    │       ├── src/
    │       │   ├── app/    # Əsas App komponenti və router
    │       │   ├── modules/# Funksional bloklar (tour, booking, account, loyalty, cms və s.)
    │       │   ├── shared/ # Ümumi komponentlər, kontekstlər, API müştəriləri və utilitlər
    │       │   └── index.css # Qlobal dizayn sistemi və rəng tokenləri
    └── packages/
        ├── types/          # Paylaşılan TypeScript tipləri və interfeysləri
        └── ui/             # Paylaşılan UI komponentləri (Spinner, Card, Button və s.)
```

---

## Quraşdırma və İşə Salma

### Tələblər
- Node.js (versiya 18 və ya daha yuxarı)
- MySQL Server (versiya 8.0 və ya daha yuxarı)
- npm və ya pnpm paket meneceri

### 1. Backend Quraşdırılması

```bash
# Backend qovluğuna keçid
cd back

# Asılılıqların quraşdırılması
npm install

# .env faylının konfiqurasiyası (nümunə .env.example əsasında)
# DATABASE_URL="mysql://user:password@localhost:3306/toursales"
# JWT_SECRET="your-jwt-secret"

# Verilənlər bazası strukturunun generasiyası və tətbiqi
npx prisma db push
npx prisma generate

# Loyallıq təkliflərinin bazaya daxil edilməsi
node scripts/seed-loyalty-offers.js

# Backend serverinin başladılması (Port 5000)
npm start
```

### 2. Frontend Quraşdırılması

```bash
# Frontend qovluğuna keçid
cd front

# Bütün paket asılılıqlarının quraşdırılması
npm install

# Veb tətbiqinin inkişaf rejimində başladılması (Port 5173)
cd apps/web
npm run dev
```

---

## Test və Doğrulama

Layihənin bütövlüyünü və kod keyfiyyətini yoxlamaq üçün aşağıdakı əmrlərdən istifadə olunur:

```bash
# Frontend tip yoxlanışı (0 xəta tələb olunur)
cd front/apps/web
npx tsc --noEmit

# Frontend istehsalat paketi qurulumu
npm run build

# Backend loyallıq və əsas inteqrasiya testləri
cd back
node scripts/test-loyalty-integration.js
```

---

## Əlaqə və Dəstək

- Platforma: TOURSALES Onlayn Tur və Səyahət Rezervasiya Portalı
- Rəsmi Dəstək Xətti: +994 (77) 599 00 95
- WhatsApp Əlaqə: https://wa.me/994775990095
