/* ============================================
   Watchlist Module — Favorites with LocalStorage
   ============================================ */

const WATCHLIST_KEY = 'omdb_watchlist';

/**
 * Get watchlist from LocalStorage
 * @returns {Array<Object>}
 */
export function getWatchlist() {
  try {
    const data = localStorage.getItem(WATCHLIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save watchlist to LocalStorage
 * @param {Array<Object>} list
 */
function saveWatchlist(list) {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Could not save watchlist:', e);
  }
}

/**
 * Check if movie is in watchlist
 * @param {string} imdbId
 * @returns {boolean}
 */
export function isInWatchlist(imdbId) {
  return getWatchlist().some(m => m.imdbID === imdbId);
}

/**
 * Toggle movie in watchlist (add/remove)
 * @param {Object} movie - Movie object with at least { imdbID, Title, Year, Poster, Type }
 * @returns {boolean} - true if added, false if removed
 */
export function toggleWatchlist(movie) {
  const list = getWatchlist();
  const index = list.findIndex(m => m.imdbID === movie.imdbID);

  if (index > -1) {
    list.splice(index, 1);
    saveWatchlist(list);
    notifyWatchlistChange();
    return false;
  } else {
    list.push({
      imdbID: movie.imdbID,
      Title: movie.Title,
      Year: movie.Year,
      Poster: movie.Poster,
      Type: movie.Type,
      addedAt: Date.now()
    });
    saveWatchlist(list);
    notifyWatchlistChange();
    return true;
  }
}

/**
 * Remove from watchlist by ID
 * @param {string} imdbId
 */
export function removeFromWatchlist(imdbId) {
  const list = getWatchlist().filter(m => m.imdbID !== imdbId);
  saveWatchlist(list);
  notifyWatchlistChange();
}

/**
 * Get watchlist count
 * @returns {number}
 */
export function getWatchlistCount() {
  return getWatchlist().length;
}

/* ── Watchlist change listeners ── */
const watchlistListeners = [];

export function onWatchlistChange(callback) {
  watchlistListeners.push(callback);
  return () => {
    const i = watchlistListeners.indexOf(callback);
    if (i > -1) watchlistListeners.splice(i, 1);
  };
}

function notifyWatchlistChange() {
  const count = getWatchlistCount();
  watchlistListeners.forEach(fn => fn(count));
}
