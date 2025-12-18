import { createStore } from 'zustand/vanilla'
import { persist } from 'zustand/middleware'

type PageStoreState = {
  adminInfo: Record<string, any> | null
  token: string
  sessionId: string
}

type PageStoreActions = {
  setAdminInfo: (info: Record<string, any>) => void
  setToken: (token: string) => void
  setSessionId: (sessionId: string) => void
}

type PageStore = PageStoreState & PageStoreActions

const pageStore = createStore<PageStore>()(
  persist(
    (set) => ({
      adminInfo: null,
      token: '',
      sessionId: '',

      setAdminInfo: (info) => set({ adminInfo: info }),
      setToken: (token) => set({ token }),
      setSessionId: (sessionId) => set({ sessionId }),
    }),
    { name: 'page-storage' },
  ),
)

export default pageStore