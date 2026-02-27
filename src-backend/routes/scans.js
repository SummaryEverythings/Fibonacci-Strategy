import express from 'express';
import { requireAuth } from '../middlewares/requireAuth.js';
import { scanService } from '../services/scanService.js';

const router = express.Router();

// Apply auth middleware to all scan routes
router.use(requireAuth);

// Create a new scan
router.post('/', async (req, res) => {
    try {
        const scan = await scanService.createScan(req.user.id, req.body);
        res.status(201).json(scan);
    } catch (error) {
        console.error('Error creating scan:', error);
        res.status(500).json({ error: 'Failed to create scan' });
    }
});

// Get all scans for the current user
router.get('/', async (req, res) => {
    try {
        const scans = await scanService.getUserScans(req.user.id);
        res.json(scans);
    } catch (error) {
        console.error('Error fetching scans:', error);
        res.status(500).json({ error: 'Failed to fetch scans' });
    }
});

// Get a specific scan
router.get('/:id', async (req, res) => {
    try {
        const scan = await scanService.getScanById(req.params.id, req.user.id);
        if (!scan) {
            return res.status(404).json({ error: 'Scan not found' });
        }
        res.json(scan);
    } catch (error) {
        console.error('Error fetching scan:', error);
        res.status(500).json({ error: 'Failed to fetch scan' });
    }
});

// Delete a specific scan
router.delete('/:id', async (req, res) => {
    try {
        const deletedScan = await scanService.deleteScan(req.params.id, req.user.id);
        if (!deletedScan) {
            return res.status(404).json({ error: 'Scan not found' });
        }
        res.json({ message: 'Scan deleted successfully' });
    } catch (error) {
        console.error('Error deleting scan:', error);
        res.status(500).json({ error: 'Failed to delete scan' });
    }
});

export default router;
