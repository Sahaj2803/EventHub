import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { favoritesAPI } from "../services/api";
import { useAuth } from "./AuthContext";

export interface FavoriteEventMeta {
  _id: string;
  title: string;
  image?: string;
  categoryName?: string;
}

interface FavoritesContextValue {
  favorites: Record<string, FavoriteEventMeta>;
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (event: FavoriteEventMeta) => Promise<void>;
  removeFavorite: (eventId: string) => Promise<void>;
  clearFavorites: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<Record<string, FavoriteEventMeta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ useCallback se stable reference (no infinite render)
  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await favoritesAPI.getAll();
      const favoritesMap: Record<string, FavoriteEventMeta> = {};

      response.data.favorites.forEach((fav: any) => {
        if (fav.event) {
          favoritesMap[fav.event._id] = {
            _id: fav.event._id,
            title: fav.event.title,
            image: fav.event.images?.[0]?.url,
            categoryName: fav.event.category?.name,
          };
        }
      });

      setFavorites(favoritesMap);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]); // ✅ dependency sirf isAuthenticated

  // ✅ runs only when user/auth changes
  useEffect(() => {
    if (isAuthenticated && user?._id) {
      loadFavorites();
    } else {
      setFavorites({});
    }
  }, [isAuthenticated, user?._id, loadFavorites]);

  const isFavorite = useCallback(
    (eventId: string) => Boolean(favorites[eventId]),
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (event: FavoriteEventMeta) => {
      if (!isAuthenticated) return;

      try {
        if (favorites[event._id]) {
          await favoritesAPI.remove(event._id);
          setFavorites((prev) => {
            const next = { ...prev };
            delete next[event._id];
            return next;
          });
        } else {
          await favoritesAPI.add(event._id);
          setFavorites((prev) => ({
            ...prev,
            [event._id]: event,
          }));
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to toggle favorite");
      }
    },
    [isAuthenticated, favorites]
  );

  const removeFavorite = useCallback(
    async (eventId: string) => {
      if (!isAuthenticated) return;

      try {
        await favoritesAPI.remove(eventId);
        setFavorites((prev) => {
          const next = { ...prev };
          delete next[eventId];
          return next;
        });
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to remove favorite");
      }
    },
    [isAuthenticated]
  );

  const clearFavorites = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      await favoritesAPI.clear();
      setFavorites({});
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to clear favorites");
    }
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      favorites,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      clearFavorites,
      loading,
      error,
    }),
    [favorites, loading, error, isFavorite, toggleFavorite, removeFavorite, clearFavorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextValue => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
};
