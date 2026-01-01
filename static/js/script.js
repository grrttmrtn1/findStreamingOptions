document.addEventListener("DOMContentLoaded", () => {
  if (typeof MOVIE_TITLE === 'undefined' || !MOVIE_TITLE) return;

  fetch(`/getMovieData?title=${encodeURIComponent(MOVIE_TITLE)}`)
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('movie-results');

      const movies = Array.isArray(data) ? data : [data];

      if (movies.length === 0 || !movies[0].title) {
        container.textContent = "No results found.";
        return;
      }

      container.innerHTML = '';

      movies.forEach(movie => {
        const movieElement = document.createElement('div');
        movieElement.classList.add('movie-card');

        const posterUrl = movie.imageSet?.verticalPoster?.w240 || 'https://via.placeholder.com/240x360?text=No+Image';

        const castList = Array.isArray(movie.cast) && movie.cast.length > 0
          ? `<p class="cast-list"><strong>Cast:</strong> ${movie.cast.slice(0, 3).join(', ')}</p>`
          : '';

        const streaming = movie.streamingOptions?.us;
        let streamingHTML = '<h3>Streaming Options</h3>';

        if (Array.isArray(streaming) && streaming.length > 0) {
          streamingHTML += `
            <table class="streaming-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${streaming.map(s => {
            let expiryInfo = "Available";
            if (s.expiresSoon && s.expiresOn) {
              const date = new Date(s.expiresOn * 1000);
              expiryInfo = `<span class="expiring">Expires: ${date.toLocaleDateString()}</span>`;
            }

            return `
                    <tr>
                      <td><a href="${s.link}" target="_blank"><strong>${s.service?.name || 'Unknown'}</strong></a></td>
                      <td>${s.type || 'N/A'}</td>
                      <td>${s.price ? s.price.formatted : '--'}</td>
                      <td>${expiryInfo}</td>
                    </tr>
                  `;
          }).join('')}
              </tbody>
            </table>`;
        } else {
          streamingHTML += '<p>No streaming options available.</p>';
        }

        movieElement.innerHTML = `
          <div class="movie-content-layout">
            <img src="${posterUrl}" alt="${movie.title} poster" class="movie-poster">
            <div class="movie-info">
              <h2>
                ${movie.title}
                ${movie.releaseYear ? ` (${movie.releaseYear})` : ''}
              </h2>
              <div class="genres">
                ${(movie.genres || []).map(g => `<span class="genre-chip">${g.name}</span>`).join('')}
              </div>
              ${castList}
              <p class="overview">${movie.overview || 'No description available.'}</p>
              <div class="streaming-section">
                ${streamingHTML}
              </div>
            </div>
          </div>
        `;

        container.appendChild(movieElement);
      });
    })
    .catch(err => {
      document.getElementById('movie-results').textContent = "Error fetching movie data.";
      console.error("Fetch Error:", err);
    });
});
