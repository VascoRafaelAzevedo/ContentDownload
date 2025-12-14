/**
 * Movie Details Worker
 * 
 * Recebe o ID do filme (TMDB) e retorna:
 * - Detalhes do filme via TMDB API (título, data, resumo, língua, rating, géneros, trailer)
 * - Links de torrents via scraping do YTS
 */

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const YTS_BASE_URL = 'https://www.yts-official.cc';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Converte o título do filme para o formato do URL do YTS
 * Exemplos:
 * - "Wake Up Dead Man: A Knives Out Mystery" -> "wake-up-dead-man-a-knives-out-mystery"
 * - "S.W.A.T" -> "s-w-a-t"
 * - "A.I. Artificial Intelligence" -> "a-i-artificial-intelligence"
 * - "Mamma Mia! Here We Go Again" -> "mamma-mia-here-we-go-again"
 * - "Mission: Impossible - The Final Reckoning" -> "mission-impossible-the-final-reckoning"
 * - "1917: One Year, Two Revolutions" -> "1917-one-year-two-revolutions"
 */
function parseMovieTitle(title) {
  return title
    .toLowerCase()
    // Remover pontos entre letras isoladas (S.W.A.T -> S W A T, A.I. -> A I)
    .replace(/\.(?=[a-z])/gi, ' ')
    // Remover pontos no final de palavras
    .replace(/\./g, '')
    // Substituir : por nada (já que vai ser seguido de espaço normalmente)
    .replace(/:/g, '')
    // Substituir ! por nada
    .replace(/!/g, '')
    // Substituir , por nada
    .replace(/,/g, '')
    // Substituir - por espaço (para depois normalizar)
    .replace(/-/g, ' ')
    // Substituir múltiplos espaços por um só
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
    // Substituir espaços por hífens
    .replace(/\s/g, '-');
}

/**
 * Constrói o URL do YTS para o filme
 */
function buildYtsUrl(title, year) {
  const parsedTitle = parseMovieTitle(title);
  return `${YTS_BASE_URL}/movies/${parsedTitle}-${year}/`;
}

/**
 * Faz scraping ao YTS para obter os links de torrents
 */
async function scrapeTorrents(title, year) {
  const url = buildYtsUrl(title, year);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log(`YTS page not found for: ${url}`);
      return [];
    }

    const html = await response.text();
    
    // Procurar pelo parágrafo com class="hidden-xs hidden-sm" que contém os links
    // Regex para encontrar os links de torrent dentro do parágrafo
    const torrentRegex = /<a\s+href="(\/torrent\/[^"]+\.torrent)"\s+rel="nofollow"\s+title="[^"]*">([^<]+)<\/a>/g;
    
    const torrents = [];
    let match;
    
    while ((match = torrentRegex.exec(html)) !== null) {
      const torrentPath = match[1];
      const quality = match[2];
      
      // Construir URL completo do torrent
      const torrentUrl = `${YTS_BASE_URL}${torrentPath}`;
      
      torrents.push({
        quality,
        url: torrentUrl
      });
    }

    return torrents;
  } catch (error) {
    console.error('Error scraping YTS:', error);
    return [];
  }
}

/**
 * Busca os detalhes do filme na API do TMDB
 */
async function fetchMovieDetails(movieId, apiKey) {
  // Buscar detalhes básicos e vídeos (para trailer) numa só chamada
  const url = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&append_to_response=videos&language=pt-PT`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    // Tentar em inglês se não encontrar em português
    const urlEn = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${apiKey}&append_to_response=videos&language=en-US`;
    const responseEn = await fetch(urlEn);
    
    if (!responseEn.ok) {
      throw new Error('Movie not found in TMDB');
    }
    
    return responseEn.json();
  }
  
  return response.json();
}

/**
 * Extrai o URL do trailer do YouTube dos vídeos do TMDB
 */
function extractTrailerUrl(videos) {
  if (!videos || !videos.results || videos.results.length === 0) {
    return null;
  }

  // Procurar primeiro por trailer oficial
  let trailer = videos.results.find(
    v => v.type === 'Trailer' && v.site === 'YouTube' && v.official === true
  );

  // Se não encontrar, procurar qualquer trailer do YouTube
  if (!trailer) {
    trailer = videos.results.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    );
  }

  // Se ainda não encontrar, procurar qualquer vídeo do YouTube
  if (!trailer) {
    trailer = videos.results.find(v => v.site === 'YouTube');
  }

  if (trailer) {
    return `https://www.youtube.com/watch?v=${trailer.key}`;
  }

  return null;
}

export default {
  async fetch(request, env) {
    // Responder a preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const movieId = url.searchParams.get('id');
    const title = url.searchParams.get('title');
    const year = url.searchParams.get('year');

    // Validar parâmetros
    if (!movieId) {
      return new Response(JSON.stringify({ error: 'Missing movie ID parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!title || !year) {
      return new Response(JSON.stringify({ error: 'Missing title or year parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    try {
      // Buscar detalhes do TMDB e torrents em paralelo
      const [tmdbData, torrents] = await Promise.all([
        fetchMovieDetails(movieId, env.TMDB_API_KEY),
        scrapeTorrents(title, year)
      ]);

      // Construir resposta
      const response = {
        id: tmdbData.id,
        title: tmdbData.title,
        original_title: tmdbData.original_title,
        release_date: tmdbData.release_date,
        overview: tmdbData.overview,
        language: tmdbData.original_language,
        rating: tmdbData.vote_average,
        vote_count: tmdbData.vote_count,
        genres: tmdbData.genres ? tmdbData.genres.map(g => g.name) : [],
        runtime: tmdbData.runtime,
        poster_path: tmdbData.poster_path,
        backdrop_path: tmdbData.backdrop_path,
        trailer_url: extractTrailerUrl(tmdbData.videos),
        torrents: torrents,
        yts_url: buildYtsUrl(title, year)
      };

      return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });

    } catch (error) {
      console.error('Error fetching movie details:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  },
};
