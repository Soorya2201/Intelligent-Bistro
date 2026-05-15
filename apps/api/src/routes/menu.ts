import { Router } from 'express';
import menu from '../data/menu.json';

const router = Router();

router.get('/', (req, res) => {
  res.json(menu);
});

export default router;
