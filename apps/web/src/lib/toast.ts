import { create } from 'zustand';

interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
  hide: () => void;
}

/** One small "Added to cart" style toast at a time. */
export const useToast = create<ToastState>((set, get) => ({
  message: null,
  id: 0,
  show: (message) => {
    const id = get().id + 1;
    set({ message, id });
    setTimeout(() => {
      if (get().id === id) set({ message: null });
    }, 2600);
  },
  hide: () => set({ message: null }),
}));
