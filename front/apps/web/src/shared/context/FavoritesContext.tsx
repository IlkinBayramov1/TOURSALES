import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Tour } from '@toursales/types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { accountApi } from '../../modules/account/api/accountApi';
import { tourApi } from '../../modules/tour/api/tourApi';

const STORAGE_KEY_IDS = 'toursales_favorites';
const STORAGE_KEY_CACHE = 'toursales_favorites_cache';
const LEGACY_WISHLIST_KEY = 'toursales_wishlist';

export interface FavoritesContextType {
  favorites: Tour[];
  favoriteIds: string[];
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (tourId: string) => boolean;
  toggleFavorite: (tourOrId: Tour | string) => Promise<void>;
  removeFavorite: (tourId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Helper to migrate legacy wishlist IDs from previous implementation
const getInitialStoredIds = (): string[] => {
  try {
    let ids: string[] = [];
    const stored = localStorage.getItem(STORAGE_KEY_IDS);
    if (stored) {
      ids = JSON.parse(stored);
    }
    const legacy = localStorage.getItem(LEGACY_WISHLIST_KEY);
    if (legacy) {
      const legacyIds: string[] = JSON.parse(legacy);
      ids = Array.from(new Set([...ids, ...legacyIds]));
      localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(ids));
      localStorage.removeItem(LEGACY_WISHLIST_KEY);
    }
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

const getInitialStoredCache = (): Tour[] => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
};

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { success, info } = useToast();

  const [favoriteIds, setFavoriteIds] = useState<string[]>(getInitialStoredIds);
  const [favorites, setFavorites] = useState<Tour[]>(getInitialStoredCache);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const syncedUserIdRef = React.useRef<string | null>(null);

  // Sync to localStorage
  const persistLocal = useCallback((ids: string[], toursList: Tour[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_IDS, JSON.stringify(ids));
      localStorage.setItem(STORAGE_KEY_CACHE, JSON.stringify(toursList));
    } catch (e) {
      console.warn('Could not persist favorites to localStorage', e);
    }
  }, []);

  // Fetch or sync favorites
  const refreshFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated && user?.id) {
        const userId = user.id;
        let serverTours: Tour[] = [];

        // Only sync guest favorites on first login transition for this user
        if (syncedUserIdRef.current !== userId) {
          syncedUserIdRef.current = userId;
          const localIds = getInitialStoredIds();
          if (localIds.length > 0) {
            try {
              const syncRes = await accountApi.syncFavorites(localIds);
              serverTours = syncRes.data || [];
            } catch {
              const res = await accountApi.getFavorites();
              serverTours = res.data || [];
            }
          } else {
            const res = await accountApi.getFavorites();
            serverTours = res.data || [];
          }
        } else {
          const res = await accountApi.getFavorites();
          serverTours = res.data || [];
        }

        const newIds = serverTours.map((t) => t.id);
        setFavorites(serverTours);
        setFavoriteIds(newIds);
        persistLocal(newIds, serverTours);
      } else {
        syncedUserIdRef.current = null;
        // Guest user: Load by IDs from local storage
        const currentIds = getInitialStoredIds();
        setFavoriteIds(currentIds);

        // Check which IDs are missing from local cache
        const cached = getInitialStoredCache();
        const cachedMap = new Map(cached.map((t) => [t.id, t]));
        const missingIds = currentIds.filter((id) => !cachedMap.has(id));

        if (missingIds.length > 0) {
          const fetchedResults = await Promise.allSettled(
            missingIds.map((id) => tourApi.getTourById(id))
          );
          fetchedResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
              cachedMap.set(result.value.id, result.value);
            }
          });
        }

        // Build sorted list matching currentIds
        const activeTours = currentIds
          .map((id) => cachedMap.get(id))
          .filter((t): t is Tour => Boolean(t));

        setFavorites(activeTours);
        persistLocal(currentIds, activeTours);
      }
    } catch (err) {
      console.error('Xəta: Seçilmiş turlar yenilənərkən problem yarandı:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, persistLocal]);

  // Initial load or auth state transition (stable primitive deps)
  const currentUserId = user?.id;
  useEffect(() => {
    refreshFavorites();
  }, [isAuthenticated, currentUserId, refreshFavorites]);

  const isFavorite = useCallback(
    (tourId: string): boolean => {
      return favoriteIds.includes(tourId);
    },
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (tourOrId: Tour | string) => {
      const tourId = typeof tourOrId === 'string' ? tourOrId : tourOrId.id;
      const tourObj = typeof tourOrId === 'string' ? null : tourOrId;
      const currentlyFavorite = favoriteIds.includes(tourId);

      if (currentlyFavorite) {
        // Remove favorite
        const nextIds = favoriteIds.filter((id) => id !== tourId);
        const nextTours = favorites.filter((t) => t.id !== tourId);

        setFavoriteIds(nextIds);
        setFavorites(nextTours);
        persistLocal(nextIds, nextTours);

        info('Tur seçilmişlərdən çıxarıldı.', 'Seçilmişlər');

        if (isAuthenticated && user) {
          try {
            await accountApi.toggleFavorite(tourId);
          } catch (e) {
            console.warn('Backend favorite remove sync failed', e);
          }
        }
      } else {
        // Add favorite
        let tourToAdd = tourObj || favorites.find((t) => t.id === tourId);

        // If tour object not in memory, fetch it
        if (!tourToAdd) {
          try {
            tourToAdd = await tourApi.getTourById(tourId);
          } catch (e) {
            console.warn('Could not fetch tour details for favorite', e);
          }
        }

        const nextIds = [...favoriteIds, tourId];
        const nextTours = tourToAdd ? [...favorites, tourToAdd] : favorites;

        setFavoriteIds(nextIds);
        setFavorites(nextTours);
        persistLocal(nextIds, nextTours);

        success('Tur seçilmişlərə əlavə olundu!', 'Seçilmişlər');

        if (isAuthenticated && user) {
          try {
            await accountApi.toggleFavorite(tourId);
          } catch (e) {
            console.warn('Backend favorite add sync failed', e);
          }
        }
      }
    },
    [favoriteIds, favorites, isAuthenticated, user, persistLocal, success, info]
  );

  const removeFavorite = useCallback(
    async (tourId: string) => {
      if (!favoriteIds.includes(tourId)) return;
      const nextIds = favoriteIds.filter((id) => id !== tourId);
      const nextTours = favorites.filter((t) => t.id !== tourId);

      setFavoriteIds(nextIds);
      setFavorites(nextTours);
      persistLocal(nextIds, nextTours);

      info('Tur seçilmişlərdən çıxarıldı.', 'Seçilmişlər');

      if (isAuthenticated && user) {
        try {
          await accountApi.toggleFavorite(tourId);
        } catch (e) {
          console.warn('Backend remove favorite failed', e);
        }
      }
    },
    [favoriteIds, favorites, isAuthenticated, user, persistLocal, info]
  );

  const clearFavorites = useCallback(async () => {
    setFavoriteIds([]);
    setFavorites([]);
    persistLocal([], []);

    info('Bütün seçilmiş turlar təmizləndi.', 'Seçilmişlər');

    if (isAuthenticated && user) {
      try {
        await accountApi.syncFavorites([]);
      } catch (e) {
        console.warn('Backend clear favorites failed', e);
      }
    }
  }, [isAuthenticated, user, persistLocal, info]);

  const value = useMemo(
    () => ({
      favorites,
      favoriteIds,
      favoritesCount: favoriteIds.length,
      isLoading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      refreshFavorites,
    }),
    [
      favorites,
      favoriteIds,
      isLoading,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      refreshFavorites,
    ]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
