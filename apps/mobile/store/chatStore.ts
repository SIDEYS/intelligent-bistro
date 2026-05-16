import { create } from 'zustand';
import { ChatMessage } from '@bistro/shared';

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (message: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clear: () => set({ messages: [], error: null }),
}));
