// ==========================================================
// Neural-iA
// supabase-config.js
// Configuração pública do cliente Supabase
// ==========================================================

// A URL do projeto e a chave publishable/anon são próprias
// para uso no frontend. Chaves secretas de APIs externas
// permanecem exclusivamente nos Supabase Secrets.

export const SUPABASE_URL = "https://avqvecghixhrpqxucubn.supabase.co";

export const SUPABASE_ANON_KEY = "sb_publishable_lE2ZPtlhTh6OWr3S9Fb3rg_rLXHjkHH";

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const SUPABASE_HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY
};
