document.addEventListener("DOMContentLoaded", () => {
  if (!MOVIE_TITLE) return;

  fetch(`/getMovieData?title=${encodeURIComponent(MOVIE_TITLE)}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('movie-results');

      if (!Array.isArray(data) || data.length === 0) {
        container.textContent = "No results found.";
        return;
      }

      container.innerHTML = ''; 

      data.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie-card'); 

        const streaming = movie.streamingOptions?.us;
        const streamingList = Array.isArray(streaming) && streaming.length > 0
          ? `<ul>
              ${streaming.map(s => `
                <li>
                  <a href="${s.link}" target="_blank"><strong>${s.service.name}</strong></a> (${s.type})
                  ${s.price ? `- $${s.price.formatted}` : ''}
                </li>
              `).join('')}
            </ul>`
          : '<p>No streaming options available.</p>';

        movieElement.innerHTML = `
          <h2>
            ${movie.title}
            ${
              movie.year
                ? ` (${movie.year})`
                : movie.firstAirYear && movie.lastAirYear
                  ? ` (${movie.firstAirYear}–${movie.lastAirYear})`
                  : ''
            }
          </h2>
          <p>${movie.overview}</p>
          <div class="genres">
            ${movie.genres.map(g => `<span class="genre-chip">${g.name}</span>`).join('')}
          </div>
          <h3>Streaming Options:</h3>
          ${streamingList}
        `;

        container.appendChild(movieElement);
      });
    })
    .catch(err => {
      document.getElementById('movie-results').textContent = "Error fetching movie data.";
      console.error(err);
    });
});
