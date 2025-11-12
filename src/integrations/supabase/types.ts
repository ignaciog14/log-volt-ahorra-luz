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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alertas: {
        Row: {
          descripcion: string
          electrodomestico_id: number | null
          fecha_creacion: string | null
          hogar_id: number
          id: number
          leida: boolean | null
          severidad: Database["public"]["Enums"]["severidad"] | null
          titulo: string
        }
        Insert: {
          descripcion: string
          electrodomestico_id?: number | null
          fecha_creacion?: string | null
          hogar_id: number
          id?: number
          leida?: boolean | null
          severidad?: Database["public"]["Enums"]["severidad"] | null
          titulo: string
        }
        Update: {
          descripcion?: string
          electrodomestico_id?: number | null
          fecha_creacion?: string | null
          hogar_id?: number
          id?: number
          leida?: boolean | null
          severidad?: Database["public"]["Enums"]["severidad"] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alertas_electrodomestico_id_fkey"
            columns: ["electrodomestico_id"]
            isOneToOne: false
            referencedRelation: "electrodomesticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alertas_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      cambios_electrodomestico: {
        Row: {
          campo_modificado: string
          electrodomestico_id: number
          id: number
          timestamp_cambio: string | null
          usuario_id: string
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_modificado: string
          electrodomestico_id: number
          id?: number
          timestamp_cambio?: string | null
          usuario_id: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_modificado?: string
          electrodomestico_id?: number
          id?: number
          timestamp_cambio?: string | null
          usuario_id?: string
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cambios_electrodomestico_electrodomestico_id_fkey"
            columns: ["electrodomestico_id"]
            isOneToOne: false
            referencedRelation: "electrodomesticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cambios_electrodomestico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comparativa_promedios: {
        Row: {
          consumo_kwh_promedio: number
          id: number
          region: string
          tipo_electrodomestico: string
          tipo_habitacion: string
        }
        Insert: {
          consumo_kwh_promedio: number
          id?: number
          region: string
          tipo_electrodomestico: string
          tipo_habitacion: string
        }
        Update: {
          consumo_kwh_promedio?: number
          id?: number
          region?: string
          tipo_electrodomestico?: string
          tipo_habitacion?: string
        }
        Relationships: []
      }
      comunas: {
        Row: {
          id: number
          nombre: string
          region: string
        }
        Insert: {
          id?: number
          nombre: string
          region: string
        }
        Update: {
          id?: number
          nombre?: string
          region?: string
        }
        Relationships: []
      }
      consumo_diario: {
        Row: {
          activo: boolean
          consumo_kwh_registrado: number
          electrodomestico_id: number
          fecha: string
          horas_uso_registradas: number
          id: number
        }
        Insert: {
          activo?: boolean
          consumo_kwh_registrado: number
          electrodomestico_id: number
          fecha: string
          horas_uso_registradas: number
          id?: number
        }
        Update: {
          activo?: boolean
          consumo_kwh_registrado?: number
          electrodomestico_id?: number
          fecha?: string
          horas_uso_registradas?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "consumo_diario_electrodomestico_id_fkey"
            columns: ["electrodomestico_id"]
            isOneToOne: false
            referencedRelation: "electrodomesticos"
            referencedColumns: ["id"]
          },
        ]
      }
      electrodomesticos: {
        Row: {
          activo: boolean | null
          consumo_kwh_ajustado: number | null
          es_personalizado: boolean | null
          habitacion_id: number
          horas_uso_diarias: number | null
          id: number
          nombre_personalizado: string | null
          tipo_id: number | null
        }
        Insert: {
          activo?: boolean | null
          consumo_kwh_ajustado?: number | null
          es_personalizado?: boolean | null
          habitacion_id: number
          horas_uso_diarias?: number | null
          id?: number
          nombre_personalizado?: string | null
          tipo_id?: number | null
        }
        Update: {
          activo?: boolean | null
          consumo_kwh_ajustado?: number | null
          es_personalizado?: boolean | null
          habitacion_id?: number
          horas_uso_diarias?: number | null
          id?: number
          nombre_personalizado?: string | null
          tipo_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "electrodomesticos_habitacion_id_fkey"
            columns: ["habitacion_id"]
            isOneToOne: false
            referencedRelation: "habitaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "electrodomesticos_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_electrodomestico"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas_electricas: {
        Row: {
          id: number
          nombre: string
          region: string
        }
        Insert: {
          id?: number
          nombre: string
          region: string
        }
        Update: {
          id?: number
          nombre?: string
          region?: string
        }
        Relationships: []
      }
      habitaciones: {
        Row: {
          activo: boolean | null
          hogar_id: number
          id: number
          nombre: string
          orden: number | null
          tipo: Database["public"]["Enums"]["tipo_habitacion"]
        }
        Insert: {
          activo?: boolean | null
          hogar_id: number
          id?: number
          nombre: string
          orden?: number | null
          tipo: Database["public"]["Enums"]["tipo_habitacion"]
        }
        Update: {
          activo?: boolean | null
          hogar_id?: number
          id?: number
          nombre?: string
          orden?: number | null
          tipo?: Database["public"]["Enums"]["tipo_habitacion"]
        }
        Relationships: [
          {
            foreignKeyName: "habitaciones_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      hogares: {
        Row: {
          activo: boolean
          area_m2: number | null
          comuna_id: number | null
          direccion: string | null
          empresa_electrica_id: number | null
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: number
          limite_costo_mensual: number | null
          limite_kwh_diario: number | null
          nombre: string
          numero_personas: number | null
          usuario_id: string
        }
        Insert: {
          activo?: boolean
          area_m2?: number | null
          comuna_id?: number | null
          direccion?: string | null
          empresa_electrica_id?: number | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: number
          limite_costo_mensual?: number | null
          limite_kwh_diario?: number | null
          nombre: string
          numero_personas?: number | null
          usuario_id: string
        }
        Update: {
          activo?: boolean
          area_m2?: number | null
          comuna_id?: number | null
          direccion?: string | null
          empresa_electrica_id?: number | null
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: number
          limite_costo_mensual?: number | null
          limite_kwh_diario?: number | null
          nombre?: string
          numero_personas?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hogares_comuna_id_fkey"
            columns: ["comuna_id"]
            isOneToOne: false
            referencedRelation: "comunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hogares_empresa_electrica_id_fkey"
            columns: ["empresa_electrica_id"]
            isOneToOne: false
            referencedRelation: "empresas_electricas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hogares_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_consumo: {
        Row: {
          consumo_kwh_meta: number | null
          costo_pesos_meta: number | null
          estado: Database["public"]["Enums"]["estado_meta"] | null
          fecha_creacion: string | null
          hogar_id: number
          id: number
          mes_ano: string
        }
        Insert: {
          consumo_kwh_meta?: number | null
          costo_pesos_meta?: number | null
          estado?: Database["public"]["Enums"]["estado_meta"] | null
          fecha_creacion?: string | null
          hogar_id: number
          id?: number
          mes_ano: string
        }
        Update: {
          consumo_kwh_meta?: number | null
          costo_pesos_meta?: number | null
          estado?: Database["public"]["Enums"]["estado_meta"] | null
          fecha_creacion?: string | null
          hogar_id?: number
          id?: number
          mes_ano?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_consumo_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          apellido: string
          email: string
          fecha_actualizacion: string | null
          fecha_creacion: string | null
          id: string
          is_active: boolean | null
          nombre: string
          telefono: string | null
          ultimo_login: string | null
        }
        Insert: {
          apellido: string
          email: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id: string
          is_active?: boolean | null
          nombre: string
          telefono?: string | null
          ultimo_login?: string | null
        }
        Update: {
          apellido?: string
          email?: string
          fecha_actualizacion?: string | null
          fecha_creacion?: string | null
          id?: string
          is_active?: boolean | null
          nombre?: string
          telefono?: string | null
          ultimo_login?: string | null
        }
        Relationships: []
      }
      recomendaciones: {
        Row: {
          ahorro_potencial_pesos: number | null
          descripcion: string
          electrodomestico_id: number | null
          estado: Database["public"]["Enums"]["estado_recomendacion"] | null
          fecha_creacion: string | null
          hogar_id: number
          id: number
          prioridad: Database["public"]["Enums"]["prioridad"] | null
          titulo: string
        }
        Insert: {
          ahorro_potencial_pesos?: number | null
          descripcion: string
          electrodomestico_id?: number | null
          estado?: Database["public"]["Enums"]["estado_recomendacion"] | null
          fecha_creacion?: string | null
          hogar_id: number
          id?: number
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          titulo: string
        }
        Update: {
          ahorro_potencial_pesos?: number | null
          descripcion?: string
          electrodomestico_id?: number | null
          estado?: Database["public"]["Enums"]["estado_recomendacion"] | null
          fecha_creacion?: string | null
          hogar_id?: number
          id?: number
          prioridad?: Database["public"]["Enums"]["prioridad"] | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "recomendaciones_electrodomestico_id_fkey"
            columns: ["electrodomestico_id"]
            isOneToOne: false
            referencedRelation: "electrodomesticos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recomendaciones_hogar_id_fkey"
            columns: ["hogar_id"]
            isOneToOne: false
            referencedRelation: "hogares"
            referencedColumns: ["id"]
          },
        ]
      }
      tarifas_electricas: {
        Row: {
          comuna_id: number
          empresa_electrica_id: number
          id: number
          tarifa_punta_pesos_kwh: number
          tarifa_valle_pesos_kwh: number
        }
        Insert: {
          comuna_id: number
          empresa_electrica_id: number
          id?: number
          tarifa_punta_pesos_kwh: number
          tarifa_valle_pesos_kwh: number
        }
        Update: {
          comuna_id?: number
          empresa_electrica_id?: number
          id?: number
          tarifa_punta_pesos_kwh?: number
          tarifa_valle_pesos_kwh?: number
        }
        Relationships: [
          {
            foreignKeyName: "tarifas_electricas_comuna_id_fkey"
            columns: ["comuna_id"]
            isOneToOne: false
            referencedRelation: "comunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarifas_electricas_empresa_electrica_id_fkey"
            columns: ["empresa_electrica_id"]
            isOneToOne: false
            referencedRelation: "empresas_electricas"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_electrodomestico: {
        Row: {
          activo: boolean
          categoria: Database["public"]["Enums"]["categoria_electrodomestico"]
          consumo_kwh_predeterminado: number
          id: number
          nombre: string
          potencia_watt: number
        }
        Insert: {
          activo?: boolean
          categoria: Database["public"]["Enums"]["categoria_electrodomestico"]
          consumo_kwh_predeterminado: number
          id?: number
          nombre: string
          potencia_watt: number
        }
        Update: {
          activo?: boolean
          categoria?: Database["public"]["Enums"]["categoria_electrodomestico"]
          consumo_kwh_predeterminado?: number
          id?: number
          nombre?: string
          potencia_watt?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_consumo_hogar: {
        Args: { hogar_id_param: number }
        Returns: number
      }
      user_owns_electrodomestico: {
        Args: { _electrodomestico_id: number }
        Returns: boolean
      }
      user_owns_habitacion: {
        Args: { _habitacion_id: number }
        Returns: boolean
      }
      user_owns_hogar: { Args: { _hogar_id: number }; Returns: boolean }
    }
    Enums: {
      categoria_electrodomestico:
        | "refrigeracion"
        | "lavado"
        | "climatizacion"
        | "cocina"
        | "entretenimiento"
        | "iluminacion"
        | "computacion"
        | "otros"
      estado_meta: "active" | "completed" | "failed"
      estado_recomendacion: "pending" | "viewed" | "applied" | "dismissed"
      prioridad: "low" | "medium" | "high"
      severidad: "info" | "warning" | "critical"
      tipo_habitacion:
        | "cocina"
        | "dormitorio"
        | "bano"
        | "living"
        | "comedor"
        | "lavanderia"
        | "estudio"
        | "garage"
        | "patio"
        | "otro"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_electrodomestico: [
        "refrigeracion",
        "lavado",
        "climatizacion",
        "cocina",
        "entretenimiento",
        "iluminacion",
        "computacion",
        "otros",
      ],
      estado_meta: ["active", "completed", "failed"],
      estado_recomendacion: ["pending", "viewed", "applied", "dismissed"],
      prioridad: ["low", "medium", "high"],
      severidad: ["info", "warning", "critical"],
      tipo_habitacion: [
        "cocina",
        "dormitorio",
        "bano",
        "living",
        "comedor",
        "lavanderia",
        "estudio",
        "garage",
        "patio",
        "otro",
      ],
    },
  },
} as const
