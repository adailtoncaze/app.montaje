import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Indica se as variaveis de ambiente do Supabase foram configuradas. */
export const supabaseConfigurado = Boolean(url && anon);

let cliente: SupabaseClient | null = null;

/**
 * Cliente Supabase (singleton, criado sob demanda).
 * Sessao persistida no aparelho para uso offline (RF-E02).
 */
export function supabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      'Supabase nao configurado. Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    );
  }
  cliente ??= createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'montaje.sessao',
    },
  });
  return cliente;
}
