/* ============================================
   OMDB API Service Module
   ============================================ */

const API_KEY = 'dd9a6b47';
const BASE_URL = 'https://www.omdbapi.com/';

// In-memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Active request controller
let activeController = null;

/**
 * Build URL with query parameters
 * @param {Object} params
 * @returns {string}
 */
function buildUrl(params) {
  const url = new URL(BASE_URL);
  url.searchParams.set('apikey', API_KEY);
  url.searchParams.set('r', 'json');

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

/**
 * Generate cache key from params
 * @param {Object} params
 * @returns {string}
 */
function getCacheKey(params) {
  return JSON.stringify(params);
}

/**
 * Check if cache entry is still valid
 * @param {string} key
 * @returns {Object|null}
 */
function getFromCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store data in cache
 * @param {string} key
 * @param {Object} data
 */
function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });

  // Limit cache size
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * Make API request with caching and abort support
 * @param {Object} params - Query parameters
 * @param {boolean} cancelPrevious - Whether to cancel previous request
 * @returns {Promise<Object>}
 */
async function apiRequest(params, cancelPrevious = true) {
  const cacheKey = getCacheKey(params);
  const cached = getFromCache(cacheKey);

  if (cached) {
    return cached;
  }

  // Cancel previous request if needed
  if (cancelPrevious && activeController) {
    activeController.abort();
  }

  activeController = new AbortController();
  const { signal } = activeController;

  const url = buildUrl(params);

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.Response === 'False') {
      throw new ApiError(data.Error || 'Unknown API error', 'API_ERROR');
    }

    // Cache successful responses
    setCache(cacheKey, data);

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request cancelled', 'ABORT');
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Network error. Please check your connection.',
      'NETWORK_ERROR'
    );
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/**
 * Search movies by query
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {string} [options.type] - 'movie' or 'series'
 * @param {string|number} [options.year] - Year of release
 * @param {number} [options.page=1] - Page number
 * @returns {Promise<{movies: Array, totalResults: number}>}
 */
export async function searchMovies(query, options = {}) {
  const params = {
    s: query.trim(),
    type: options.type || undefined,
    y: options.year || undefined,
    page: options.page || 1
  };

  const data = await apiRequest(params);

  return {
    movies: data.Search || [],
    totalResults: parseInt(data.totalResults, 10) || 0
  };
}

/**
 * Get detailed movie information by IMDb ID
 * @param {string} imdbId - IMDb ID (e.g., 'tt1234567')
 * @returns {Promise<Object>}
 */
export async function getMovieDetail(imdbId) {
  const params = {
    i: imdbId,
    plot: 'full'
  };

  return apiRequest(params, false);
}

/**
 * Get movie by exact title
 * @param {string} title - Movie title
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export async function getMovieByTitle(title, options = {}) {
  const params = {
    t: title.trim(),
    type: options.type || undefined,
    y: options.year || undefined,
    plot: options.plot || 'full'
  };

  return apiRequest(params, false);
}
