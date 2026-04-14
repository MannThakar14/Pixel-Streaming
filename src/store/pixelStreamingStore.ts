import type { StateCreator } from 'zustand/vanilla'
import { create } from 'zustand'
import { PixelStreaming } from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.4'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'retrying'

export interface Store {
  pixelStreaming?: PixelStreaming,
  setPixelStreaming: (pixelStreaming: PixelStreaming) => void,

  // Connection health tracking
  connectionStatus: ConnectionStatus,
  setConnectionStatus: (status: ConnectionStatus) => void,
  retryCount: number,
  setRetryCount: (count: number) => void,

  // Trigger a reconnect from outside the wrapper
  reconnectTrigger: number,
  triggerReconnect: () => void,
}

const store: StateCreator<Store> = (set) => ({
  pixelStreaming: undefined,
  setPixelStreaming: (pixelStreaming: PixelStreaming) =>
    set({ pixelStreaming }),

  connectionStatus: 'connecting',
  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),

  retryCount: 0,
  setRetryCount: (count: number) => set({ retryCount: count }),

  reconnectTrigger: 0,
  triggerReconnect: () => set((s) => ({ reconnectTrigger: s.reconnectTrigger + 1 })),
})

export const usePixelStreamingStore = create<Store>(store)