/**
 * imageAnalyzer.js — Pixel-to-Price Mapping & Swing Detection
 * Maps pixel coordinates to actual price values using OCR results.
 */

/**
 * Build a linear price map from OCR-detected price labels.
 * @param {Array<{value: number, y: number}>} priceLabels - From OCR
 * @param {number} imageHeight - Total image height in pixels
 * @returns {{topPrice: number, bottomPrice: number, topY: number, bottomY: number, pixelsPerUnit: number}|null}
 */
export function buildPriceMap(priceLabels, imageHeight) {
    if (!priceLabels || priceLabels.length < 2) return null;

    const sorted = [...priceLabels].sort((a, b) => a.y - b.y);

    // Calculate pairwise pixels-per-unit (PPU) to filter out OCR hallucinations
    const pairs = [];
    for (let i = 0; i < sorted.length - 1; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
            const p1 = sorted[i];
            const p2 = sorted[j];
            const pixelDiff = p2.y - p1.y;
            // Higher Y pixel = lower price on charts
            const priceDiff = p1.value - p2.value;

            if (pixelDiff > 5 && priceDiff > 0) {
                pairs.push({
                    p1, p2,
                    ppu: pixelDiff / priceDiff
                });
            }
        }
    }

    if (pairs.length === 0) return null;

    // Sort by PPU and find the median (most reliable scale)
    pairs.sort((a, b) => a.ppu - b.ppu);
    const medianPair = pairs[Math.floor(pairs.length / 2)];

    // Filter labels that align closely with this median scale (5% tolerance)
    const validLabels = sorted.filter(p => {
        if (p === medianPair.p1 || p === medianPair.p2) return true;
        const expectedPrice = medianPair.p1.value - ((p.y - medianPair.p1.y) / medianPair.ppu);
        const error = Math.abs(expectedPrice - p.value) / p.value;
        return error < 0.05;
    });

    if (validLabels.length < 2) {
        // Fallback to exactly the median pair if filtering was too aggressive
        return {
            topPrice: medianPair.p1.value,
            bottomPrice: medianPair.p2.value,
            topY: medianPair.p1.y,
            bottomY: medianPair.p2.y,
            pixelsPerUnit: medianPair.ppu,
        };
    }

    // Retake the top and bottom from the strictly valid labels
    const topLabel = validLabels[0];
    const bottomLabel = validLabels[validLabels.length - 1];

    const pixelRange = bottomLabel.y - topLabel.y;
    const priceRange = topLabel.value - bottomLabel.value;

    return {
        topPrice: topLabel.value,
        bottomPrice: bottomLabel.value,
        topY: topLabel.y,
        bottomY: bottomLabel.y,
        pixelsPerUnit: pixelRange / priceRange,
    };
}

/**
 * Convert a Y pixel coordinate to a price value.
 * @param {number} pixelY
 * @param {object} priceMap - From buildPriceMap()
 * @returns {number}
 */
export function pixelToPrice(pixelY, priceMap) {
    if (!priceMap) return 0;
    const { topPrice, topY, pixelsPerUnit } = priceMap;
    return topPrice - (pixelY - topY) / pixelsPerUnit;
}

/**
 * Convert a price value to a Y pixel coordinate.
 * @param {number} price
 * @param {object} priceMap - From buildPriceMap()
 * @returns {number}
 */
export function priceToPixel(price, priceMap) {
    if (!priceMap) return 0;
    const { topPrice, topY, pixelsPerUnit } = priceMap;
    return topY + (topPrice - price) * pixelsPerUnit;
}

/**
 * Detect swing high and swing low from image data.
 * Looks for the highest and lowest candle bodies/wicks.
 *
 * @param {HTMLCanvasElement|HTMLImageElement} imageElement
 * @param {object} priceMap - From buildPriceMap()
 * @returns {{swingHigh: number, swingLow: number, currentPrice: number|null}}
 */
export function detectSwingPoints(imageElement, priceMap) {
    if (!priceMap) {
        return { swingHigh: null, swingLow: null, currentPrice: null };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgW = imageElement.naturalWidth || imageElement.width;
    const imgH = imageElement.naturalHeight || imageElement.height;

    canvas.width = imgW;
    canvas.height = imgH;
    ctx.drawImage(imageElement, 0, 0);

    // Analyze the chart area (exclude right 18% price scale and top 12% header)
    const chartLeft = Math.floor(imgW * 0.05);
    const chartRight = Math.floor(imgW * 0.82);
    const chartTop = Math.floor(imgH * 0.12);
    const chartBottom = Math.floor(imgH * 0.92);

    const imageData = ctx.getImageData(chartLeft, chartTop, chartRight - chartLeft, chartBottom - chartTop);
    const data = imageData.data;
    const w = chartRight - chartLeft;
    const h = chartBottom - chartTop;

    // Find green (bullish) and red (bearish) candle pixels
    let minY = h;
    let maxY = 0;

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 128) continue;

            // Detect candle colors (green/red) — exclude background
            const isGreen = g > 100 && g > r * 1.3 && g > b * 1.3;
            const isRed = r > 100 && r > g * 1.3 && r > b * 1.2;
            const isWhite = r > 200 && g > 200 && b > 200;

            if (isGreen || isRed || isWhite) {
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Convert pixel positions back to absolute coords
    const highPixelY = chartTop + minY;
    const lowPixelY = chartTop + maxY;

    const swingHigh = pixelToPrice(highPixelY, priceMap);
    const swingLow = pixelToPrice(lowPixelY, priceMap);

    // Detect current price (rightmost candle area)
    const currentPrice = detectCurrentPrice(ctx, imgW, imgH, chartBottom, priceMap);

    return {
        swingHigh: Math.max(swingHigh, swingLow),
        swingLow: Math.min(swingHigh, swingLow),
        currentPrice,
    };
}

/**
 * Detect the current price from the rightmost candle.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} imgW
 * @param {number} imgH
 * @param {number} chartBottom
 * @param {object} priceMap
 * @returns {number|null}
 */
function detectCurrentPrice(ctx, imgW, imgH, chartBottom, priceMap) {
    // Look at a narrow strip near the right edge (but before price scale)
    const stripX = Math.floor(imgW * 0.75);
    const stripWidth = Math.floor(imgW * 0.06);
    const stripTop = Math.floor(imgH * 0.12);
    const stripHeight = chartBottom - stripTop;

    const strip = ctx.getImageData(stripX, stripTop, stripWidth, stripHeight);
    const data = strip.data;

    // Find the vertical center of colored candle pixels in this strip
    let sumY = 0;
    let count = 0;

    for (let y = 0; y < stripHeight; y++) {
        for (let x = 0; x < stripWidth; x++) {
            const idx = (y * stripWidth + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const isGreen = g > 100 && g > r * 1.3;
            const isRed = r > 100 && r > g * 1.3;

            if (isGreen || isRed) {
                sumY += y;
                count++;
            }
        }
    }

    if (count === 0) return null;

    const avgY = stripTop + sumY / count;
    return pixelToPrice(avgY, priceMap);
}

/**
 * Fallback: create a simple price map from manual High/Low values.
 * @param {number} high
 * @param {number} low
 * @param {number} imageHeight
 * @returns {object}
 */
export function buildManualPriceMap(high, low, imageHeight) {
    const margin = Math.floor(imageHeight * 0.1);
    return {
        topPrice: high,
        bottomPrice: low,
        topY: margin,
        bottomY: imageHeight - margin,
        pixelsPerUnit: (imageHeight - 2 * margin) / (high - low),
    };
}
