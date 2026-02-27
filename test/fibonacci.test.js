/**
 * fibonacci.test.js — Unit Tests for Fibonacci Math Engine
 */

import { describe, it, expect } from 'vitest';
import {
    calculateFibonacciLevels,
    findNearestLevel,
    findNextTarget,
    determineTrend,
    FIB_RATIOS,
} from '../src/core/fibonacci.js';

describe('calculateFibonacciLevels', () => {
    it('should calculate uptrend retracement levels correctly', () => {
        const levels = calculateFibonacciLevels(69000, 15000, 'uptrend');

        expect(levels).toHaveLength(7);

        // Level 0 = Swing High
        expect(levels[0].level).toBe(0);
        expect(levels[0].price).toBe(69000);

        // Level 1 = Swing Low
        expect(levels[6].level).toBe(1);
        expect(levels[6].price).toBe(15000);

        // Level 0.236
        // price = 69000 - (69000 - 15000) * 0.236 = 69000 - 12744 = 56256
        expect(levels[1].level).toBe(0.236);
        expect(levels[1].price).toBeCloseTo(56256, 0);

        // Level 0.382
        // price = 69000 - 54000 * 0.382 = 69000 - 20628 = 48372
        expect(levels[2].level).toBe(0.382);
        expect(levels[2].price).toBeCloseTo(48372, 0);

        // Level 0.5
        // price = 69000 - 54000 * 0.5 = 42000
        expect(levels[3].level).toBe(0.5);
        expect(levels[3].price).toBe(42000);

        // Level 0.618
        // price = 69000 - 54000 * 0.618 = 69000 - 33372 = 35628
        expect(levels[4].level).toBe(0.618);
        expect(levels[4].price).toBeCloseTo(35628, 0);
        expect(levels[4].isGoldenPocket).toBe(true);

        // Level 0.786
        // price = 69000 - 54000 * 0.786 = 69000 - 42444 = 26556
        expect(levels[5].level).toBe(0.786);
        expect(levels[5].price).toBeCloseTo(26556, 0);
    });

    it('should calculate downtrend retracement levels correctly', () => {
        const levels = calculateFibonacciLevels(69000, 15000, 'downtrend');

        // Level 0 = Swing Low (start of downtrend retracement)
        expect(levels[0].level).toBe(0);
        expect(levels[0].price).toBe(15000);

        // Level 0.5 = midpoint
        expect(levels[3].price).toBe(42000);

        // Level 1 = Swing High
        expect(levels[6].price).toBe(69000);
    });

    it('should mark only 0.618 as golden pocket', () => {
        const levels = calculateFibonacciLevels(100, 0, 'uptrend');
        const goldenPockets = levels.filter((l) => l.isGoldenPocket);
        expect(goldenPockets).toHaveLength(1);
        expect(goldenPockets[0].level).toBe(0.618);
    });

    it('should handle edge case: high equals low', () => {
        const levels = calculateFibonacciLevels(50000, 50000, 'uptrend');
        expect(levels).toHaveLength(7);
        // All prices should be the same
        for (const level of levels) {
            expect(level.price).toBe(50000);
        }
    });

    it('should have correct labels for all levels', () => {
        const levels = calculateFibonacciLevels(100, 0, 'uptrend');
        expect(levels[0].label).toBe('0%');
        expect(levels[1].label).toBe('23.6%');
        expect(levels[2].label).toBe('38.2%');
        expect(levels[3].label).toBe('50%');
        expect(levels[4].label).toBe('61.8%');
        expect(levels[5].label).toBe('78.6%');
        expect(levels[6].label).toBe('100%');
    });

    it('should handle small decimal prices (forex-like)', () => {
        const levels = calculateFibonacciLevels(1.1500, 1.0500, 'uptrend');
        expect(levels[3].price).toBeCloseTo(1.1, 4); // 50% = midpoint
    });
});

describe('findNearestLevel', () => {
    const levels = calculateFibonacciLevels(69000, 15000, 'uptrend');

    it('should find the nearest level below current price', () => {
        const nearest = findNearestLevel(43000, levels);
        expect(nearest.level).toBe(0.5);
        expect(nearest.price).toBe(42000);
        expect(nearest.isAbove).toBe(true);
    });

    it('should find exact match', () => {
        const nearest = findNearestLevel(42000, levels);
        expect(nearest.level).toBe(0.5);
        expect(nearest.distance).toBe(0);
    });

    it('should find nearest at extreme high', () => {
        const nearest = findNearestLevel(70000, levels);
        expect(nearest.level).toBe(0);
        expect(nearest.isAbove).toBe(true);
    });

    it('should find nearest at extreme low', () => {
        const nearest = findNearestLevel(10000, levels);
        expect(nearest.level).toBe(1);
        expect(nearest.isAbove).toBe(false);
    });
});

describe('findNextTarget', () => {
    const levels = calculateFibonacciLevels(69000, 15000, 'uptrend');

    it('should find next support target below current price', () => {
        const target = findNextTarget(43000, levels, 'support');
        expect(target).not.toBeNull();
        expect(target.price).toBe(42000); // 0.5 level
    });

    it('should find next resistance target above current price', () => {
        const target = findNextTarget(43000, levels, 'resistance');
        expect(target).not.toBeNull();
        expect(target.price).toBeCloseTo(48372, 0); // 0.382 level
    });
});

describe('determineTrend', () => {
    it('should return uptrend when price is above midpoint', () => {
        expect(determineTrend(69000, 15000, 50000)).toBe('uptrend');
    });

    it('should return downtrend when price is below midpoint', () => {
        expect(determineTrend(69000, 15000, 30000)).toBe('downtrend');
    });

    it('should return uptrend when price is at midpoint', () => {
        expect(determineTrend(69000, 15000, 42000)).toBe('uptrend');
    });
});
