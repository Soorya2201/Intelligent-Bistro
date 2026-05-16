import { Router } from 'express';
import { getRecommendations } from '../services/recommendations';
import { getPopularItems } from '../db/menuRepository';

const router = Router();

const RECOMMENDATION_COUNT = parseInt(process.env.RECOMMENDATION_COUNT || '3', 10);

router.get('/', async (req, res) => {
  const sessionId   = req.query.sessionId as string | undefined;
  const cartItemIds = req.query.cartItemIds
    ? String(req.query.cartItemIds).split(',').filter(Boolean)
    : [];
  const dietary = req.query.dietary
    ? String(req.query.dietary).split(',').filter(Boolean)
    : [];

  try {
    if (!sessionId) {
      // No session — return globally popular items as fallback
      const popular = getPopularItems(RECOMMENDATION_COUNT);
      res.json({
        recommendations: popular.map(item => ({
          item_id: item.id,
          name:    item.name,
          price:   item.price,
          image:   item.image,
          reason:  'Popular tonight',
          score:   0.8,
          source:  'popularity',
        })),
      });
      return;
    }

    const recs = await getRecommendations(sessionId, cartItemIds, dietary, RECOMMENDATION_COUNT);

    if (!recs.length) {
      // Fallback to popular
      const popular = getPopularItems(RECOMMENDATION_COUNT);
      res.json({
        recommendations: popular.map(item => ({
          item_id: item.id,
          name:    item.name,
          price:   item.price,
          image:   item.image,
          reason:  'Popular tonight',
          score:   0.7,
          source:  'popularity',
        })),
      });
      return;
    }

    res.json({ recommendations: recs });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
