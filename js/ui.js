/* ============================================
   UI Helper Module
   ============================================ */

import { createElement, isValidPoster, sanitize } from './utils.js';
import { isInWatchlist, toggleWatchlist } from './watchlist.js';

/* ── SVG Icons ── */
export const icons = {
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,

  film: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>`,

  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,

  star: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,

  heartOutline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,

  heartFilled: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,

  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,

  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,

  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,

  chevronLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,

  chevronRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,

  alertCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,

  popcorn: '🍿',
  movieCamera: '🎬',
  sadFace: '😔',
  sparkles: '✨'
};

/**
 * Create a movie card element
 * @param {Object} movie - Movie data from search API
 * @returns {HTMLElement}
 */
export function createMovieCard(movie) {
  const card = createElement('article', {
    className: 'movie-card',
    dataset: { imdbid: movie.imdbID },
    role: 'button',
    tabindex: '0',
    'aria-label': `${movie.Title} (${movie.Year})`
  });

  // Poster
  const posterWrap = createElement('div', { className: 'movie-card__poster-wrap' });

  if (isValidPoster(movie.Poster)) {
    const img = createElement('img', {
      className: 'movie-card__poster',
      src: movie.Poster,
      alt: `${movie.Title} poster`,
      loading: 'lazy'
    });
    img.onerror = () => {
      img.replaceWith(createPosterFallback());
    };
    posterWrap.appendChild(img);
  } else {
    posterWrap.appendChild(createPosterFallback());
  }

  // Watchlist button on poster
  const inWatchlist = isInWatchlist(movie.imdbID);
  const watchlistBtn = createElement('button', {
    className: `movie-card__watchlist-btn ${inWatchlist ? 'active' : ''}`,
    'aria-label': inWatchlist ? 'Remove from watchlist' : 'Add to watchlist',
    dataset: { imdbid: movie.imdbID }
  });
  watchlistBtn.innerHTML = inWatchlist ? icons.heartFilled : icons.heartOutline;
  watchlistBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const added = toggleWatchlist(movie);
    watchlistBtn.classList.toggle('active', added);
    watchlistBtn.innerHTML = added ? icons.heartFilled : icons.heartOutline;
    watchlistBtn.setAttribute('aria-label', added ? 'Remove from watchlist' : 'Add to watchlist');
  });
  posterWrap.appendChild(watchlistBtn);

  // Hover overlay
  const overlay = createElement('div', { className: 'movie-card__overlay' });
  overlay.innerHTML = `<span class="movie-card__overlay-text">Click to view details</span>`;
  posterWrap.appendChild(overlay);

  card.appendChild(posterWrap);

  // Info
  const info = createElement('div', { className: 'movie-card__info' });
  info.innerHTML = `
    <h3 class="movie-card__title">${sanitize(movie.Title)}</h3>
    <div class="movie-card__meta">
      <span class="movie-card__year">${sanitize(movie.Year)}</span>
      <span class="movie-card__type">${sanitize(movie.Type)}</span>
    </div>
  `;
  card.appendChild(info);

  return card;
}

/**
 * Create poster fallback element
 * @returns {HTMLElement}
 */
function createPosterFallback() {
  const fallback = createElement('div', { className: 'movie-card__poster-fallback' });
  fallback.innerHTML = `${icons.film}<span>No Poster</span>`;
  return fallback;
}

/**
 * Create skeleton loading cards
 * @param {number} count - Number of skeleton cards
 * @returns {DocumentFragment}
 */
export function createSkeletonCards(count = 10) {
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < count; i++) {
    const card = createElement('div', { className: 'skeleton-card' });
    card.innerHTML = `
      <div class="skeleton-card__poster"></div>
      <div class="skeleton-card__info">
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
      </div>
    `;
    fragment.appendChild(card);
  }

  return fragment;
}

/**
 * Create empty state element
 * @param {string} type - 'welcome', 'no-results', 'error'
 * @param {string} [message] - Custom message
 * @returns {HTMLElement}
 */
export function createEmptyState(type, message) {
  const config = {
    welcome: {
      icon: icons.popcorn,
      title: 'Discover Your Next Movie',
      text: 'Search for any movie or series to get started. Try "Inception", "Breaking Bad", or "The Godfather".'
    },
    'no-results': {
      icon: icons.sadFace,
      title: 'No Results Found',
      text: message || 'We couldn\'t find any movies matching your search. Try different keywords or remove filters.'
    },
    error: {
      icon: '⚠️',
      title: 'Something Went Wrong',
      text: message || 'An error occurred while searching. Please try again.'
    }
  };

  const c = config[type] || config.error;

  const el = createElement('div', {
    className: `empty-state ${type === 'error' ? 'empty-state--error' : ''}`
  });

  el.innerHTML = `
    <div class="empty-state__icon">${c.icon}</div>
    <h3 class="empty-state__title">${c.title}</h3>
    <p class="empty-state__text">${c.text}</p>
  `;

  return el;
}

/**
 * Create movie detail modal content
 * @param {Object} movie - Full movie detail from API
 * @returns {HTMLElement}
 */
export function createMovieDetail(movie) {
  const modal = createElement('div', { className: 'modal', role: 'dialog', 'aria-label': movie.Title });

  const closeBtn = createElement('button', {
    className: 'modal__close',
    'aria-label': 'Close',
    id: 'modal-close-btn'
  });
  closeBtn.innerHTML = icons.close;

  const posterHtml = isValidPoster(movie.Poster)
    ? `<img src="${movie.Poster}" alt="${sanitize(movie.Title)} poster">`
    : `<div class="movie-card__poster-fallback" style="aspect-ratio:2/3">${icons.film}<span>No Poster</span></div>`;

  // Genre tags
  const genres = movie.Genre && movie.Genre !== 'N/A'
    ? movie.Genre.split(',').map(g => `<span class="genre-tag">${g.trim()}</span>`).join('')
    : '';

  // Ratings
  let ratingsHtml = '';
  if (movie.imdbRating && movie.imdbRating !== 'N/A') {
    ratingsHtml += `
      <div class="rating-item">
        <span class="rating-item__value">${icons.star} ${movie.imdbRating}</span>
        <span class="rating-item__label">IMDb</span>
      </div>
    `;
  }
  if (movie.Metascore && movie.Metascore !== 'N/A') {
    ratingsHtml += `
      <div class="rating-item">
        <span class="rating-item__value">${movie.Metascore}</span>
        <span class="rating-item__label">Metascore</span>
      </div>
    `;
  }
  if (movie.Ratings) {
    const rt = movie.Ratings.find(r => r.Source === 'Rotten Tomatoes');
    if (rt) {
      ratingsHtml += `
        <div class="rating-item">
          <span class="rating-item__value">${rt.Value}</span>
          <span class="rating-item__label">Rotten Tomatoes</span>
        </div>
      `;
    }
  }
  if (movie.imdbVotes && movie.imdbVotes !== 'N/A') {
    ratingsHtml += `
      <div class="rating-item">
        <span class="rating-item__value">${movie.imdbVotes}</span>
        <span class="rating-item__label">Votes</span>
      </div>
    `;
  }

  // Watchlist button for modal
  const modalInWatchlist = isInWatchlist(movie.imdbID);
  const watchlistLabel = modalInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist';

  modal.innerHTML = `
    <div class="modal__content">
      <div class="modal__hero">
        <div class="modal__poster">${posterHtml}</div>
        <div class="modal__details">
          <h2 class="modal__title">${sanitize(movie.Title)}</h2>

          <div class="modal__meta-row">
            ${movie.Year && movie.Year !== 'N/A' ? `<span class="modal__badge">${sanitize(movie.Year)}</span>` : ''}
            ${movie.Rated && movie.Rated !== 'N/A' ? `<span class="modal__badge">${sanitize(movie.Rated)}</span>` : ''}
            ${movie.Runtime && movie.Runtime !== 'N/A' ? `<span class="modal__badge">${sanitize(movie.Runtime)}</span>` : ''}
            ${movie.Type ? `<span class="modal__badge modal__badge--accent">${sanitize(movie.Type)}</span>` : ''}
          </div>

          ${genres ? `<div class="modal__genre-list">${genres}</div>` : ''}

          ${ratingsHtml ? `<div class="modal__rating">${ratingsHtml}</div>` : ''}

          ${movie.Awards && movie.Awards !== 'N/A' ? `
            <div style="display:flex;align-items:center;gap:8px;font-size:0.875rem;color:var(--accent-primary);">
              <span>🏆</span>
              <span>${sanitize(movie.Awards)}</span>
            </div>
          ` : ''}

          <button class="modal__watchlist-btn ${modalInWatchlist ? 'active' : ''}" id="modal-watchlist-btn" aria-label="${watchlistLabel}">
            <span class="modal__watchlist-icon">${modalInWatchlist ? icons.heartFilled : icons.heartOutline}</span>
            <span class="modal__watchlist-text">${watchlistLabel}</span>
          </button>
        </div>
      </div>

      ${movie.Plot && movie.Plot !== 'N/A' ? `
        <div class="modal__section">
          <h4 class="modal__section-title">Plot</h4>
          <p class="modal__section-text">${sanitize(movie.Plot)}</p>
        </div>
      ` : ''}

      <div class="modal__info-grid">
        ${createInfoItem('Director', movie.Director)}
        ${createInfoItem('Writer', movie.Writer)}
        ${createInfoItem('Actors', movie.Actors)}
        ${createInfoItem('Language', movie.Language)}
        ${createInfoItem('Country', movie.Country)}
        ${createInfoItem('Released', movie.Released)}
        ${createInfoItem('Box Office', movie.BoxOffice)}
        ${createInfoItem('Production', movie.Production)}
      </div>
    </div>
  `;

  modal.prepend(closeBtn);

  return modal;
}

/**
 * Create info item HTML
 */
function createInfoItem(label, value) {
  if (!value || value === 'N/A') return '';
  return `
    <div class="info-item">
      <span class="info-item__label">${label}</span>
      <span class="info-item__value">${sanitize(value)}</span>
    </div>
  `;
}

/**
 * Create pagination controls
 * @param {number} currentPage
 * @param {number} totalResults
 * @returns {HTMLElement}
 */
export function createPagination(currentPage, totalResults) {
  const totalPages = Math.ceil(totalResults / 10);
  if (totalPages <= 1) return null;

  const container = createElement('div', { className: 'pagination' });

  // Prev button
  const prevBtn = createElement('button', {
    className: 'pagination__btn',
    disabled: currentPage <= 1 ? 'true' : undefined,
    dataset: { page: currentPage - 1 },
    'aria-label': 'Previous page'
  });
  prevBtn.innerHTML = icons.chevronLeft;
  container.appendChild(prevBtn);

  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    container.appendChild(createPageBtn(1, currentPage));
    if (startPage > 2) {
      container.appendChild(createElement('span', { className: 'pagination__btn', style: 'pointer-events:none;opacity:0.5' }, '...'));
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    container.appendChild(createPageBtn(i, currentPage));
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      container.appendChild(createElement('span', { className: 'pagination__btn', style: 'pointer-events:none;opacity:0.5' }, '...'));
    }
    container.appendChild(createPageBtn(totalPages, currentPage));
  }

  // Next button
  const nextBtn = createElement('button', {
    className: 'pagination__btn',
    disabled: currentPage >= totalPages ? 'true' : undefined,
    dataset: { page: currentPage + 1 },
    'aria-label': 'Next page'
  });
  nextBtn.innerHTML = icons.chevronRight;
  container.appendChild(nextBtn);

  return container;
}

/**
 * Create page number button
 */
function createPageBtn(pageNum, currentPage) {
  return createElement('button', {
    className: `pagination__btn ${pageNum === currentPage ? 'active' : ''}`,
    dataset: { page: pageNum }
  }, String(pageNum));
}

/**
 * Show toast notification
 * @param {string} message
 * @param {string} type - 'error', 'success', 'info'
 * @param {number} duration - Duration in ms
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Remove existing toast
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = createElement('div', { className: `toast toast--${type}` });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, duration);
}
