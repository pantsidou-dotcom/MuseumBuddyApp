import { createContext, useContext, useEffect, useState } from 'react';

const FavoritesContext = createContext({ favorites: [], toggleFavorite: () => {} });

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (Array.isArray(stored)) {
        setFavorites(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const toggleFavorite = (museum) => {
    setFavorites((prev) => {
      const exists = prev.some((m) => m.id === museum.id);
      return exists ? prev.filter((m) => m.id !== museum.id) : [...prev, museum];
    });
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
