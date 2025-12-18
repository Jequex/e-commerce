import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PageStoreState = {
  data: any
}

type PageStoreActions = {
  setData: (data: any) => void
}

type PageStore = PageStoreState & PageStoreActions

export const usePageStore = createStore<PageStore>()(
  persist(
    (set) => ({
      data: {},
      setData: (data: any) => {
        set({ data });
      }
    }),
    { name: 'page-storage' },
  ),
)