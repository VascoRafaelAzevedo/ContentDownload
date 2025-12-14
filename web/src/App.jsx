import { useState } from 'react';
import SearchBar from './components/SearchBar';
import MovieList from './components/MovieList';
import MovieDetails from './components/MovieDetails';
import './App.css';

// URL do teu Worker Cloudflare - muda para o teu URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://teu-worker.workers.dev';

function App() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);

  const searchMovies = async (query) => {
    setLoading(true);
    setError(null);

    // Usa o worker Cloudflare com parâmetro q e pages
    const workerUrl = `${WORKER_URL}?q=${encodeURIComponent(query)}&pages=2`;

    try {
      const res = await fetch(workerUrl);
      
      if (res.status === 404) {
        setMovies([]);
        setError('Nenhum filme encontrado');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Erro ao comunicar com o servidor');
      }

      const data = await res.json();
      // O worker retorna diretamente um array de resultados
      setMovies(data || []);
    } catch (err) {
      setError(err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
  };

  const handleBack = () => {
    setSelectedMovie(null);
  };

  // Se há um filme selecionado, mostrar a página de detalhes
  if (selectedMovie) {
    return (
      <div className="app">
        <MovieDetails movie={selectedMovie} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>🎬 Movie List</h1>
      </header>
      <main>
        <SearchBar onSearch={searchMovies} />
        <MovieList 
          movies={movies} 
          loading={loading} 
          error={error} 
          onMovieClick={handleMovieClick}
        />
      </main>
    </div>
  );
}

export default App;
