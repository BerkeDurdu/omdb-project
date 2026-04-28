/* ============================================
   App Entry Point — OMDB Movie Search SPA
   ============================================ */

import { initializeState, parseUrlHash } from './state.js';
import { initSearch, performSearch, showWelcome } from './search.js';
import { initDetail, openDetail } from './detail.js';
import { getWatchlist, getWatchlistCount, onWatchlistChange, removeFromWatchlist, isInWatchlist } from './watchlist.js';
import { icons } from './ui.js';
import { isValidPoster, sanitize } from './utils.js';

/**
 * Boot the application
 */
function boot() {
  // Initialize modules
  initSearch();
  initDetail();
  initThemeToggle();
  initWatchlistPanel();

  // Restore state from URL hash or LocalStorage
  const initialState = initializeState();

  if (initialState.route === 'detail' && initialState.imdbId) {
    // Open detail modal and also restore search results if available
    if (initialState.query) {
      performSearch(initialState.query, initialState.type, initialState.year, initialState.page);
    }
    openDetail(initialState.imdbId);
  } else if (initialState.query && initialState.source !== 'none') {
    // Restore previous search
    performSearch(initialState.query, initialState.type, initialState.year, initialState.page);
  } else {
    showWelcome();
  }

  // Handle browser back/forward
  window.addEventListener('popstate', handlePopState);

  // Logo click → reset to home
  const logo = document.getElementById('logo');
  if (logo) {
    logo.addEventListener('click', () => {
      window.location.hash = '';
      showWelcome();
      document.getElementById('search-input').value = '';
      document.getElementById('search-input').focus();
    });
  }
}

/**
 * Handle browser navigation (back/forward)
 */
function handlePopState() {
  const hashState = parseUrlHash();

  if (!hashState) {
    showWelcome();
    return;
  }

  if (hashState.route === 'detail') {
    openDetail(hashState.imdbId);
  } else if (hashState.route === 'search') {
    performSearch(hashState.query, hashState.type, hashState.year, hashState.page);
  }
}

/* ── Theme Toggle ── */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  // Load saved theme
  const savedTheme = localStorage.getItem('omdb_theme') || 'dark';
  if (savedTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';

    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    localStorage.setItem('omdb_theme', newTheme);
  });
}

/* ── Watchlist Panel ── */
function initWatchlistPanel() {
  const watchlistToggle = document.getElementById('watchlist-toggle');
  const countBadge = document.getElementById('watchlist-count');

  if (!watchlistToggle) return;

  // Create panel and backdrop elements
  const backdrop = document.createElement('div');
  backdrop.className = 'watchlist-backdrop';
  backdrop.id = 'watchlist-backdrop';
  document.body.appendChild(backdrop);

  const panel = document.createElement('aside');
  panel.className = 'watchlist-panel';
  panel.id = 'watchlist-panel';
  panel.innerHTML = `
    <div class="watchlist-panel__header">
      <h2 class="watchlist-panel__title">❤️ My Watchlist</h2>
      <button class="watchlist-panel__close" id="watchlist-panel-close" aria-label="Close watchlist">
        ${icons.close}
      </button>
    </div>
    <div class="watchlist-panel__list" id="watchlist-panel-list"></div>
  `;
  document.body.appendChild(panel);

  // Update badge count
  function updateBadge() {
    const count = getWatchlistCount();
    if (count > 0) {
      countBadge.style.display = 'flex';
      countBadge.textContent = count;
    } else {
      countBadge.style.display = 'none';
    }
  }

  // Render watchlist items
  function renderWatchlistPanel() {
    const list = document.getElementById('watchlist-panel-list');
    const watchlist = getWatchlist();

    if (watchlist.length === 0) {
      list.innerHTML = `
        <div class="watchlist-panel__empty">
          <div class="watchlist-panel__empty-icon">🎬</div>
          <p>Your watchlist is empty</p>
          <p style="font-size:0.75rem;">Click the ❤️ on any movie to add it here</p>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    watchlist.forEach(movie => {
      const item = document.createElement('div');
      item.className = 'watchlist-item';
      item.dataset.imdbid = movie.imdbID;

      const posterHtml = isValidPoster(movie.Poster)
        ? `<img src="${movie.Poster}" alt="${sanitize(movie.Title)}" loading="lazy">`
        : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-muted);font-size:0.6rem;">No Poster</div>`;

      item.innerHTML = `
        <div class="watchlist-item__poster">${posterHtml}</div>
        <div class="watchlist-item__info">
          <div class="watchlist-item__title">${sanitize(movie.Title)}</div>
          <div class="watchlist-item__meta">${sanitize(movie.Year)} · ${sanitize(movie.Type)}</div>
        </div>
        <button class="watchlist-item__remove" aria-label="Remove from watchlist" data-remove="${movie.imdbID}">
          ${icons.close}
        </button>
      `;

      // Click item to open detail
      item.addEventListener('click', (e) => {
        if (e.target.closest('.watchlist-item__remove')) return;
        closePanel();
        openDetail(movie.imdbID);
      });

      list.appendChild(item);
    });

    // Remove buttons
    list.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.remove;
        removeFromWatchlist(id);
        renderWatchlistPanel();
      });
    });
  }

  // Open/close panel
  function openPanel() {
    renderWatchlistPanel();
    panel.classList.add('open');
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  watchlistToggle.addEventListener('click', openPanel);
  backdrop.addEventListener('click', closePanel);
  panel.querySelector('#watchlist-panel-close').addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
    }
  });

  // Listen for watchlist changes to update badge and UI
  onWatchlistChange(() => {
    updateBadge();
    syncWatchlistUI();
  });

  // Initial badge update
  updateBadge();
}

function syncWatchlistUI() {
  // Update movie grid buttons
  document.querySelectorAll('.movie-card__watchlist-btn').forEach(btn => {
    const imdbId = btn.dataset.imdbid;
    if (imdbId) {
      const inList = isInWatchlist(imdbId);
      btn.classList.toggle('active', inList);
      btn.innerHTML = inList ? icons.heartFilled : icons.heartOutline;
      btn.setAttribute('aria-label', inList ? 'Remove from watchlist' : 'Add to watchlist');
    }
  });

  // Update modal button if present
  const modalBtn = document.getElementById('modal-watchlist-btn');
  if (modalBtn && modalBtn.dataset.imdbid) {
    const inList = isInWatchlist(modalBtn.dataset.imdbid);
    modalBtn.classList.toggle('active', inList);
    const iconEl = modalBtn.querySelector('.modal__watchlist-icon');
    const textEl = modalBtn.querySelector('.modal__watchlist-text');
    if (iconEl) iconEl.innerHTML = inList ? icons.heartFilled : icons.heartOutline;
    if (textEl) textEl.textContent = inList ? 'Remove from Watchlist' : 'Add to Watchlist';
    modalBtn.setAttribute('aria-label', inList ? 'Remove from Watchlist' : 'Add to Watchlist');
  }
}

// Boot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
