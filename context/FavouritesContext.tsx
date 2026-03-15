import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFavourites, toggleFavourite } from '../store/favourites';

type FavouritesContextType = {
  favourites: string[];
  toggleFavourite: (id: string) => Promise<void>;
};

const FavouritesContext = createContext<FavouritesContextType>({
  favourites: [],
  toggleFavourite: async () => {},
});

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<string[]>([]);

  useEffect(() => {
    getFavourites().then(setFavourites);
  }, []);

  const toggle = useCallback(async (id: string) => {
    const updated = await toggleFavourite(id);
    setFavourites(updated);
  }, []);

  return (
    <FavouritesContext.Provider value={{ favourites, toggleFavourite: toggle }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  return useContext(FavouritesContext);
}
