import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const requireAuth = async (req, res, next) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (!session) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        req.user = session.user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
