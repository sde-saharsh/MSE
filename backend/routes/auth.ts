import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role } = req.body;
        let user = await User.findOne({ username });
        if (user) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, password: hashedPassword, role });
        await user.save();

        const payload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback', { expiresIn: '1d' });

        res.status(201).json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }

        const payload = { id: user.id, username: user.username, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback', { expiresIn: '1d' });

        res.status(200).json({ token, role: user.role, username: user.username });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
});

export default router;
