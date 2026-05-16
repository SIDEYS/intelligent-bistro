import { Router } from 'express';
import { MenuCategorySchema } from '@bistro/shared';
import { MENU, getMenuByCategory } from '../data/menu';

const router = Router();

router.get('/', (_req, res) => {
  res.json(MENU);
});

router.get('/:category', (req, res) => {
  const result = MenuCategorySchema.safeParse(req.params.category);
  if (!result.success) {
    res.status(400).json({ error: 'Invalid category', validCategories: ['starter', 'main', 'dessert', 'drink'] });
    return;
  }
  res.json(getMenuByCategory(result.data));
});

export default router;
