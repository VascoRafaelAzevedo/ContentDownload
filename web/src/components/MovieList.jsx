import MovieCard from './MovieCard';
import './MovieList.css';

function MovieList({ movies, loading, error, onMovieClick }) {
  if (loading) {
    return <div className="message">A carregar...</div>;
  }

  if (error) {
    return <div className="message error">{error}</div>;
  }

  if (movies.length === 0) {
    return <div className="message">Pesquisa por um filme para começar</div>;
  }

  return (
    <div className="movie-list">
      {movies.map((movie) => (
        <MovieCard 
          key={`${movie.media_type}-${movie.id}`} 
          movie={movie} 
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
}

export default MovieList;
