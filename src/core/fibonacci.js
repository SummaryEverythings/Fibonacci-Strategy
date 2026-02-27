/**
 * fibonacci.js — Pure Fibonacci Math Engine
 * Zero dependencies, pure calculations.
 */

/** Standard Fibonacci retracement ratios */
const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

/** Human-readable labels for each ratio */
const FIB_LABELS = {
    0: '0%',
    0.236: '23.6%',
    0.382: '38.2%',
    0.5: '50%',
    0.618: '61.8%',
    0.786: '78.6%',
    1: '100%',
};

/**
 * Calculate Fibonacci retracement levels.
 * @param {number} swingHigh - The swing high price
 * @param {number} swingLow - The swing low price
 * @param {'uptrend'|'downtrend'} direction - Market direction
 * @returns {Array<{level: number, label: string, price: number, isGoldenPocket: boolean}>}
 */
export function calculateFibonacciLevels(swingHigh, swingLow, direction = 'uptrend') {
    const diff = swingHigh - swingLow;

    if (diff <= 0) {
        return FIB_RATIOS.map((ratio) => ({
            level: ratio,
            label: FIB_LABELS[ratio],
            price: swingHigh,
            isGoldenPocket: ratio === 0.618,
        }));
    }

    return FIB_RATIOS.map((ratio) => {
        let price;
        if (direction === 'uptrend') {
            // Retracement dari atas ke bawah
            price = swingHigh - diff * ratio;
        } else {
            // Retracement dari bawah ke atas
            price = swingLow + diff * ratio;
        }

        return {
            level: ratio,
            label: FIB_LABELS[ratio],
            price: roundPrice(price, swingHigh),
            isGoldenPocket: ratio === 0.618,
        };
    });
}

/**
 * Find the nearest Fibonacci level to a given price.
 * @param {number} currentPrice
 * @param {Array<{level: number, price: number}>} levels
 * @returns {{level: number, label: string, price: number, distance: number, isAbove: boolean}}
 */
export function findNearestLevel(currentPrice, levels) {
    let nearest = null;
    let minDist = Infinity;

    for (const lvl of levels) {
        const dist = Math.abs(currentPrice - lvl.price);
        if (dist < minDist) {
            minDist = dist;
            nearest = lvl;
        }
    }

    return {
        ...nearest,
        distance: minDist,
        isAbove: currentPrice >= nearest.price,
    };
}

/**
 * Find the next target level (the one below or above current price).
 * @param {number} currentPrice
 * @param {Array<{level: number, price: number}>} levels
 * @param {'support'|'resistance'} direction - Look for next support or resistance
 * @returns {{level: number, label: string, price: number}|null}
 */
export function findNextTarget(currentPrice, levels, direction = 'support') {
    const sorted = [...levels].sort((a, b) => b.price - a.price);

    if (direction === 'support') {
        // Next level BELOW current price
        return sorted.find((l) => l.price < currentPrice) || null;
    } else {
        // Next level ABOVE current price
        return [...sorted].reverse().find((l) => l.price > currentPrice) || null;
    }
}

/**
 * Determine overall trend based on current price position.
 * @param {number} swingHigh
 * @param {number} swingLow
 * @param {number} currentPrice
 * @returns {'uptrend'|'downtrend'}
 */
export function determineTrend(swingHigh, swingLow, currentPrice) {
    const mid = (swingHigh + swingLow) / 2;
    return currentPrice >= mid ? 'uptrend' : 'downtrend';
}

/**
 * Round price intelligently based on the magnitude.
 * @param {number} price
 * @param {number} reference - Reference price to determine decimal places
 * @returns {number}
 */
function roundPrice(price, reference) {
    if (reference >= 10000) return Math.round(price * 100) / 100;
    if (reference >= 100) return Math.round(price * 100) / 100;
    if (reference >= 1) return Math.round(price * 10000) / 10000;
    return Math.round(price * 100000000) / 100000000; // For sub-$1 assets
}

export { FIB_RATIOS, FIB_LABELS };
