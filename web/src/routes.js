import MovieDetails from './components/MovieDetails';
import MovieList from './components/MovieList';

export const routes = [
  {
    path: '/',
    element: <MovieList />,
  },
  {
    path: '/movie/:id',
    element: <MovieDetails />,
  },
];
