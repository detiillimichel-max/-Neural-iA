// ==========================================================
// Neural-iA
// Core Constants
// Arquivo central de constantes do projeto
// ==========================================================

// ------------------------------
// Aplicação
// ------------------------------

export const APP = {
    NAME: "Neural-iA",
    VERSION: "1.0.0",
    AUTHOR: "Michel Detilli",
    LANGUAGE: "pt-BR"
};

// ------------------------------
// Supabase
// ------------------------------

export const SUPABASE = {
    FUNCTION_TIMEOUT: 30000,
    RETRY: 2
};

// ------------------------------
// Edge Functions
// ------------------------------

// Os nomes abaixo devem corresponder exatamente aos slugs
// das Edge Functions existentes no projeto Supabase.
export const EDGE = {

    AI: "ai-server_chat",

    SEARCH: "neural-search",

    BOOKS: "books-search",

    KNOWLEDGE: "knowledge-search",

    COMMONS: "commons-search",

    ARCHIVE: "archive-search",

    YOUTUBE: "youtube-videos",

    PEERTUBE: "peertube-videos",

    DAILYMOTION: "dailymotion-videos",

    TWITCH: "twitch-streams",

    VIMEO: "vimeo-videos",

    TMDB: "tmdb-media",

    NASA: "nasa",

    PAPERS: "papers-search",

    SPECIES: "species-search",

    EARTHQUAKES: "earthquakes",

    WEATHER: "weather",

    COUNTRIES: "countries-search",

    HOLIDAYS: "holidays",

    EXCHANGE: "exchange-rates",

    ADVICE: "advice-search",

    QUOTE: "quote-search",

    BIBLE: "bible-search",

    RECIPES: "recipes-search",

    FOOD: "food-search",

    POKEMON: "pokemon-search",

    RICKMORTY: "rickmorty-search"

};

// ------------------------------
// Modelos de IA
// ------------------------------

export const MODELS = {

    // Conversação / texto geral
    CHAT: "qwen/qwen-plus:free",

    // Programação / código
    CODER: "qwen/qwen-2.5-coder-32b-instruct:free",

    // Raciocínio avançado
    REASONING: "qwen/qwq-32b:free",

    // Visão / multimodal
    VISION: "qwen/qwen-2-vl-72b-instruct:free",

    // OCR / leitura visual
    OCR: "qwen/qwen-2-vl-72b-instruct:free",

    // Geração de imagem
    IMAGE: "qwen-image",

    // Geração de vídeo
    VIDEO: "wan2.1-t2v-turbo",

    // Modelos alternativos gratuitos
    DEEPSEEK_CHAT: "deepseek/deepseek-chat:free",

    DEEPSEEK_REASONING: "deepseek/deepseek-r1:free",

    LLAMA: "meta-llama/llama-3.3-70b-instruct:free"

};

// ------------------------------
// Cache
// ------------------------------

export const CACHE = {

    SEARCH: 300,

    WEATHER: 900,

    NEWS: 600,

    BOOKS: 3600

};

// ------------------------------
// Interface
// ------------------------------

export const UI = {

    DEFAULT_THEME: "dark",

    ENABLE_SOUND: true,

    ENABLE_NOTIFICATIONS: true

};
