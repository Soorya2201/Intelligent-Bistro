import { StateCreator } from 'zustand';

export interface ProfileSlice {
  restrictions: string[];
  addRestriction: (restriction: string) => void;
  removeRestriction: (restriction: string) => void;
  clearRestrictions: () => void;
}

export const createProfileSlice: StateCreator<ProfileSlice, [], [], ProfileSlice> = (set) => ({
  restrictions: [],
  addRestriction: (restriction) => set((state) => ({
    restrictions: state.restrictions.includes(restriction) 
      ? state.restrictions 
      : [...state.restrictions, restriction]
  })),
  removeRestriction: (restriction) => set((state) => ({
    restrictions: state.restrictions.filter(r => r !== restriction)
  })),
  clearRestrictions: () => set({ restrictions: [] }),
});
