/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** URL pública do app da equipe (QR code da tela "App da equipe"). */
  readonly VITE_URL_EQUIPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
