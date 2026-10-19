import type {
  Etapa,
  MotivoDesvio,
  Papel,
  StatusEtapa,
  StatusItem,
  StatusValidacao,
  TipoItem,
  Vinculo,
} from './enums';

/**
 * Tipos das tabelas do Supabase (contrato congelado / Sprint 0).
 * Substituir/expandir com `supabase gen types typescript --local`
 * quando o banco local estiver disponivel.
 */

export interface Perfil {
  id: string;
  nome: string;
  matricula: string;
  papel: Papel;
  vinculo: Vinculo;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Equipe {
  id: string;
  nome: string;
  lider_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembroEquipe {
  id: string;
  equipe_id: string;
  perfil_id: string;
  lider: boolean;
}

export interface Local {
  id: string;
  zona: number;
  nome: string;
  endereco: string | null;
}

export interface Secao {
  id: string;
  local_id: string;
  numero: number;
  status_etapa1: StatusEtapa;
  status_etapa2: StatusEtapa;
  conforme: boolean;
  updated_at: string;
}

export interface LayoutPadrao {
  id: string;
  caminho_imagem: string;
  versao: number;
  ativo: boolean;
  created_at: string;
}

export interface ModeloChecklist {
  id: string;
  etapa: Etapa;
  nome: string;
  tipo: TipoItem;
  exige_foto: boolean;
  foto_numero: number | null;
  ordem: number;
  ativo: boolean;
}

export interface Cronograma {
  id: string;
  data: string;
  etapa: Etapa;
  equipe_id: string;
  local_id: string;
  ordem: number | null;
}

export interface ItemChecklist {
  id: string;
  secao_id: string;
  modelo_id: string | null;
  etapa: Etapa;
  tipo: TipoItem;
  nome: string;
  foto_numero: number | null;
  ordem: number | null;
  status: StatusItem;
  resposta: boolean | null;
  observacao: string | null;
  updated_at: string;
}

export interface Evidencia {
  id: string;
  item_id: string;
  caminho_foto: string | null;
  caminho_miniatura: string | null;
  capturada_em: string | null;
  latitude: number | null;
  longitude: number | null;
  autor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RespostaSigilo {
  id: string;
  secao_id: string;
  pergunta: string;
  critica: boolean;
  resposta: boolean | null;
  autor_id: string | null;
  updated_at: string;
}

export interface Desvio {
  id: string;
  item_id: string;
  motivo: MotivoDesvio;
  observacao: string | null;
  created_at: string;
}

export interface Validacao {
  id: string;
  secao_id: string;
  validador_id: string;
  etapa: Etapa;
  status: StatusValidacao;
  comentario: string | null;
  item_devolvido: string | null;
  data: string;
}
