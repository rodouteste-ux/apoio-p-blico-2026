export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      responsaveis: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          telefone: string | null;
          cidade_base: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          telefone?: string | null;
          cidade_base?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          telefone?: string | null;
          cidade_base?: string | null;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      pre_candidatos: {
        Row: {
          id: string;
          nome: string;
          cargo: string;
          ativo: boolean;
          ordem: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cargo: string;
          ativo?: boolean;
          ordem?: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          cargo?: string;
          ativo?: boolean;
          ordem?: number;
          criado_em?: string;
        };
        Relationships: [];
      };
      cadastros_apoio: {
        Row: {
          id: string;
          responsavel_id: string;
          nome_completo: string;
          telefone: string;
          telefone_normalizado: string;
          cpf: string | null;
          cpf_normalizado: string | null;
          lideranca_nome: string | null;
          lideranca_slug: string | null;
          cidade: string;
          cidade_moradia: string | null;
          cidade_votacao: string | null;
          bairro: string;
          rua_numero: string;
          local_votacao: string | null;
          observacoes: string | null;
          ip_origem: string | null;
          user_agent: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          responsavel_id: string;
          nome_completo: string;
          telefone: string;
          telefone_normalizado: string;
          cpf?: string | null;
          cpf_normalizado?: string | null;
          lideranca_nome?: string | null;
          lideranca_slug?: string | null;
          cidade: string;
          cidade_moradia?: string | null;
          cidade_votacao?: string | null;
          bairro: string;
          rua_numero: string;
          local_votacao?: string | null;
          observacoes?: string | null;
          ip_origem?: string | null;
          user_agent?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          responsavel_id?: string;
          nome_completo?: string;
          telefone?: string;
          telefone_normalizado?: string;
          cpf?: string | null;
          cpf_normalizado?: string | null;
          lideranca_nome?: string | null;
          lideranca_slug?: string | null;
          cidade?: string;
          cidade_moradia?: string | null;
          cidade_votacao?: string | null;
          bairro?: string;
          rua_numero?: string;
          local_votacao?: string | null;
          observacoes?: string | null;
          ip_origem?: string | null;
          user_agent?: string | null;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cadastros_apoio_responsavel_id_fkey";
            columns: ["responsavel_id"];
            isOneToOne: false;
            referencedRelation: "responsaveis";
            referencedColumns: ["id"];
          },
        ];
      };
      apoios_candidatos: {
        Row: {
          id: string;
          cadastro_id: string;
          pre_candidato_id: string | null;
          cargo: string;
          nome_pre_candidato: string;
          criado_em: string;
        };
        Insert: {
          id?: string;
          cadastro_id: string;
          pre_candidato_id?: string | null;
          cargo: string;
          nome_pre_candidato: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          cadastro_id?: string;
          pre_candidato_id?: string | null;
          cargo?: string;
          nome_pre_candidato?: string;
          criado_em?: string;
        };
        Relationships: [
          {
            foreignKeyName: "apoios_candidatos_cadastro_id_fkey";
            columns: ["cadastro_id"];
            isOneToOne: false;
            referencedRelation: "cadastros_apoio";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "apoios_candidatos_pre_candidato_id_fkey";
            columns: ["pre_candidato_id"];
            isOneToOne: false;
            referencedRelation: "pre_candidatos";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          nome: string | null;
          role: "super_admin" | "admin" | "visualizador";
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          nome?: string | null;
          role?: "super_admin" | "admin" | "visualizador";
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          nome?: string | null;
          role?: "super_admin" | "admin" | "visualizador";
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_admin_dashboard_metrics: {
        Args: {
          p_start_of_day: string;
        };
        Returns: {
          total_cadastros: number;
          cadastros_hoje: number;
          total_cidades: number;
          total_apoios: number;
          responsaveis_ativos: number;
          pre_candidatos_ativos: number;
          pre_candidatos_inativos: number;
        }[];
      };
      count_distinct_cidades: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      apoios_ranking: {
        Args: Record<PropertyKey, never>;
        Returns: {
          nome_pre_candidato: string;
          cargo: string;
          total_apoios: number;
          pre_candidato_id: string | null;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
