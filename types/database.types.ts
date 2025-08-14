export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      reports: {
        Row: {
          id: string
          user_id: string
          company_name: string
          created_at: string
          sections: Json | null
          html_content: string | null
          sources: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          created_at?: string
          sections?: Json | null
          html_content?: string | null
          sources?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          created_at?: string
          sections?: Json | null
          html_content?: string | null
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      plans: {
        Row: {
          id: string
          name: string
          price: number
          monthly_limit: number
          research_access: boolean
          razorpay_plan_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          monthly_limit: number
          research_access?: boolean
          razorpay_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          monthly_limit?: number
          research_access?: boolean
          razorpay_plan_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          start_date: string
          end_date: string
          usage_count: number
          status: 'active' | 'expired' | 'cancelled'
          razorpay_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          start_date: string
          end_date: string
          usage_count?: number
          status?: 'active' | 'expired' | 'cancelled'
          razorpay_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          start_date?: string
          end_date?: string
          usage_count?: number
          status?: 'active' | 'expired' | 'cancelled'
          razorpay_subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 