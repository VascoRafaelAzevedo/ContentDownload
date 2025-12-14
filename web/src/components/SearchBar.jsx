import { useState } from 'react';
import './SearchBar.css';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Pesquisar filmes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Pesquisar</button>
    </form>
  );
}

export default SearchBar;
