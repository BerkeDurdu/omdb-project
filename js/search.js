/* ============================================
   Search Module
   ============================================ */

import { searchMovies, ApiError } from './api.js';
import { setState, getState } from './state.js';
import { createMovieCard, createSkeletonCards, createEmptyState, createPagination, showToast } from './ui.js';
import { debounce } from './utils.js';

/* ── DOM References ── */
let searchInput, searchBtn, typeFilters, yearInput, movieGrid, resultsSection, resultsCount, paginationContainer;

/**
 * Initialize search module
 */
export function initSearch() {
  searchInput = document.getElementById('search-input');
  searchBtn = document.getElementById('search-btn');
  typeFilters = document.querySelectorAll('.filter-btn[data-type]');
  yearInput = document.getElementById('year-filter');
  movieGrid = document.getElementById('movie-grid');
  resultsSection = document.getElementById('results-section');
  resultsCount = document.getElementById('results-count');
  paginationContainer = document.getElementById('pagination');

  // Event listeners
  searchBtn.addEventListener('click', handleSearchClick);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearchClick();
  });

  // Filter type buttons
  typeFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      typeFilters.forEach(b => b.classList.remove('active'));

      // Toggle: if clicking the same button, deactivate it
      const currentType = getState().type;
      if (currentType === btn.dataset.type) {
        setState({ type: '', page: 1 });
      } else {
        btn.classList.add('active');
        setState({ type: btn.dataset.type, page: 1 });
      }

      // Re-search if there's a query
      const state = getState();
      if (state.query) {
        performSearch(state.query, state.type, state.year, 1);
      }
    });
  });

  // Year filter (debounced)
  if (yearInput) {
    yearInput.addEventListener('input', debounce(() => {
      const year = yearInput.value.trim();
      setState({ year, page: 1 });

      const state = getState();
      if (state.query) {
        performSearch(state.query, state.type, year, 1);
      }
    }, 500));
  }
}

/**
 * Handle search button click
 */
function handleSearchClick() {
  const query = searchInput.value.trim();

  if (!query) {
    showToast('Please enter a movie name to search.', 'error');
    searchInput.focus();
    return;
  }

  if (query.length < 2) {
    showToast('Please enter at least 2 characters.', 'error');
    return;
  }

  const state = getState();
  performSearch(query, state.type, state.year, 1);
}

/**
 * Perform search and update UI
 * @param {string} query
 * @param {string} type
 * @param {string} year
 * @param {number} page
 */
export async function performSearch(query, type = '', year = '', page = 1) {
  // Show loading state
  showLoading();

  // Update state
  setState({
    query,
    type,
    year,
    page
  });

  // Update UI inputs
  searchInput.value = query;
  updateFilterUI(type, year);

  try {
    const { movies, totalResults } = await searchMovies(query, { type, year, page });

    // Update state with results
    setState({
      lastResults: movies,
      totalResults
    });

    // Render results
    renderResults(movies, totalResults, page);

  } catch (error) {
    if (error instanceof ApiError && error.code === 'ABORT') {
      return; // Silently ignore aborted requests
    }

    hideLoading();

    if (error instanceof ApiError) {
      if (error.message.includes('Movie not found') || error.message.includes('Too many results')) {
        renderEmptyResults(error.message);
      } else {
        renderError(error.message);
      }
    } else {
      renderError('An unexpected error occurred. Please try again.');
    }
  }
}

/**
 * Render search results
 */
function renderResults(movies, totalResults, currentPage) {
  // Show results section
  resultsSection.classList.remove('hidden');

  // Update count
  resultsCount.innerHTML = `Found <strong>${totalResults.toLocaleString()}</strong> results`;

  // Clear grid
  movieGrid.innerHTML = '';

  // Create and append cards
  const fragment = document.createDocumentFragment();
  movies.forEach(movie => {
    const card = createMovieCard(movie);
    fragment.appendChild(card);
  });
  movieGrid.appendChild(fragment);

  // Pagination
  paginationContainer.innerHTML = '';
  const pagination = createPagination(currentPage, totalResults);
  if (pagination) {
    paginationContainer.appendChild(pagination);

    // Pagination click handler
    pagination.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;

      const newPage = parseInt(btn.dataset.page, 10);
      if (newPage < 1) return;

      const state = getState();
      performSearch(state.query, state.type, state.year, newPage);

      // Scroll to top of results
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // Scroll into view on page change
  if (currentPage > 1) {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Render empty results state
 */
function renderEmptyResults(message) {
  resultsSection.classList.remove('hidden');
  resultsCount.innerHTML = '';
  movieGrid.innerHTML = '';
  paginationContainer.innerHTML = '';

  const emptyState = createEmptyState('no-results', message);
  movieGrid.appendChild(emptyState);
}

/**
 * Render error state
 */
function renderError(message) {
  resultsSection.classList.remove('hidden');
  resultsCount.innerHTML = '';
  movieGrid.innerHTML = '';
  paginationContainer.innerHTML = '';

  const errorState = createEmptyState('error', message);
  movieGrid.appendChild(errorState);
}

/**
 * Show loading skeleton
 */
function showLoading() {
  resultsSection.classList.remove('hidden');
  resultsCount.innerHTML = 'Searching...';
  movieGrid.innerHTML = '';
  paginationContainer.innerHTML = '';
  movieGrid.appendChild(createSkeletonCards(10));
}

/**
 * Hide loading
 */
function hideLoading() {
  // Skeleton cards will be replaced by actual content
}

/**
 * Update filter UI to match state
 */
function updateFilterUI(type, year) {
  typeFilters.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  if (yearInput && year) {
    yearInput.value = year;
  }
}

/**
 * Show welcome state
 */
export function showWelcome() {
  resultsSection.classList.add('hidden');
  movieGrid.innerHTML = '';
  paginationContainer.innerHTML = '';
}
