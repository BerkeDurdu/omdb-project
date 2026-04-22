/* ============================================
   Utility Functions
   ============================================ */

/**
 * Debounce a function call
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string}
 */
export function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create DOM element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Attributes object
 * @param  {...(string|Node)} children - Child nodes or text
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([k, v]) => {
        el.dataset[k] = v;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value);
    }
  }

  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      el.appendChild(child);
    }
  });

  return el;
}

/**
 * Format number with commas
 * @param {string|number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return Number(num).toLocaleString();
}

/**
 * Check if a poster URL is valid (not N/A)
 * @param {string} posterUrl
 * @returns {boolean}
 */
export function isValidPoster(posterUrl) {
  return posterUrl && posterUrl !== 'N/A' && posterUrl.startsWith('http');
}

/**
 * Truncate text to specified length
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate unique ID
 * @returns {string}
 */
export function generateId() {
  return '_' + Math.random().toString(36).slice(2, 11);
}
