import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && anon);

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!url || !anon) {
    throw new Error(
      'Supabase nao configurado. Copie .env.example para .env e preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.',
    );
  }
  cliente ??= createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'montaje.cartorio.sessao' },
  });
  return cliente;
}
