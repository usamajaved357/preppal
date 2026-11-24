import { create } from 'zustand';

/** Header search → filters the home menu. Kept in memory only (clears on reload). */
export const useSearch = create<{ query: string; setQuery: (q: string) => void }>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
}));
