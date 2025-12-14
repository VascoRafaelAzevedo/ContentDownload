import './MovieCard.css';

const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w300';

function MovieCard({ movie, onClick }) {
  const posterUrl = movie.poster_path
    ? `${IMG_BASE_URL}${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=Sem+Poster';

  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const isTV = movie.media_type === 'tv';

  return (
    <div className="movie-card" onClick={() => onClick(movie)}>
      <div className="poster-container">
        <img src={posterUrl} alt={movie.title} />
        <span className={`media-badge ${isTV ? 'tv' : 'movie'}`}>
          {isTV ? '📺 Série' : '🎬 Filme'}
        </span>
      </div>
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="year">{year}</p>
        <p className="rating">⭐ {movie.vote_average?.toFixed(1) || 'N/A'}</p>
      </div>
    </div>
  );
}

export default MovieCard;
