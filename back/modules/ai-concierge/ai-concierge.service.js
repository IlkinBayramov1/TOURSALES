import prisma from '../../config/db.js';

export const aiConciergeService = {
  // Parse free-form natural language query
  parseTravelPrompt: (promptText = '') => {
    const text = promptText.toLowerCase().trim();

    // 1. Group / Pax detection
    let pax = 2;
    let groupType = 'COUPLE';

    if (text.includes('ailə') || text.includes('uşaq') || text.includes('family')) {
      groupType = 'FAMILY';
      pax = 4;
    } else if (text.includes('dost') || text.includes('qrup') || text.includes('kollektiv') || text.includes('uşaqlar')) {
      groupType = 'GROUP';
      pax = 6;
    } else if (text.includes('tək') || text.includes('özüm') || text.includes('solo')) {
      groupType = 'SOLO';
      pax = 1;
    }

    const paxMatch = text.match(/(\d+)\s*(nəfər|adam|pax|person)/i);
    if (paxMatch) {
      pax = parseInt(paxMatch[1], 10);
    }

    // 2. Budget detection
    let maxBudget = null;
    const budgetMatch = text.match(/(\d+)\s*(azn|manat|usd|\$|büdce|büdcə)/i) || text.match(/büdcə[^\d]*(\d+)/i);
    if (budgetMatch) {
      maxBudget = parseInt(budgetMatch[1], 10);
    }

    // 3. Destinations & Regions
    const destinations = [];
    const regionKeywords = {
      'Quba': ['quba', 'qusar', 'şahdağ', 'shahdag', 'qırmızı qəsəbə', 'xınalıq'],
      'Qəbələ': ['qəbələ', 'qebele', 'nohurgöl', 'tufandağ', 'yeddi gözəl'],
      'Şəki': ['şəki', 'sheki', 'xan sarayı', 'karvansaray', 'kiş'],
      'Lənkəran': ['lənkəran', 'lenkeran', 'lerik', 'masallı', 'istisu'],
      'Gəncə': ['gəncə', 'gence', 'göygöl', 'goygol', 'maralgöl'],
      'İsmayıllı': ['ismayıllı', 'ismayilli', 'lahıc', 'lahic', 'ivanovka'],
      'İstanbul': ['istanbul', 'türkiyə', 'turkey'],
      'Dubay': ['dubay', 'dubai', 'bəə'],
    };

    for (const [city, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some((kw) => text.includes(kw))) {
        destinations.push(city);
      }
    }

    // 4. Interest Tags
    const tags = [];
    const tagMap = {
      'təbiət': ['təbiət', 'meşə', 'yaşıllıq', 'saf hava', 'park'],
      'dağ': ['dağ', 'zirvə', 'şahdağ', 'tufandağ', 'xizək', 'qar'],
      'göl': ['göl', 'nohurgöl', 'göygöl', 'su', 'qayıq'],
      'şəlalə': ['şəlalə', 'afurca', 'yeddi gözəl', 'ləzə'],
      'tarix': ['tarix', 'qala', 'muzey', 'abidə', 'saray', 'karvansaray'],
      'sakitlik': ['sakit', 'istirahət', 'hüzur', 'relaks', 'spa'],
      'kanat': ['kanat', 'teleferik', 'attraksion'],
      'qastronomiya': ['yemək', 'mətbəx', 'plov', 'şirniyyat', 'kabab', 'piti'],
    };

    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some((kw) => text.includes(kw))) {
        tags.push(tag);
      }
    }

    // 5. Category (Domestic vs Foreign)
    let category = 'DOMESTIC';
    if (text.includes('xarici') || text.includes('istanbul') || text.includes('dubay') || text.includes('türkiyə') || text.includes('viza')) {
      category = 'FOREIGN';
    }

    return {
      rawPrompt: promptText,
      pax,
      groupType,
      maxBudget,
      destinations,
      tags,
      category,
    };
  },

  // Recommend packages based on criteria
  getRecommendations: async (promptText, userId = null) => {
    const criteria = aiConciergeService.parseTravelPrompt(promptText);

    // Fetch active tours matching category
    const tours = await prisma.tour.findMany({
      where: {
        status: 'Active',
      },
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true, rating: true },
        },
      },
      take: 20,
    });

    // Score and rank tours
    const scoredTours = tours.map((tour) => {
      let score = 50; // base score
      const price = Number(tour.price);
      const titleLower = tour.title.toLowerCase();

      // Destination matching (+35 points)
      if (criteria.destinations.length > 0) {
        const matchesDest = criteria.destinations.some((d) => titleLower.includes(d.toLowerCase()));
        if (matchesDest) score += 35;
      } else {
        score += 15;
      }

      // Budget matching (+25 points)
      if (criteria.maxBudget) {
        const estTotal = price * criteria.pax;
        if (estTotal <= criteria.maxBudget) {
          score += 25;
        } else if (estTotal <= criteria.maxBudget * 1.2) {
          score += 10;
        } else {
          score -= 20;
        }
      }

      // Category matching (+15 points)
      if (tour.type === criteria.category) {
        score += 15;
      }

      // Tags matching
      criteria.tags.forEach((tag) => {
        if (titleLower.includes(tag) || (tour.description && tour.description.toLowerCase().includes(tag))) {
          score += 10;
        }
      });

      // Rating bonus
      if (tour.company?.rating) {
        score += Math.round(tour.company.rating * 2);
      }

      return {
        ...tour,
        calculatedScore: score,
        priceNumber: price,
        estTotalPrice: price * criteria.pax,
      };
    });

    // Sort by calculatedScore descending
    scoredTours.sort((a, b) => b.calculatedScore - a.calculatedScore);

    const fallbackTour = scoredTours[0] || {
      id: 'mock-1',
      title: 'Qəbələ & Şəki VIP Həftəsonu Turu',
      price: 65,
      type: 'DOMESTIC',
      company: { name: 'AzTour MMC', rating: 4.9 },
    };

    // 3 Curated Packages:
    // 1. Best Match (Overall highest score)
    const bestMatch = scoredTours[0] || fallbackTour;

    // 2. Best Value (Lowest price that is at least somewhat relevant)
    const sortedByPrice = [...scoredTours].sort((a, b) => a.priceNumber - b.priceNumber);
    const bestValue = sortedByPrice.find((t) => t.id !== bestMatch.id) || sortedByPrice[0] || bestMatch;

    // 3. Luxury / VIP (Highest rated / premium)
    const sortedByLuxury = [...scoredTours].sort((a, b) => (b.company?.rating || 0) - (a.company?.rating || 0));
    const luxuryChoice = sortedByLuxury.find((t) => t.id !== bestMatch.id && t.id !== bestValue.id) || sortedByLuxury[0] || bestMatch;

    const packages = [
      {
        badge: '🥇 Ən Uyğun Seçim (Best Match)',
        tagline: `${criteria.pax} nəfərlik qrupunuz və maraqlarınız üçün alqoritm tərəfindən ən yüksək bal toplayan optimal səyahət.`,
        tour: {
          id: bestMatch.id,
          title: bestMatch.title,
          price: Number(bestMatch.price),
          estTotalPrice: Number(bestMatch.price) * criteria.pax,
          type: bestMatch.type,
          startDate: bestMatch.startDate,
          companyName: bestMatch.company?.name || 'Lisenziyalı Turizm Partnyoru',
          rating: bestMatch.company?.rating || 4.9,
          images: bestMatch.images ? JSON.parse(bestMatch.images || '[]') : [],
        },
        highlights: [
          'Komfortlu nəqliyyat və peşəkar bələdçi müşayiəti',
          'Təbiət və görməli yerlərdə foto-fasilələr',
          'Müştəri məmnuniyyəti 98%+',
        ],
      },
      {
        badge: '🥈 Ən Qənaətcil Seçim (Best Value)',
        tagline: 'Cibinizə qənaət edərək maksimum dolğun marşrut və unudulmaz təəssüratlar.',
        tour: {
          id: bestValue.id,
          title: bestValue.title,
          price: Number(bestValue.price),
          estTotalPrice: Number(bestValue.price) * criteria.pax,
          type: bestValue.type,
          startDate: bestValue.startDate,
          companyName: bestValue.company?.name || 'Premium Səyahət MMC',
          rating: bestValue.company?.rating || 4.7,
          images: bestValue.images ? JSON.parse(bestValue.images || '[]') : [],
        },
        highlights: [
          'Sərfəli adambaşı qiymət',
          'Səhər yeməyi və çay süfrəsi daxil',
          '30% depozitlə bron imkanı',
        ],
      },
      {
        badge: '🥉 Premium / VIP İstirahət (Luxury Choice)',
        tagline: '5 ulduzlu otel qonaqlaması, VIP transfer və eksklüziv fərdi yanaşma.',
        tour: {
          id: luxuryChoice.id,
          title: luxuryChoice.title,
          price: Number(luxuryChoice.price),
          estTotalPrice: Number(luxuryChoice.price) * criteria.pax,
          type: luxuryChoice.type,
          startDate: luxuryChoice.startDate,
          companyName: luxuryChoice.company?.name || 'Royal Travel Club',
          rating: luxuryChoice.company?.rating || 5.0,
          images: luxuryChoice.images ? JSON.parse(luxuryChoice.images || '[]') : [],
        },
        highlights: [
          'VIP səviyyəli transfer və limitsiz WiFi',
          'Lüks oteldə spa və hovuz daxil',
          'Xüsusi dequstasiya və milli şam yeməyi',
        ],
      },
    ];

    // Natural Azerbaijani Advice
    const destText = criteria.destinations.length > 0 ? criteria.destinations.join(' və ') : 'Azərbaycanın füsunkar guşələri';
    const adviceText = `Müşahidələrimizə əsasən, ${criteria.pax} nəfərlik ${
      criteria.groupType === 'FAMILY' ? 'ailəniz' : criteria.groupType === 'COUPLE' ? 'səyahətiniz' : 'qrupunuz'
    } üçün ${destText} istiqaməti ən ideal seçimdir. ${
      criteria.maxBudget ? `Nəzərdə tutduğunuz ~${criteria.maxBudget} AZN büdcə çərçivəsində` : 'Cari mövsümə uyğun olaraq'
    } sizin üçün 3 fərqli kateqoriyada paket hazırladıq. Təbiət qoynunda gəzintilər üçün rahat ayaqqabı və ehtiyat isti geyim götürməyi tövsiyə edirik.`;

    // Audit log
    try {
      await prisma.aiSearchLog.create({
        data: {
          userId: userId || null,
          prompt: promptText,
          parsedCriteria: JSON.stringify(criteria),
          recommendedIds: JSON.stringify(packages.map((p) => p.tour.id)),
        },
      });
    } catch (e) {
      console.error('Failed to log AI search:', e);
    }

    return {
      criteria,
      advice: adviceText,
      packages,
    };
  },
};
