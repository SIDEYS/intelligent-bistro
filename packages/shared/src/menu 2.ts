import { z } from 'zod';

export const MenuCategorySchema = z.enum(['starter', 'main', 'dessert', 'drink']);
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().int().positive(),
  category: MenuCategorySchema,
  tags: z.array(z.string()),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;
