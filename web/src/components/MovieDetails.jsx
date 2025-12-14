import { useState, useEffect } from 'react';
import './MovieDetails.css';

const IMG_BASE_URL = 'https://image.tmdb.org/t/p';
const DETAILS_WORKER_URL = import.meta.env.VITE_DETAILS_WORKER_URL || 'http://localhost:8787';

function MovieDetails({ movie, onBack }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const year = movie.release_date ? movie.release_date.split('-')[0] : null;
  const isTV = movie.media_type === 'tv';

  useEffect(() => {
    const fetchDetails = async () => {
      // Para séries, não fazemos scraping de torrents (por agora)
      if (isTV) {
        setDetails({
          ...movie,
          genres: [],
          torrents: [],
          trailer_url: null
        });
        setLoading(false);
        return;
      }

      if (!year) {
        setError('Ano não disponível');
        setLoading(false);
        return;
      }

      try {
        const url = `${DETAILS_WORKER_URL}?id=${movie.id}&title=${encodeURIComponent(movie.title)}&year=${year}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Erro ao carregar detalhes');
        }

        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [movie, year, isTV]);

  const backdropUrl = movie.backdrop_path
    ? `${IMG_BASE_URL}/w1280${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `${IMG_BASE_URL}/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=Sem+Poster';

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getLanguageName = (code) => {
    const languages = {
      en: 'Inglês',
      pt: 'Português',
      es: 'Espanhol',
      fr: 'Francês',
      de: 'Alemão',
      it: 'Italiano',
      ja: 'Japonês',
      ko: 'Coreano',
      zh: 'Chinês',
      hi: 'Hindi',
      ru: 'Russo'
    };
    return languages[code] || code?.toUpperCase() || 'N/A';
  };

  return (
    <div className="movie-details">
      {backdropUrl && (
        <div 
          className="backdrop" 
          style={{ backgroundImage: `url(${backdropUrl})` }}
        />
      )}
      
      <button className="back-button" onClick={onBack}>
        ← Voltar
      </button>

      <div className="details-content">
        <div className="poster-section">
          <img src={posterUrl} alt={movie.title} />
        </div>

        <div className="info-section">
          <div className="title-row">
            <h1>{movie.title}</h1>
            <span className={`media-type-badge ${isTV ? 'tv' : 'movie'}`}>
              {isTV ? 'Série' : 'Filme'}
            </span>
          </div>

          {details?.original_title && details.original_title !== movie.title && (
            <p className="original-title">{details.original_title}</p>
          )}

          <div className="meta-info">
            <span>
              <span className="label">Lançamento</span>
              <span className="value">{formatDate(details?.release_date || movie.release_date)}</span>
            </span>
            <span>
              <span className="label">Avaliação</span>
              <span className="rating-value">{(details?.rating || movie.vote_average)?.toFixed(1) || 'N/A'}</span>
              {details?.vote_count && <small>({details.vote_count})</small>}
            </span>
            <span>
              <span className="label">Idioma</span>
              <span className="value">{getLanguageName(details?.language || movie.original_language)}</span>
            </span>
            {details?.runtime && (
              <span>
                <span className="label">Duração</span>
                <span className="value">{Math.floor(details.runtime / 60)}h {details.runtime % 60}min</span>
              </span>
            )}
          </div>

          {loading ? (
            <div className="loading-details">A carregar detalhes...</div>
          ) : error ? (
            <div className="error-details">{error}</div>
          ) : (
            <>
              {details?.genres && details.genres.length > 0 && (
                <div className="genres">
                  {details.genres.map((genre, index) => (
                    <span key={index} className="genre-tag">{genre}</span>
                  ))}
                </div>
              )}

              <div className="overview">
                <h3>Sinopse</h3>
                <p>{details?.overview || movie.overview || 'Sem sinopse disponível.'}</p>
              </div>

              {details?.trailer_url && (
                <div className="actions">
                  <a 
                    href={details.trailer_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-trailer"
                  >
                    <span className="play-icon"></span>
                    Ver Trailer
                  </a>
                </div>
              )}

              {!isTV && (
                <div className="downloads-section">
                  <h3>Downloads</h3>
                  {details?.torrents && details.torrents.length > 0 ? (
                    <div className="torrent-buttons">
                      {details.torrents.map((torrent, index) => (
                        <a
                          key={index}
                          href={torrent.url}
                          className="btn btn-download"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {torrent.quality}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="no-downloads">Download não disponível</p>
                  )}
                </div>
              )}

              {isTV && (
                <div className="downloads-section">
                  <h3>Downloads</h3>
                  <p className="no-downloads">Download de séries ainda não disponível</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MovieDetails;
