/**
 * ocr.js — Tesseract.js OCR Wrapper
 * Extracts price scale and asset name from chart screenshots.
 */

import Tesseract from 'tesseract.js';

let worker = null;

/**
 * Initialize Tesseract worker.
 * @param {function} onProgress - Progress callback (0-1)
 */
export async function initOCR(onProgress = () => { }) {
    if (worker) return worker;

    worker = await Tesseract.createWorker('eng', 1, {
        logger: (m) => {
            if (m.status === 'recognizing text' && m.progress) {
                onProgress(m.progress);
            }
        },
    });

    return worker;
}

/**
 * Terminate the OCR worker.
 */
export async function terminateOCR() {
    if (worker) {
        await worker.terminate();
        worker = null;
    }
}

/**
 * Extract price labels from the Y-axis (right side) of a chart image.
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement
 * @param {function} onProgress
 * @returns {Promise<Array<{value: number, y: number}>>} - Prices and their pixel Y positions
 */
export async function extractPriceScale(imageElement, onProgress = () => { }) {
    await initOCR(onProgress);

    // Crop the right ~18% of the image (price scale region)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgWidth = imageElement.naturalWidth || imageElement.width;
    const imgHeight = imageElement.naturalHeight || imageElement.height;

    const cropX = Math.floor(imgWidth * 0.82);
    const cropWidth = imgWidth - cropX;

    canvas.width = cropWidth;
    canvas.height = imgHeight;

    ctx.drawImage(imageElement, cropX, 0, cropWidth, imgHeight, 0, 0, cropWidth, imgHeight);

    // Preprocess: enhance contrast
    preprocessImage(ctx, cropWidth, imgHeight);

    const result = await worker.recognize(canvas);

    // Parse recognized text into price values with Y positions
    const prices = parsePriceText(result, imgHeight, cropWidth);

    return prices;
}

/**
 * Extract asset name/ticker from the top region of a chart.
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement
 * @param {function} onProgress
 * @returns {Promise<{name: string, type: 'crypto'|'forex'|'saham', confidence: number}>}
 */
export async function extractAssetName(imageElement, onProgress = () => { }) {
    await initOCR(onProgress);

    // Crop the top ~12% of the image (header region)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgWidth = imageElement.naturalWidth || imageElement.width;
    const imgHeight = imageElement.naturalHeight || imageElement.height;

    const cropHeight = Math.floor(imgHeight * 0.12);

    canvas.width = imgWidth;
    canvas.height = cropHeight;

    ctx.drawImage(imageElement, 0, 0, imgWidth, cropHeight, 0, 0, imgWidth, cropHeight);
    preprocessImage(ctx, imgWidth, cropHeight);

    const result = await worker.recognize(canvas);
    const text = result.data.text.toUpperCase();

    return detectAssetType(text, result.data.confidence);
}

/**
 * Preprocess image for better OCR accuracy.
 * Converts to grayscale, enhances contrast, applies threshold.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 */
function preprocessImage(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Enhance contrast
        const enhanced = gray < 128 ? gray * 0.5 : 128 + (gray - 128) * 1.5;

        // Threshold
        const val = enhanced > 140 ? 255 : 0;

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }

    ctx.putImageData(imageData, 0, 0);
}

/**
 * Parse OCR text result into price/position pairs.
 * @param {object} result - Tesseract result
 * @param {number} imgHeight
 * @param {number} cropWidth
 * @returns {Array<{value: number, y: number}>}
 */
function parsePriceText(result, imgHeight, cropWidth) {
    const prices = [];

    // Use lines to avoid splitting "65 800.0" into separate words
    if (!result.data.lines) return prices;

    for (const line of result.data.lines) {
        // Clean the text: keep numbers, dots, commas, minus, and space
        let text = line.text.replace(/[^0-9., \-]/g, '').trim();

        // Remove spaces inside numbers: "65 800.0" -> "65800.0"
        text = text.replace(/\s+/g, '');
        if (!text) continue;

        // Strip commas assuming they are thousands separators
        text = text.replace(/,/g, '');

        // Handle multiple dots (e.g. Tesseract misreading a comma as a dot: "65.800.0")
        const lastDotIndex = text.lastIndexOf('.');
        if (lastDotIndex !== -1) {
            const before = text.substring(0, lastDotIndex).replace(/\./g, '');
            const after = text.substring(lastDotIndex + 1);
            text = before + '.' + after;
        }

        // Try to parse as float
        const value = parseFloat(text);

        if (!isNaN(value) && value !== 0) {
            // Use the vertical center of the line bounding box
            const bbox = line.bbox;
            const y = Math.round((bbox.y0 + bbox.y1) / 2);
            prices.push({ value: Math.abs(value), y });
        }
    }

    // Sort by Y position (top to bottom)
    prices.sort((a, b) => a.y - b.y);

    // Remove duplicates (clustered within 5px)
    const deduped = [];
    for (const p of prices) {
        const exists = deduped.some((d) => Math.abs(d.y - p.y) < 5);
        if (!exists) deduped.push(p);
    }

    return deduped;
}

/**
 * Detect asset type from OCR text.
 * @param {string} text - Uppercase text from chart header
 * @param {number} confidence - OCR confidence score
 * @returns {{name: string, type: 'crypto'|'forex'|'saham', confidence: number}}
 */
function detectAssetType(text, confidence) {
    // Crypto patterns
    const cryptoPatterns = [
        { pattern: /BTC|BITCOIN/i, name: 'BTC' },
        { pattern: /ETH|ETHEREUM/i, name: 'ETH' },
        { pattern: /BNB|BINANCE/i, name: 'BNB' },
        { pattern: /SOL|SOLANA/i, name: 'SOL' },
        { pattern: /XRP|RIPPLE/i, name: 'XRP' },
        { pattern: /ADA|CARDANO/i, name: 'ADA' },
        { pattern: /DOGE/i, name: 'DOGE' },
        { pattern: /USDT|USDC|BUSD/i, name: 'STABLECOIN' },
        { pattern: /PERP|SWAP|FUTURES/i, name: 'CRYPTO' },
    ];

    // Forex patterns
    const forexPatterns = [
        { pattern: /EUR\/?USD/i, name: 'EUR/USD' },
        { pattern: /GBP\/?USD/i, name: 'GBP/USD' },
        { pattern: /USD\/?JPY/i, name: 'USD/JPY' },
        { pattern: /AUD\/?USD/i, name: 'AUD/USD' },
        { pattern: /USD\/?CHF/i, name: 'USD/CHF' },
        { pattern: /USD\/?CAD/i, name: 'USD/CAD' },
        { pattern: /XAU\/?USD|GOLD/i, name: 'XAU/USD' },
        { pattern: /NZD|CHF|NOK|SEK/i, name: 'FOREX' },
    ];

    // Indonesian stock patterns
    const sahamPatterns = [
        { pattern: /BBCA|BBRI|BMRI|BBNI/i, name: text.match(/BB[A-Z]{2}|BM[A-Z]{2}/)?.[0] || 'SAHAM' },
        { pattern: /TLKM|ASII|UNVR|HMSP/i, name: text.match(/[A-Z]{4}/)?.[0] || 'SAHAM' },
        { pattern: /IHSG|IDX|COMPOSITE/i, name: 'IHSG' },
        { pattern: /\.JK|JAKARTA/i, name: 'SAHAM' },
    ];

    for (const { pattern, name } of cryptoPatterns) {
        if (pattern.test(text)) return { name, type: 'crypto', confidence };
    }

    for (const { pattern, name } of forexPatterns) {
        if (pattern.test(text)) return { name, type: 'forex', confidence };
    }

    for (const { pattern, name } of sahamPatterns) {
        if (pattern.test(text)) return { name, type: 'saham', confidence };
    }

    // Default: try to guess from price range later
    return { name: 'UNKNOWN', type: 'crypto', confidence: 0 };
}
