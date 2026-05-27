import { StateCreator } from 'zustand';

export interface CustomizeSlice {
  activeLineId: string | null;
  openCustomize: (lineId: string) => void;
  closeCustomize: () => void;
}

export const createCustomizeSlice: StateCreator<CustomizeSlice, [], [], CustomizeSlice> = (set) => ({
  activeLineId: null,
  openCustomize: (lineId) => set({ activeLineId: lineId }),
  closeCustomize: () => set({ activeLineId: null }),
});
