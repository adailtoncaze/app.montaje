export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cronograma: {
        Row: {
          data: string
          equipe_id: string
          etapa: number
          id: string
          local_id: string
          ordem: number | null
        }
        Insert: {
          data: string
          equipe_id: string
          etapa: number
          id?: string
          local_id: string
          ordem?: number | null
        }
        Update: {
          data?: string
          equipe_id?: string
          etapa?: number
          id?: string
          local_id?: string
          ordem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cronograma_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
        ]
      }
      desvios: {
        Row: {
          created_at: string
          id: string
          item_id: string
          motivo: Database["public"]["Enums"]["motivo_desvio"]
          observacao: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          motivo: Database["public"]["Enums"]["motivo_desvio"]
          observacao?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          motivo?: Database["public"]["Enums"]["motivo_desvio"]
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "desvios_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          created_at: string
          id: string
          lider_id: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lider_id?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lider_id?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_lider_id_fkey"
            columns: ["lider_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      evidencias: {
        Row: {
          autor_id: string | null
          caminho_foto: string | null
          caminho_miniatura: string | null
          capturada_em: string | null
          created_at: string
          id: string
          item_id: string
          latitude: number | null
          longitude: number | null
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          caminho_foto?: string | null
          caminho_miniatura?: string | null
          capturada_em?: string | null
          created_at?: string
          id: string
          item_id: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          caminho_foto?: string | null
          caminho_miniatura?: string | null
          capturada_em?: string | null
          created_at?: string
          id?: string
          item_id?: string
          latitude?: number | null
          longitude?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidencias_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidencias_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
          },
        ]
      }
      itens_checklist: {
        Row: {
          etapa: number
          foto_numero: number | null
          id: string
          modelo_id: string | null
          nome: string
          observacao: string | null
          ordem: number | null
          resposta: boolean | null
          secao_id: string
          status: Database["public"]["Enums"]["status_item"]
          tipo: Database["public"]["Enums"]["tipo_item"]
          updated_at: string
        }
        Insert: {
          etapa: number
          foto_numero?: number | null
          id?: string
          modelo_id?: string | null
          nome: string
          observacao?: string | null
          ordem?: number | null
          resposta?: boolean | null
          secao_id: string
          status?: Database["public"]["Enums"]["status_item"]
          tipo?: Database["public"]["Enums"]["tipo_item"]
          updated_at?: string
        }
        Update: {
          etapa?: number
          foto_numero?: number | null
          id?: string
          modelo_id?: string | null
          nome?: string
          observacao?: string | null
          ordem?: number | null
          resposta?: boolean | null
          secao_id?: string
          status?: Database["public"]["Enums"]["status_item"]
          tipo?: Database["public"]["Enums"]["tipo_item"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_checklist_modelo_id_fkey"
            columns: ["modelo_id"]
            isOneToOne: false
            referencedRelation: "modelo_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_checklist_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      layout_padrao: {
        Row: {
          ativo: boolean
          caminho_imagem: string
          created_at: string
          id: string
          versao: number
        }
        Insert: {
          ativo?: boolean
          caminho_imagem: string
          created_at?: string
          id?: string
          versao?: number
        }
        Update: {
          ativo?: boolean
          caminho_imagem?: string
          created_at?: string
          id?: string
          versao?: number
        }
        Relationships: []
      }
      locais: {
        Row: {
          endereco: string | null
          id: string
          nome: string
          zona: number
        }
        Insert: {
          endereco?: string | null
          id?: string
          nome: string
          zona: number
        }
        Update: {
          endereco?: string | null
          id?: string
          nome?: string
          zona?: number
        }
        Relationships: []
      }
      membros_equipe: {
        Row: {
          equipe_id: string
          id: string
          lider: boolean
          perfil_id: string
        }
        Insert: {
          equipe_id: string
          id?: string
          lider?: boolean
          perfil_id: string
        }
        Update: {
          equipe_id?: string
          id?: string
          lider?: boolean
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membros_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membros_equipe_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
      modelo_checklist: {
        Row: {
          ativo: boolean
          etapa: number
          exige_foto: boolean
          foto_numero: number | null
          id: string
          nome: string
          ordem: number
          tipo: Database["public"]["Enums"]["tipo_item"]
        }
        Insert: {
          ativo?: boolean
          etapa: number
          exige_foto?: boolean
          foto_numero?: number | null
          id?: string
          nome: string
          ordem: number
          tipo?: Database["public"]["Enums"]["tipo_item"]
        }
        Update: {
          ativo?: boolean
          etapa?: number
          exige_foto?: boolean
          foto_numero?: number | null
          id?: string
          nome?: string
          ordem?: number
          tipo?: Database["public"]["Enums"]["tipo_item"]
        }
        Relationships: []
      }
      perfis: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          matricula: string
          nome: string
          papel: Database["public"]["Enums"]["papel_usuario"]
          updated_at: string
          vinculo: Database["public"]["Enums"]["vinculo_usuario"]
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id: string
          matricula: string
          nome: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          updated_at?: string
          vinculo?: Database["public"]["Enums"]["vinculo_usuario"]
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          matricula?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel_usuario"]
          updated_at?: string
          vinculo?: Database["public"]["Enums"]["vinculo_usuario"]
        }
        Relationships: []
      }
      respostas_sigilo: {
        Row: {
          autor_id: string | null
          critica: boolean
          id: string
          pergunta: string
          resposta: boolean | null
          secao_id: string
          updated_at: string
        }
        Insert: {
          autor_id?: string | null
          critica?: boolean
          id?: string
          pergunta: string
          resposta?: boolean | null
          secao_id: string
          updated_at?: string
        }
        Update: {
          autor_id?: string | null
          critica?: boolean
          id?: string
          pergunta?: string
          resposta?: boolean | null
          secao_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "respostas_sigilo_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respostas_sigilo_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
        ]
      }
      secoes: {
        Row: {
          conforme: boolean
          id: string
          local_id: string
          numero: number
          status_etapa1: Database["public"]["Enums"]["status_etapa"]
          status_etapa2: Database["public"]["Enums"]["status_etapa"]
          updated_at: string
        }
        Insert: {
          conforme?: boolean
          id?: string
          local_id: string
          numero: number
          status_etapa1?: Database["public"]["Enums"]["status_etapa"]
          status_etapa2?: Database["public"]["Enums"]["status_etapa"]
          updated_at?: string
        }
        Update: {
          conforme?: boolean
          id?: string
          local_id?: string
          numero?: number
          status_etapa1?: Database["public"]["Enums"]["status_etapa"]
          status_etapa2?: Database["public"]["Enums"]["status_etapa"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secoes_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locais"
            referencedColumns: ["id"]
          },
        ]
      }
      validacoes: {
        Row: {
          comentario: string | null
          data: string
          etapa: number
          id: string
          item_devolvido: string | null
          secao_id: string
          status: Database["public"]["Enums"]["status_validacao"]
          validador_id: string
        }
        Insert: {
          comentario?: string | null
          data?: string
          etapa: number
          id?: string
          item_devolvido?: string | null
          secao_id: string
          status: Database["public"]["Enums"]["status_validacao"]
          validador_id: string
        }
        Update: {
          comentario?: string | null
          data?: string
          etapa?: number
          id?: string
          item_devolvido?: string | null
          secao_id?: string
          status?: Database["public"]["Enums"]["status_validacao"]
          validador_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "validacoes_item_devolvido_fkey"
            columns: ["item_devolvido"]
            isOneToOne: false
            referencedRelation: "itens_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validacoes_secao_id_fkey"
            columns: ["secao_id"]
            isOneToOne: false
            referencedRelation: "secoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "validacoes_validador_id_fkey"
            columns: ["validador_id"]
            isOneToOne: false
            referencedRelation: "perfis"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fc_materializar_itens: { Args: { p_secao: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      is_cartorio: { Args: never; Returns: boolean }
      minhas_equipes: { Args: never; Returns: string[] }
      pode_ver_item: { Args: { p_item: string }; Returns: boolean }
      pode_ver_secao: { Args: { p_secao: string }; Returns: boolean }
      rpc_alterar_status_etapa: {
        Args: {
          p_etapa: number
          p_novo: Database["public"]["Enums"]["status_etapa"]
          p_secao: string
        }
        Returns: undefined
      }
      rpc_materializar_secao: { Args: { p_secao: string }; Returns: undefined }
      rpc_reabrir_etapa: {
        Args: { p_etapa: number; p_motivo: string; p_secao: string }
        Returns: undefined
      }
    }
    Enums: {
      motivo_desvio:
        | "espaco_insuficiente"
        | "estrutura_local"
        | "mobiliario"
        | "outro"
      papel_usuario: "equipe" | "validador" | "administrador"
      status_etapa:
        | "pendente"
        | "em_montagem"
        | "enviada"
        | "aprovada"
        | "correcao_solicitada"
      status_item: "pendente" | "conforme" | "nao_conforme"
      status_validacao: "aprovada" | "correcao_solicitada" | "reabertura"
      tipo_item: "confirmacao" | "foto"
      vinculo_usuario: "servidor" | "alvt"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      motivo_desvio: [
        "espaco_insuficiente",
        "estrutura_local",
        "mobiliario",
        "outro",
      ],
      papel_usuario: ["equipe", "validador", "administrador"],
      status_etapa: [
        "pendente",
        "em_montagem",
        "enviada",
        "aprovada",
        "correcao_solicitada",
      ],
      status_item: ["pendente", "conforme", "nao_conforme"],
      status_validacao: ["aprovada", "correcao_solicitada", "reabertura"],
      tipo_item: ["confirmacao", "foto"],
      vinculo_usuario: ["servidor", "alvt"],
    },
  },
} as const
