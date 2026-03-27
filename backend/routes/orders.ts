import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import { authMiddleware, restrictTo } from '../middleware/authMiddleware';

const router = Router();

// Validate transition
const isValidTransition = (current: string, next: string): boolean => {
    const rules: Record<string, string[]> = {
        'Planned': ['In Progress'],
        'In Progress': ['On Hold', 'Completed'],
        'On Hold': ['In Progress'],
        'Completed': []
    };
    return rules[current]?.includes(next) || false;
};

// Get all orders
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Create order (Only supervisors)
router.post('/', authMiddleware, restrictTo(['supervisor']), async (req: Request, res: Response) => {
    try {
        const newOrder = new Order({
            ...req.body,
            status: 'Planned'
        });
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

// Update order status
router.patch('/:id/status', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            res.status(404).json({ message: 'Order not found' });
            return;
        }

        // Check state machine
        if (!isValidTransition(order.status, status)) {
            res.status(400).json({ message: `Invalid state transition from ${order.status} to ${status}` });
            return;
        }

        order.status = status;

        // Time tracking
        if (status === 'In Progress' && !order.startTime) {
            order.startTime = new Date();
        }
        if (status === 'Completed') {
            order.endTime = new Date();
        }

        const updatedOrder = await order.save();
        res.status(200).json(updatedOrder);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
