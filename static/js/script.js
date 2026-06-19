const state = {
  country: '',
  results: [],
  filtered: [],
};

const COUNTRY_NAMES = {
  us: 'United States',
  ca: 'Canada',
  gb: 'United Kingdom',
  au: 'Australia',
  de: 'Germany',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  jp: 'Japan',
  br: 'Brazil',
};

document.addEventListener('DOMContentLoaded', () => {
  if (!window.APP_CONFIG?.title) return;

  state.country = (window.APP_CONFIG.country || 'us').toLowerCase();
  bindFilters();
  loadResults(window.APP_CONFIG.title, state.country);
});

function bindFilters() {
  ['type-filter', 'service-filter', 'availability-filter', 'sort-filter'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', renderResults);
  });
}

async function loadResults(title, country) {
  setStatus('Loading streaming matches...');
  renderSkeletons();

  try {
    const params = new URLSearchParams({ title, country });
    const response = await fetch(`/getMovieData?${params.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || 'Error fetching movie data.');
    }

    state.country = payload.country || country;
    state.results = Array.isArray(payload.results) ? payload.results : [];
    populateServices(state.results);
    updateHero(state.results);
    renderResults();
  } catch (error) {
    clearResults();
    setStatus(error.message || 'Error fetching movie data.', true);
  }
}

function renderResults() {
  const container = document.getElementById('movie-results');
  const typeFilter = valueOf('type-filter');
  const serviceFilter = valueOf('service-filter');
  const availabilityFilter = valueOf('availability-filter');
  const sortFilter = valueOf('sort-filter');

  state.filtered = state.results
    .filter((movie) => typeFilter === 'all' || movie.showType === typeFilter)
    .filter((movie) => serviceFilter === 'all' || getStreamingOptions(movie).some((option) => option.service?.id === serviceFilter))
    .filter((movie) => availabilityFilter === 'all' || hasAvailability(movie, availabilityFilter))
    .sort((a, b) => compareMovies(a, b, sortFilter));

  clearResults();

  if (!state.results.length) {
    setStatus('No results found. Try a different title or country.', true);
    return;
  }

  if (!state.filtered.length) {
    setStatus('No results match the selected filters.', true);
    return;
  }

  setStatus(`${state.filtered.length} of ${state.results.length} results shown`);
  state.filtered.forEach((movie) => container.appendChild(createMovieCard(movie)));
}

function createMovieCard(movie) {
  const card = document.createElement('article');
  card.className = 'movie-card';

  const backdrop = imageUrl(movie, 'horizontalBackdrop', 'w720') || imageUrl(movie, 'horizontalBackdrop', 'w1080');
  if (backdrop) {
    const media = document.createElement('div');
    media.className = 'backdrop';
    media.style.backgroundImage = `url("${backdrop}")`;
    card.appendChild(media);
  }

  const body = document.createElement('div');
  body.className = 'movie-body';

  const poster = document.createElement('img');
  poster.className = 'movie-poster';
  poster.src = imageUrl(movie, 'verticalPoster', 'w240') || 'https://via.placeholder.com/240x360?text=No+Image';
  poster.alt = `${movie.title || 'Untitled'} poster`;
  poster.loading = 'lazy';

  const info = document.createElement('div');
  info.className = 'movie-info';

  const header = document.createElement('div');
  header.className = 'movie-header';

  const title = document.createElement('h2');
  title.textContent = formatTitle(movie);
  header.appendChild(title);

  const rating = ratingBadge(movie.rating);
  if (rating) header.appendChild(rating);

  info.appendChild(header);
  info.appendChild(metaLine(movie));
  info.appendChild(genreList(movie.genres || []));
  info.appendChild(peopleLine(movie));

  const overview = document.createElement('p');
  overview.className = 'overview';
  overview.textContent = movie.overview || 'No description available.';
  info.appendChild(overview);

  const streamSection = document.createElement('div');
  streamSection.className = 'streaming-section';
  streamSection.appendChild(sectionTitle('Where to watch'));
  streamSection.appendChild(streamingOptions(movie));
  info.appendChild(streamSection);

  const details = detailsPanel(movie);
  if (details) info.appendChild(details);

  body.appendChild(poster);
  body.appendChild(info);
  card.appendChild(body);

  return card;
}

function streamingOptions(movie) {
  const options = getStreamingOptions(movie);
  const wrapper = document.createElement('div');
  wrapper.className = 'service-grid';

  if (!options.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = `No streaming options available in ${countryName()}.`;
    wrapper.appendChild(empty);
    return wrapper;
  }

  options.forEach((option) => {
    const link = document.createElement('a');
    link.className = 'service-card';
    link.href = safeUrl(option.videoLink || option.link);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.borderColor = option.service?.themeColorCode || '#e5e7eb';

    const logo = option.service?.imageSet?.lightThemeImage || option.service?.imageSet?.darkThemeImage;
    if (logo) {
      const img = document.createElement('img');
      img.src = logo;
      img.alt = `${option.service?.name || 'Streaming service'} logo`;
      img.loading = 'lazy';
      link.appendChild(img);
    }

    const text = document.createElement('div');
    text.className = 'service-text';
    const name = document.createElement('strong');
    name.textContent = option.addon?.name
      ? `${option.service?.name || 'Unknown'} + ${option.addon.name}`
      : option.service?.name || 'Unknown service';
    text.appendChild(name);

    const detail = document.createElement('span');
    detail.textContent = [formatAvailability(option), option.quality?.toUpperCase(), formatPrice(option), formatAdded(option)]
      .filter(Boolean)
      .join(' | ');
    text.appendChild(detail);
    link.appendChild(text);

    if (option.expiresSoon || option.expiresOn) {
      const expiry = document.createElement('span');
      expiry.className = option.expiresSoon ? 'expiring badge' : 'badge';
      expiry.textContent = option.expiresOn ? `Until ${formatDate(option.expiresOn)}` : 'Expires soon';
      link.appendChild(expiry);
    }

    wrapper.appendChild(link);
  });

  return wrapper;
}

function detailsPanel(movie) {
  const details = document.createElement('details');
  details.className = 'details-panel';

  const summary = document.createElement('summary');
  summary.textContent = 'More details';
  details.appendChild(summary);

  const list = document.createElement('dl');
  addDetail(list, 'Original title', movie.originalTitle);
  addDetail(list, 'IMDb ID', movie.imdbId);
  addDetail(list, 'TMDb ID', movie.tmdbId);
  addDetail(list, 'Audio', uniqueLanguages(getStreamingOptions(movie).flatMap((option) => option.audios || [])));
  addDetail(list, 'Subtitles', uniqueLanguages(getStreamingOptions(movie).flatMap((option) => option.subtitles || [])));

  if (!list.children.length) return null;
  details.appendChild(list);
  return details;
}

function updateHero(results) {
  const hero = document.getElementById('results-hero');
  const summary = document.getElementById('result-summary');
  const firstBackdrop = results.map((movie) => imageUrl(movie, 'horizontalBackdrop', 'w1080')).find(Boolean);

  if (firstBackdrop) {
    hero.style.backgroundImage = `linear-gradient(90deg, rgba(17,24,39,.9), rgba(17,24,39,.55)), url("${firstBackdrop}")`;
  }

  summary.textContent = results.length
    ? `${results.length} matches in ${countryName()}. Filter by service, type, availability, or rating.`
    : `No matches found in ${countryName()}.`;
}

function populateServices(results) {
  const select = document.getElementById('service-filter');
  const services = new Map();

  results.flatMap(getStreamingOptions).forEach((option) => {
    if (option.service?.id && option.service?.name) {
      services.set(option.service.id, option.service.name);
    }
  });

  while (select.options.length > 1) select.remove(1);

  Array.from(services.entries())
    .sort((a, b) => a[1].localeCompare(b[1]))
    .forEach(([id, name]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = name;
      select.appendChild(option);
    });
}

function renderSkeletons() {
  const container = document.getElementById('movie-results');
  clearResults();
  for (let i = 0; i < 3; i += 1) {
    const skeleton = document.createElement('div');
    skeleton.className = 'movie-card skeleton';
    container.appendChild(skeleton);
  }
}

function clearResults() {
  const container = document.getElementById('movie-results');
  while (container.firstChild) container.removeChild(container.firstChild);
}

function setStatus(message, isError = false) {
  const status = document.getElementById('status-message');
  status.textContent = message;
  status.classList.toggle('is-error', isError);
}

function getStreamingOptions(movie) {
  return movie.streamingOptions?.[state.country] || [];
}

function hasAvailability(movie, availability) {
  return getStreamingOptions(movie).some((option) => {
    if (availability === 'addon') return Boolean(option.addon);
    return option.type === availability;
  });
}

function compareMovies(a, b, sort) {
  if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
  if (sort === 'newest') return yearOf(b) - yearOf(a);
  if (sort === 'recent') return latestAvailability(b) - latestAvailability(a);
  if (sort === 'expiring') return firstExpiry(a) - firstExpiry(b);
  return 0;
}

function firstExpiry(movie) {
  const expiries = getStreamingOptions(movie)
    .map((option) => option.expiresOn)
    .filter(Boolean);
  return expiries.length ? Math.min(...expiries) : Number.MAX_SAFE_INTEGER;
}

function latestAvailability(movie) {
  const dates = getStreamingOptions(movie)
    .map((option) => option.availableSince)
    .filter(Boolean);
  return dates.length ? Math.max(...dates) : 0;
}

function yearOf(movie) {
  return movie.releaseYear || movie.firstAirYear || 0;
}

function imageUrl(movie, group, size) {
  return movie.imageSet?.[group]?.[size] || null;
}

function formatTitle(movie) {
  const year = movie.releaseYear || formatYearRange(movie);
  return year ? `${movie.title || 'Unknown title'} (${year})` : movie.title || 'Unknown title';
}

function formatYearRange(movie) {
  if (!movie.firstAirYear) return '';
  if (!movie.lastAirYear || movie.lastAirYear === movie.firstAirYear) return String(movie.firstAirYear);
  return `${movie.firstAirYear}-${movie.lastAirYear}`;
}

function metaLine(movie) {
  const meta = document.createElement('p');
  meta.className = 'movie-meta';
  const parts = [
    labelize(movie.showType),
    movie.runtime ? `${movie.runtime} min` : null,
    movie.seasonCount ? `${movie.seasonCount} season${movie.seasonCount === 1 ? '' : 's'}` : null,
    movie.episodeCount ? `${movie.episodeCount} episodes` : null,
  ].filter(Boolean);
  meta.textContent = parts.join(' | ');
  return meta;
}

function genreList(genres) {
  const wrapper = document.createElement('div');
  wrapper.className = 'genres';
  genres.slice(0, 5).forEach((genre) => {
    const chip = document.createElement('span');
    chip.className = 'genre-chip';
    chip.textContent = genre.name || genre.id;
    wrapper.appendChild(chip);
  });
  return wrapper;
}

function peopleLine(movie) {
  const line = document.createElement('p');
  line.className = 'people-line';
  const creators = movie.directors || movie.creators || [];
  const cast = movie.cast || [];
  const parts = [];
  if (creators.length) parts.push(`By ${creators.slice(0, 2).join(', ')}`);
  if (cast.length) parts.push(`Cast: ${cast.slice(0, 4).join(', ')}`);
  line.textContent = parts.join(' | ');
  return line;
}

function ratingBadge(rating) {
  if (!rating && rating !== 0) return null;
  const badge = document.createElement('span');
  badge.className = 'rating-badge';
  badge.textContent = `${rating}%`;
  return badge;
}

function sectionTitle(text) {
  const title = document.createElement('h3');
  title.textContent = text;
  return title;
}

function addDetail(list, label, value) {
  if (!value || (Array.isArray(value) && !value.length)) return;
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = Array.isArray(value) ? value.join(', ') : value;
  list.appendChild(dt);
  list.appendChild(dd);
}

function uniqueLanguages(items) {
  return Array.from(new Set(items.map((item) => item.language || item.locale?.language).filter(Boolean))).sort();
}

function formatAvailability(option) {
  if (option.addon) return 'Add-on';
  return labelize(option.type || 'Available');
}

function formatPrice(option) {
  return option.price?.formatted || '';
}

function formatAdded(option) {
  return option.availableSince ? `Added ${formatDate(option.availableSince)}` : '';
}

function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function labelize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll('_', ' ');
}

function valueOf(id) {
  return document.getElementById(id)?.value || 'all';
}

function countryName() {
  return COUNTRY_NAMES[state.country] || state.country.toUpperCase();
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '#';
  } catch {
    return '#';
  }
}
