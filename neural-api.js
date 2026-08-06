// Neural-iA — camada única de acesso às Edge Functions.
(() => {
  const cfg = window.NEURAL_CONFIG || {};
  const edgeBase = `${cfg.supabaseUrl}/functions/v1`;

  function getClient() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) throw new Error("Supabase não configurado: adicione a Publishable/anon key em supabase-config.js.");
    if (!window.supabase?.createClient) throw new Error("SDK do Supabase não carregado.");
    if (!window.__neuralSupabase) window.__neuralSupabase = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    return window.__neuralSupabase;
  }

  async function session() {
    const { data, error } = await getClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function requireToken() {
    const current = await session();
    if (!current?.access_token) throw new Error("AUTH_REQUIRED");
    return current.access_token;
  }

  async function invoke(name, body = {}) {
    const token = await requireToken();
    const response = await fetch(`${edgeBase}/${encodeURIComponent(name)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": cfg.supabaseAnonKey
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({ error: "INVALID_JSON_RESPONSE" }));
    if (!response.ok) {
      const err = new Error(data?.error || `EDGE_${response.status}`);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password) {
    const { data, error } = await getClient().auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  }

  window.NeuralAPI = Object.freeze({
    getClient, session, signIn, signUp, signOut, invoke,
    callAI: (prompt, type = "chat", imageBase64) => invoke("ai-server_chat", { prompt, type, ...(imageBase64 ? { imageBase64 } : {}) }),
    searchAdvice: query => invoke("advice-search", { query }),
    searchQuotes: query => invoke("quote-search", { query }),
    searchBible: query => invoke("bible-search", { query }),
    searchBooks: query => invoke("books-search", { query }),
    searchKnowledge: (query, lang = "pt") => invoke("knowledge-search", { query, lang }),
    searchCommons: query => invoke("commons-search", { query }),
    searchArchive: query => invoke("archive-search", { query }),
    weather: (latitude, longitude, forecast_days = 1) => invoke("weather", { latitude, longitude, forecast_days }),
    searchCountries: query => invoke("countries-search", { query }),
    holidays: (year, country = "BR") => invoke("holidays", { year, country }),
    exchangeRates: (from = "USD", to = "BRL", amount = 1) => invoke("exchange-rates", { from, to, amount }),
    searchFood: query => invoke("food-search", { query }),
    searchRecipes: query => invoke("recipes-search", { query }),
    searchPokemon: query => invoke("pokemon-search", { query }),
    searchRickMorty: query => invoke("rickmorty-search", { query }),
    searchSpecies: query => invoke("species-search", { query }),
    earthquakes: (period = "day", level = "all") => invoke("earthquakes", { period, level }),
    searchPapers: query => invoke("papers-search", { query }),
    nasa: options => invoke("nasa", options || {}),
    searchPeerTube: query => invoke("peertube-videos", { query }),
    searchDailymotion: query => invoke("dailymotion-videos", { query }),
    searchYouTube: query => invoke("youtube-videos", { query }),
    searchTwitch: query => invoke("twitch-streams", { query }),
    searchVimeo: query => invoke("vimeo-videos", { query }),
    searchTMDB: query => invoke("tmdb-media", { query })
  });
})();
