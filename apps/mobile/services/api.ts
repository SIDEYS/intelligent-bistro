import { ChatRequest, ChatResponse, ChatResponseSchema, MenuItem } from '@bistro/shared';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  getMenu: () => request<MenuItem[]>('/menu'),

  chat: (body: ChatRequest) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((data) => ChatResponseSchema.parse(data)),

  placeOrder: (cart: ChatRequest['cart']) =>
    request<{ orderId: string; estimatedWaitMinutes: number }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ cart }),
    }),
};
