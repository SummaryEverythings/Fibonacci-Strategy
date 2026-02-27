/**
 * helpers.js — Utility functions
 */

/**
 * Format a price number for display.
 * @param {number} price
 * @param {'crypto'|'forex'|'saham'} assetType
 * @returns {string}
 */
export function formatPrice(price, assetType = 'crypto') {
    if (price == null || isNaN(price)) return '—';

    if (assetType === 'forex') {
        return price.toFixed(5);
    }

    if (assetType === 'saham') {
        return `Rp ${Math.round(price).toLocaleString('id-ID')}`;
    }

    // Crypto / default
    if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (price >= 1) {
        return `$${price.toFixed(4)}`;
    }
    return `$${price.toFixed(8)}`;
}

/**
 * Create a DOM element with optional class, attributes, and children.
 * @param {string} tag
 * @param {object} options
 * @returns {HTMLElement}
 */
export function el(tag, { cls, attrs, text, html, children } = {}) {
    const element = document.createElement(tag);

    if (cls) {
        const classes = Array.isArray(cls) ? cls : cls.split(' ');
        element.classList.add(...classes.filter(Boolean));
    }

    if (attrs) {
        for (const [key, val] of Object.entries(attrs)) {
            element.setAttribute(key, val);
        }
    }

    if (text) element.textContent = text;
    if (html) element.innerHTML = html;

    if (children) {
        for (const child of children) {
            if (child) element.appendChild(child);
        }
    }

    return element;
}

/**
 * Show an element by removing .hidden class.
 * @param {HTMLElement} element
 */
export function show(element) {
    if (element) element.classList.remove('hidden');
}

/**
 * Hide an element by adding .hidden class.
 * @param {HTMLElement} element
 */
export function hide(element) {
    if (element) element.classList.add('hidden');
}

/**
 * Debounce a function.
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Wait for ms.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

/**
 * Typing animation effect for text.
 * @param {HTMLElement} element
 * @param {string} text
 * @param {number} speed - ms per character
 * @returns {Promise<void>}
 */
export async function typeText(element, text, speed = 18) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text[i];
        await sleep(speed);
    }
}
