// main.js — renders the deal finder and wires up its controls.
//
// One clear job: take the deals from deals.js, apply the shopper's search,
// filters and sort, and draw the cards. The current view is also readable
// from the URL (?q=, ?category=, ?store=, ?tier=, ?signal=, ?sort=) so a
// filtered view can be linked to and screenshotted as-is.

import { DEALS, CATEGORIES, STORES, SIGNALS, CHECKED_AT } from './deals.js';
import { money, moneyFull, discountPercent, saving, usualLabel } from './format.js';

const grid = document.getElementById('deal-grid');
const countLine = document.getElementById('result-count');
const searchBox = document.getElementById('search');
const categorySelect = document.getElementById('category');
const storeSelect = document.getElementById('store');
const tierSelect = document.getElementById('tier');
const signalSelect = document.getElementById('signal');
const sortSelect = document.getElementById('sort');
const clearButton = document.getElementById('clear-filters');

const state = {
  q: '',
  category: 'All',
  store: 'All',
  tier: 'all',
  signal: 'all',
  sort: 'discount',
};

function fillSelect(select, values, allLabel) {
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
  if (allLabel) {
    const all = document.createElement('option');
    all.value = 'All';
    all.textContent = allLabel;
    select.insertBefore(all, select.firstChild);
  }
}

function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  state.q = params.get('q') || '';
  state.category = params.get('category') || 'All';
  state.store = params.get('store') || 'All';
  state.tier = params.get('tier') || 'all';
  state.signal = params.get('signal') || 'all';
  state.sort = params.get('sort') || 'discount';
  if (!CATEGORIES.includes(state.category)) state.category = 'All';
  if (!STORES.includes(state.store)) state.store = 'All';
  if (!['all', '50', '30', 'under30'].includes(state.tier)) state.tier = 'all';
  if (!(state.signal in SIGNALS) && state.signal !== 'all') state.signal = 'all';
  if (!['discount', 'price-low', 'price-high', 'saving', 'name'].includes(state.sort)) {
    state.sort = 'discount';
  }
}

function writeStateToUrl() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.category !== 'All') params.set('category', state.category);
  if (state.store !== 'All') params.set('store', state.store);
  if (state.tier !== 'all') params.set('tier', state.tier);
  if (state.signal !== 'all') params.set('signal', state.signal);
  if (state.sort !== 'discount') params.set('sort', state.sort);
  const query = params.toString();
  const url = query ? window.location.pathname + '?' + query : window.location.pathname;
  window.history.replaceState(null, '', url);
}

function tierMatches(deal) {
  const pct = discountPercent(deal);
  if (state.tier === '50') return pct >= 50;
  if (state.tier === '30') return pct >= 30 && pct < 50;
  if (state.tier === 'under30') return pct < 30;
  return true;
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let list = DEALS.filter((deal) => {
    if (state.category !== 'All' && deal.category !== state.category) return false;
    if (state.store !== 'All' && deal.store !== state.store) return false;
    if (state.signal !== 'all' && deal.signal !== state.signal) return false;
    if (!tierMatches(deal)) return false;
    if (q) {
      const haystack = (deal.name + ' ' + deal.detail + ' ' + deal.category + ' ' + deal.store).toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const by = {
    discount: (a, b) => discountPercent(b) - discountPercent(a) || saving(b) - saving(a),
    'price-low': (a, b) => a.sale - b.sale,
    'price-high': (a, b) => b.sale - a.sale,
    saving: (a, b) => saving(b) - saving(a),
    name: (a, b) => a.name.localeCompare(b.name),
  }[state.sort];
  list = [...list].sort(by);
  return list;
}

function signalBadge(deal) {
  const signal = SIGNALS[deal.signal];
  return '<span class="badge badge-' + deal.signal + '">' + signal.short + '</span>';
}

function dealCard(deal) {
  const pct = discountPercent(deal);
  const article = document.createElement('article');
  article.className = 'card';
  article.innerHTML =
    '<div class="card-top">' +
    '<span class="chip">' + deal.category + '</span>' +
    signalBadge(deal) +
    '</div>' +
    '<h3></h3>' +
    '<p class="detail"></p>' +
    '<div class="prices">' +
    '<span class="sale"></span>' +
    '<span class="usual"></span>' +
    '<span class="pct">-' + pct + '%</span>' +
    '</div>' +
    '<p class="save-line">You save <strong></strong> off the ' + usualLabel(deal).toLowerCase() + ' of <span></span></p>' +
    '<p class="evidence"></p>' +
    '<p class="checked">Checked ' + CHECKED_AT + ' &middot; ' + deal.source + '</p>' +
    '<a class="store-link" href="' + deal.link + '" target="_blank" rel="noopener">View at ' + deal.store + ' &rarr;</a>';
  article.querySelector('h3').textContent = deal.name;
  article.querySelector('.detail').textContent = deal.detail;
  article.querySelector('.sale').textContent = money(deal.sale);
  article.querySelector('.usual').textContent = money(deal.usual);
  article.querySelector('.save-line strong').textContent = money(saving(deal));
  article.querySelector('.save-line span').textContent = money(deal.usual);
  article.querySelector('.evidence').textContent = deal.evidence;
  return article;
}

function render() {
  const list = applyFilters();
  grid.replaceChildren(...list.map(dealCard));
  const total = DEALS.length;
  countLine.textContent =
    list.length === total
      ? 'Showing all ' + total + ' deals'
      : 'Showing ' + list.length + ' of ' + total + ' deals';
  if (list.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'No deals match those filters. Clear the search or widen a filter.';
    grid.appendChild(empty);
  }
}

function syncControls() {
  searchBox.value = state.q;
  categorySelect.value = state.category;
  storeSelect.value = state.store;
  tierSelect.value = state.tier;
  signalSelect.value = state.signal;
  sortSelect.value = state.sort;
}

function bindControls() {
  searchBox.addEventListener('input', () => {
    state.q = searchBox.value;
    writeStateToUrl();
    render();
  });
  categorySelect.addEventListener('change', () => {
    state.category = categorySelect.value;
    writeStateToUrl();
    render();
  });
  storeSelect.addEventListener('change', () => {
    state.store = storeSelect.value;
    writeStateToUrl();
    render();
  });
  tierSelect.addEventListener('change', () => {
    state.tier = tierSelect.value;
    writeStateToUrl();
    render();
  });
  signalSelect.addEventListener('change', () => {
    state.signal = signalSelect.value;
    writeStateToUrl();
    render();
  });
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    writeStateToUrl();
    render();
  });
  clearButton.addEventListener('click', () => {
    state.q = '';
    state.category = 'All';
    state.store = 'All';
    state.tier = 'all';
    state.signal = 'all';
    state.sort = 'discount';
    syncControls();
    writeStateToUrl();
    render();
  });
}

function renderStats() {
  const totalSaving = DEALS.reduce((sum, deal) => sum + saving(deal), 0);
  const newLows = DEALS.filter((deal) => deal.signal === 'new-low').length;
  const bigCuts = DEALS.filter((deal) => discountPercent(deal) >= 50).length;
  document.getElementById('stat-deals').textContent = String(DEALS.length);
  document.getElementById('stat-saving').textContent = money(totalSaving);
  document.getElementById('stat-newlows').textContent = String(newLows);
  document.getElementById('stat-bigcuts').textContent = String(bigCuts);
  document.getElementById('checked-line').textContent =
    'All ' + DEALS.length + ' prices checked ' + CHECKED_AT + ' (Black Friday).';
}

fillSelect(categorySelect, CATEGORIES, 'All categories');
fillSelect(storeSelect, STORES, 'All stores');
readStateFromUrl();
syncControls();
bindControls();
renderStats();
render();
