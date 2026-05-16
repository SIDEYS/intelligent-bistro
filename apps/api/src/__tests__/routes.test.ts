import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';

vi.mock('../services/llm', () => ({
  createLLMProvider: () => ({
    chat: vi.fn().mockResolvedValue({
      text: 'I have added Margherita Pizza to your cart!',
      toolCalls: [
        {
          id: 'call_01',
          name: 'add_item',
          arguments: { itemId: 'main-01', quantity: 1 },
        },
      ],
    }),
  }),
}));

describe('GET /health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /menu', () => {
  it('returns an array of menu items', async () => {
    const res = await request(app).get('/menu');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns items with required fields', async () => {
    const res = await request(app).get('/menu');
    const item = res.body[0];
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('price');
    expect(item).toHaveProperty('category');
  });
});

describe('GET /menu/:category', () => {
  it('filters items by valid category', async () => {
    const res = await request(app).get('/menu/drink');
    expect(res.status).toBe(200);
    expect(res.body.every((i: { category: string }) => i.category === 'drink')).toBe(true);
  });

  it('returns 400 for invalid category', async () => {
    const res = await request(app).get('/menu/sushi');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /chat', () => {
  it('returns a reply and cartDiff for a valid request', async () => {
    const res = await request(app)
      .post('/chat')
      .send({
        messages: [{ role: 'user', content: 'I want a pizza', timestamp: 1 }],
        cart: [],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reply');
    expect(res.body).toHaveProperty('cartDiff');
  });

  it('returns 400 for missing messages', async () => {
    const res = await request(app).post('/chat').send({ cart: [] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty messages array', async () => {
    const res = await request(app).post('/chat').send({ messages: [], cart: [] });
    expect(res.status).toBe(400);
  });

  it('includes added items in cartDiff when LLM calls add_item', async () => {
    const res = await request(app)
      .post('/chat')
      .send({
        messages: [{ role: 'user', content: 'Add a margherita pizza', timestamp: 1 }],
        cart: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.cartDiff.added).toBeDefined();
    expect(res.body.cartDiff.added[0].itemId).toBe('main-01');
  });
});

describe('POST /orders', () => {
  it('places an order and returns orderId and wait time', async () => {
    const res = await request(app)
      .post('/orders')
      .send({
        cart: [{ itemId: 'main-01', name: 'Margherita Pizza', quantity: 1, unitPrice: 1595 }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('estimatedWaitMinutes');
    expect(res.body.orderId).toMatch(/^ORD-/);
  });

  it('returns 400 for empty cart', async () => {
    const res = await request(app).post('/orders').send({ cart: [] });
    expect(res.status).toBe(400);
  });
});
