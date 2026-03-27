import { Router, Request, Response } from 'express';
import Order from '../models/Order';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const orders = await Order.find();

        const totalOrders = orders.length;
        let totalCompleted = 0;
        let sumCycleTimeMs = 0;

        const statusCounts = {
            'Planned': 0,
            'In Progress': 0,
            'On Hold': 0,
            'Completed': 0
        };

        const workCenterStuck: Record<string, number> = {};
        let completedToday = 0;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        for (const order of orders) {
            statusCounts[order.status as keyof typeof statusCounts]++;

            if (order.status === 'Completed' && order.endTime && order.startTime) {
                totalCompleted++;
                sumCycleTimeMs += order.endTime.getTime() - order.startTime.getTime();

                if (order.endTime >= startOfToday) {
                    completedToday++;
                }
            }

            if (order.status === 'In Progress' || order.status === 'On Hold') {
                const wc = order.workStation;
                workCenterStuck[wc] = (workCenterStuck[wc] || 0) + 1;
            }
        }

        let bottleneck = 'None';
        let maxStuck = -1;
        for (const [wc, count] of Object.entries(workCenterStuck)) {
            if (count > maxStuck) {
                maxStuck = count;
                bottleneck = wc;
            }
        }

        const avgCycleTimeHours = totalCompleted > 0
            ? (sumCycleTimeMs / totalCompleted / (1000 * 60 * 60)).toFixed(2)
            : 0;

        res.status(200).json({
            totalOrders,
            statusCounts,
            avgCycleTimeHours,
            bottleneck: maxStuck > 0 ? bottleneck : 'None',
            throughputToday: completedToday
        });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
