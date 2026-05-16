import { Router } from 'express';
import { z } from 'zod';
import { createOrder, getOrdersBySession, getOrderById, updateOrderStatus } from '../db/orderRepository';
import { metrics } from '../services/metrics';

const router = Router();

const CartItemSchema = z.object({
  item_id:  z.string(),
  name:     z.string(),
  quantity: z.number().int().min(1),
  price:    z.number(),
  notes:    z.string().optional(),
});

const CreateOrderSchema = z.object({
  sessionId: z.string(),
  items:     z.array(CartItemSchema).min(1),
  subtotal:  z.number(),
  tax:       z.number(),
  total:     z.number(),
  email:     z.string().email().optional(),
});

router.post('/', (req, res) => {
  const parseResult = CreateOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: { code: 'INVALID_INPUT', message: parseResult.error.issues.map(i => i.message).join('; ') } });
    return;
  }

  try {
    const order = createOrder(parseResult.data);
    metrics.ordersPlaced++;
    res.status(201).json({ orderId: order.id, status: order.status, total: order.total, createdAt: order.createdAt });
  } catch (error) {
    console.error('Order create error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/:sessionId', (req, res) => {
  try {
    const orders = getOrdersBySession(req.params.sessionId);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.patch('/:orderId/status', (req, res) => {
  const { status } = req.body;
  const validStatuses = ['placed', 'preparing', 'ready', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: { code: 'INVALID_STATUS', message: `Status must be one of: ${validStatuses.join(', ')}` } });
    return;
  }

  try {
    const existing = getOrderById(req.params.orderId);
    if (!existing) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    updateOrderStatus(req.params.orderId, status);
    res.json({ orderId: req.params.orderId, status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
