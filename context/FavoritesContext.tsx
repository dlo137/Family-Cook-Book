import { createContext, useContext, useState, ReactNode } from "react";

export type FavoriteRecipe = {
  id: string;
  title: string;
  source: number | { uri: string } | null;
};

type FavoritesContextType = {
  favorites: FavoriteRecipe[];
  addFavorites: (recipes: FavoriteRecipe[]) => void;
  removeFavorite: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  addFavorites: () => {},
  removeFavorite: () => {},
});

const DEFAULT_FAVORITES: FavoriteRecipe[] = [
  { id: "default-1", title: "Mom's Famous Lasagna", source: require("../assets/lasagna.png") },
  { id: "default-2", title: "Summer Salad", source: require("../assets/salad1.avif") },
  { id: "default-3", title: "Sunday Roast", source: require("../assets/beefstew.jpg") },
];

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>(DEFAULT_FAVORITES);

  function addFavorites(recipes: FavoriteRecipe[]) {
    setFavorites((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const newOnes = recipes.filter((r) => !existingIds.has(r.id));
      return [...newOnes, ...prev];
    });
  }

  function removeFavorite(id: string) {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorites, removeFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
