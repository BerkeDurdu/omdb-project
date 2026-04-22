/* ============================================
   Movie Detail Module
   ============================================ */

import { getMovieDetail, ApiError } from './api.js';
import { setDetailHash, clearDetailHash } from './state.js';
import { createMovieDetail, showToast, icons } from './ui.js';
import { toggleWatchlist, isInWatchlist } from './watchlist.js';

/* ── DOM References ── */
let modalOverlay;

/**
 * Initialize detail module
 */
export function initDetail() {
  modalOverlay = document.getElementById('modal-overlay');

  // Close modal on overlay click
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeDetail();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeDetail();
    }
  });

  // Movie card click delegation (on movie grid)
  const movieGrid = document.getElementById('movie-grid');
  movieGrid.addEventListener('click', (e) => {
    // Ignore clicks on watchlist button (handled separately)
    if (e.target.closest('.movie-card__watchlist-btn')) return;

    const card = e.target.closest('.movie-card');
    if (card) {
      const imdbId = card.dataset.imdbid;
      if (imdbId) openDetail(imdbId);
    }
  });

  // Keyboard support for movie cards
  movieGrid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.movie-card');
      if (card) {
        const imdbId = card.dataset.imdbid;
        if (imdbId) openDetail(imdbId);
      }
    }
  });
}

/**
 * Open movie detail modal
 * @param {string} imdbId
 */
export async function openDetail(imdbId) {
  // Update URL
  setDetailHash(imdbId);

  // Show modal with loading
  modalOverlay.innerHTML = '';
  const loadingModal = document.createElement('div');
  loadingModal.className = 'modal';
  loadingModal.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:400px;';
  loadingModal.innerHTML = `
    <div class="loading-container">
      <div class="spinner spinner--lg"></div>
      <p class="loading-container__text">Loading movie details...</p>
    </div>
  `;
  modalOverlay.appendChild(loadingModal);
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Force reflow for animation
  requestAnimationFrame(() => {
    loadingModal.style.transform = 'scale(1) translateY(0)';
    loadingModal.style.opacity = '1';
  });

  try {
    const movie = await getMovieDetail(imdbId);

    // Replace loading with actual content
    modalOverlay.innerHTML = '';
    const detailEl = createMovieDetail(movie);
    modalOverlay.appendChild(detailEl);

    // Animate in
    requestAnimationFrame(() => {
      detailEl.style.transform = 'scale(1) translateY(0)';
      detailEl.style.opacity = '1';
    });

    // Attach close button handler
    const closeBtn = detailEl.querySelector('#modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDetail);
    }

    // Attach watchlist button handler
    const watchlistBtn = detailEl.querySelector('#modal-watchlist-btn');
    if (watchlistBtn) {
      watchlistBtn.addEventListener('click', () => {
        const added = toggleWatchlist(movie);
        watchlistBtn.classList.toggle('active', added);
        const iconEl = watchlistBtn.querySelector('.modal__watchlist-icon');
        const textEl = watchlistBtn.querySelector('.modal__watchlist-text');
        if (iconEl) iconEl.innerHTML = added ? icons.heartFilled : icons.heartOutline;
        if (textEl) textEl.textContent = added ? 'Remove from Watchlist' : 'Add to Watchlist';
        showToast(added ? `"${movie.Title}" added to watchlist!` : `"${movie.Title}" removed from watchlist.`, added ? 'success' : 'info');
      });
    }

  } catch (error) {
    closeDetail();

    if (error instanceof ApiError && error.code !== 'ABORT') {
      showToast(error.message, 'error');
    } else if (!(error instanceof ApiError)) {
      showToast('Failed to load movie details.', 'error');
    }
  }
}

/**
 * Close movie detail modal
 */
export function closeDetail() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  clearDetailHash();

  // Clear modal content after animation
  setTimeout(() => {
    if (!modalOverlay.classList.contains('active')) {
      modalOverlay.innerHTML = '';
    }
  }, 300);
}
