import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PageStoreState = {
  data: any
  userStores: any[]
}

type PageStoreActions = {
  setData: (data: any) => void
  setUserStores: (userStores: any[]) => void
}

type PageStore = PageStoreState & PageStoreActions

export const usePageStore = createStore<PageStore>()(
  persist(
    (set) => ({
      data: {},
      userStores: [],
      setData: (data: any) => {
        set({ data });
      },
      setUserStores: (userStores: any[]) => {
        set({ userStores });
      }
      
    }),
    { name: 'page-storage' },
  ),
)