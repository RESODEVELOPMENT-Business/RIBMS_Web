import { create } from 'zustand';

interface LoadingState {
  activeRequests: number;
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  clearLoading: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  activeRequests: 0,
  isLoading: false,
  startLoading: () =>
    set((state) => {
      const nextActive = state.activeRequests + 1;
      return {
        activeRequests: nextActive,
        isLoading: nextActive > 0,
      };
    }),
  stopLoading: () =>
    set((state) => {
      const nextActive = Math.max(0, state.activeRequests - 1);
      return {
        activeRequests: nextActive,
        isLoading: nextActive > 0,
      };
    }),
  clearLoading: () =>
    set({
      activeRequests: 0,
      isLoading: false,
    }),
}));
