/**
 * insight.js — Contextual Trading Recommendation Engine
 * Generates narrative insights based on Fibonacci levels and current price.
 */

import { findNearestLevel, findNextTarget } from './fibonacci.js';

/**
 * Generate a contextual trading insight.
 * @param {number} currentPrice
 * @param {Array<{level: number, label: string, price: number, isGoldenPocket: boolean}>} fibLevels
 * @param {'crypto'|'forex'|'saham'} assetType
 * @param {number} swingHigh
 * @param {number} swingLow
 * @returns {object} insight object
 */
export function generateInsight(currentPrice, fibLevels, assetType = 'crypto', swingHigh, swingLow) {
    if (!currentPrice || !fibLevels || fibLevels.length === 0) {
        return {
            zone: 'unknown',
            nearestLevel: null,
            nextTarget: null,
            narrative: 'Data tidak mencukupi untuk menghasilkan insight.',
            sentiment: 'neutral',
        };
    }

    const nearest = findNearestLevel(currentPrice, fibLevels);
    const nextSupport = findNextTarget(currentPrice, fibLevels, 'support');
    const nextResistance = findNextTarget(currentPrice, fibLevels, 'resistance');

    // Determine zone
    const zone = determineZone(currentPrice, nearest, fibLevels);

    // Determine sentiment
    const sentiment = determineSentiment(currentPrice, swingHigh, swingLow, nearest);

    // Generate narrative
    const narrative = buildNarrative(currentPrice, nearest, nextSupport, nextResistance, zone, sentiment, assetType);

    return {
        zone,
        sentiment,
        nearestLevel: nearest,
        nextTarget: sentiment === 'bearish' ? nextSupport : nextResistance,
        nextSupport,
        nextResistance,
        narrative,
    };
}

/**
 * Determine what zone the current price is in.
 */
function determineZone(currentPrice, nearest, fibLevels) {
    if (!nearest) return 'unknown';

    // Golden pocket zone (near 0.618)
    const goldenPocket = fibLevels.find((l) => l.isGoldenPocket);
    if (goldenPocket) {
        const gpDistance = Math.abs(currentPrice - goldenPocket.price);
        const totalRange = Math.abs(fibLevels[0].price - fibLevels[fibLevels.length - 1].price);
        if (totalRange > 0 && gpDistance / totalRange < 0.03) {
            return 'golden_pocket';
        }
    }

    // Determine if price is near support or resistance
    if (nearest.level >= 0.618) {
        return 'support';
    } else if (nearest.level <= 0.382) {
        return 'resistance';
    }

    return nearest.isAbove ? 'resistance' : 'support';
}

/**
 * Determine market sentiment.
 */
function determineSentiment(currentPrice, swingHigh, swingLow, nearest) {
    if (!swingHigh || !swingLow) return 'neutral';

    const range = swingHigh - swingLow;
    const position = (currentPrice - swingLow) / range; // 0 = at low, 1 = at high

    if (position > 0.65) return 'bullish';
    if (position < 0.35) return 'bearish';
    return 'neutral';
}

/**
 * Build a human-readable narrative in Indonesian.
 */
function buildNarrative(currentPrice, nearest, nextSupport, nextResistance, zone, sentiment, assetType) {
    const formatPrice = (p) => {
        if (!p) return '—';
        if (assetType === 'crypto' && p >= 1000) return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (assetType === 'forex') return p.toFixed(5);
        if (assetType === 'saham') return `Rp ${p.toLocaleString('id-ID')}`;
        return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const assetLabel = assetType === 'crypto' ? 'aset kripto' : assetType === 'forex' ? 'pair forex' : 'saham';
    const timeframe = assetType === 'crypto' ? '4H' : assetType === 'forex' ? '1H' : 'Daily';

    let narrative = '';

    // Opening
    narrative += `Harga ${assetLabel} ini saat ini berada di ${formatPrice(currentPrice)}. `;

    // Zone analysis
    if (zone === 'golden_pocket') {
        narrative += `⚡ Harga berada tepat di GOLDEN POCKET (level ${nearest.label} = ${formatPrice(nearest.price)}). `;
        narrative += `Ini adalah zona pantulan paling kuat dalam Fibonacci retracement. `;

        if (sentiment === 'bullish') {
            narrative += `Jika harga bertahan di atas level ini, potensi kenaikan menuju `;
            narrative += nextResistance ? `${nextResistance.label} (${formatPrice(nextResistance.price)}) cukup tinggi.` : 'level resistance berikutnya cukup tinggi.';
        } else {
            narrative += `Jika candle ${timeframe} ditutup di bawah level ini, `;
            narrative += nextSupport ? `target selanjutnya adalah ${nextSupport.label} (${formatPrice(nextSupport.price)}).` : 'waspadai penurunan lebih lanjut.';
        }
    } else if (zone === 'support') {
        narrative += `Harga saat ini tertahan di area support level ${nearest.label} (${formatPrice(nearest.price)}). `;

        if (sentiment === 'bearish') {
            narrative += `Jika candle ${timeframe} ditutup di bawah level ini, `;
            narrative += nextSupport ? `target selanjutnya adalah ${nextSupport.label} (${formatPrice(nextSupport.price)}).` : 'waspadai penurunan lebih lanjut.';
        } else {
            narrative += `Terdapat potensi pantulan dari area ini. `;
            narrative += nextResistance ? `Target resistance terdekat: ${nextResistance.label} (${formatPrice(nextResistance.price)}).` : '';
        }
    } else if (zone === 'resistance') {
        narrative += `Harga mendekati area resistance di level ${nearest.label} (${formatPrice(nearest.price)}). `;

        if (sentiment === 'bullish') {
            narrative += `Jika berhasil breakout di atas level ini, `;
            narrative += nextResistance ? `target selanjutnya ${nextResistance.label} (${formatPrice(nextResistance.price)}).` : 'potensi kenaikan terbuka.';
        } else {
            narrative += `Waspadai rejection di area ini. `;
            narrative += nextSupport ? `Support terdekat: ${nextSupport.label} (${formatPrice(nextSupport.price)}).` : '';
        }
    } else {
        narrative += `Harga berada di antara level ${nearest.label} (${formatPrice(nearest.price)}). `;
        narrative += 'Perhatikan reaksi harga di level-level Fibonacci terdekat.';
    }

    return narrative;
}
