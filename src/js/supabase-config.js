// ==========================================================
// Neural-iA
// supabase-config.js
// Cliente central do Supabase
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://avqvecghixhrpqxucubn.supabase.co";

// Chave publishable do projeto.
// Nunca colocar aqui chaves secretas de APIs externas.
export const SUPABASE_ANON_KEY = "sb_publishable_lE2ZPtlhTh6OWr3S9Fb3rg_rLXHjkHH";

export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

export const SUPABASE_HEADERS = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON_KEY
};

// Cliente único usado pelo frontend.
// A sessão autenticada, quando existir, é usada automaticamente
// nas chamadas às Edge Functions que exigem JWT.
export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);
