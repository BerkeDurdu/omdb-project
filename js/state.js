/* ============================================
   State Management Module
   ============================================ */

const STORAGE_KEY = 'omdb_app_state';

/**
 * Default application state
 */
const defaultState = {
  query: '',
  type: '',
  year: '',
  page: 1,
  lastResults: null,
  totalResults: 0
};

/**
 * Current in-memory state
 */
let currentState = { ...defaultState };

/**
 * State change listeners
 */
const listeners = [];

/**
 * Subscribe to state changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  listeners.push(callback);
  return () => {
    const index = listeners.indexOf(callback);
    if (index > -1) listeners.splice(index, 1);
  };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  listeners.forEach(fn => fn(currentState));
}

/**
 * Get current state
 * @returns {Object}
 */
export function getState() {
  return { ...currentState };
}

/**
 * Update state and persist
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  currentState = { ...currentState, ...updates };
  saveToLocalStorage();
  updateUrlHash();
  notifyListeners();
}

/**
 * Reset state to defaults
 */
export function resetState() {
  currentState = { ...defaultState };
  saveToLocalStorage();
  updateUrlHash();
  notifyListeners();
}

/**
 * Save state to LocalStorage
 */
function saveToLocalStorage() {
  try {
    const stateToSave = {
      query: currentState.query,
      type: currentState.type,
      year: currentState.year,
      page: currentState.page,
      totalResults: currentState.totalResults
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    // localStorage might be unavailable or full
    console.warn('Could not save state to localStorage:', e);
  }
}

/**
 * Load state from LocalStorage
 * @returns {Object|null}
 */
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn('Could not load state from localStorage:', e);
    return null;
  }
}

/**
 * Update URL hash to reflect current state
 */
function updateUrlHash() {
  let hash = '';

  if (currentState.query) {
    hash = `search/${encodeURIComponent(currentState.query)}`;

    if (currentState.page > 1) {
      hash += `/page/${currentState.page}`;
    }
    if (currentState.type) {
      hash += `/type/${currentState.type}`;
    }
    if (currentState.year) {
      hash += `/year/${currentState.year}`;
    }
  }

  const newHash = hash ? `#${hash}` : '';
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash || window.location.pathname);
  }
}

/**
 * Parse URL hash into state
 * @returns {Object|null}
 */
export function parseUrlHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;

  // Parse: search/{query}/page/{n}/type/{type}/year/{year}
  const searchMatch = hash.match(/^search\/([^/]+)/);
  if (!searchMatch) {
    // Check for detail route
    const detailMatch = hash.match(/^detail\/([^/]+)/);
    if (detailMatch) {
      return { route: 'detail', imdbId: decodeURIComponent(detailMatch[1]) };
    }
    return null;
  }

  const result = {
    route: 'search',
    query: decodeURIComponent(searchMatch[1]),
    page: 1,
    type: '',
    year: ''
  };

  const pageMatch = hash.match(/page\/(\d+)/);
  if (pageMatch) result.page = parseInt(pageMatch[1], 10);

  const typeMatch = hash.match(/type\/(movie|series)/);
  if (typeMatch) result.type = typeMatch[1];

  const yearMatch = hash.match(/year\/(\d{4})/);
  if (yearMatch) result.year = yearMatch[1];

  return result;
}

/**
 * Set URL hash for movie detail
 * @param {string} imdbId
 */
export function setDetailHash(imdbId) {
  history.pushState(null, '', `#detail/${imdbId}`);
}

/**
 * Clear detail hash, restore search hash
 */
export function clearDetailHash() {
  updateUrlHash();
}

/**
 * Initialize state from URL hash or LocalStorage
 * @returns {Object} Initial state
 */
export function initializeState() {
  // Priority: URL hash > LocalStorage
  const hashState = parseUrlHash();

  if (hashState && hashState.route === 'search') {
    currentState = {
      ...defaultState,
      query: hashState.query,
      page: hashState.page,
      type: hashState.type,
      year: hashState.year
    };
    saveToLocalStorage();
    return { ...currentState, source: 'url' };
  }

  if (hashState && hashState.route === 'detail') {
    // Load search state from localStorage but also return detail info
    const saved = loadFromLocalStorage();
    if (saved) {
      currentState = { ...defaultState, ...saved };
    }
    return { ...currentState, source: 'url', route: 'detail', imdbId: hashState.imdbId };
  }

  // Fall back to localStorage
  const saved = loadFromLocalStorage();
  if (saved && saved.query) {
    currentState = { ...defaultState, ...saved };
    updateUrlHash();
    return { ...currentState, source: 'localStorage' };
  }

  return { ...defaultState, source: 'none' };
}
