import { Router } from 'express';
import { getMenuAsCategories, getPopularItems } from '../db/menuRepository';

const router = Router();

router.get('/', (req, res) => {
  try {
    const categories = getMenuAsCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

router.get('/popular', (req, res) => {
  try {
    const items = getPopularItems(10);
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch popular items' });
  }
});

export default router;
