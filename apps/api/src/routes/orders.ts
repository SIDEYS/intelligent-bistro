import { Router } from 'express';
import { z } from 'zod';
import { CartItemSchema } from '@bistro/shared';

const router = Router();

const PlaceOrderSchema = z.object({
  cart: z.array(CartItemSchema).min(1),
});

router.post('/', (req, res) => {
  const result = PlaceOrderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid order', details: result.error.flatten() });
    return;
  }

  const orderId = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const waitMinutes = 15 + Math.floor(Math.random() * 10);

  res.status(201).json({
    orderId,
    estimatedWaitMinutes: waitMinutes,
    items: result.data.cart,
  });
});

export default router;
