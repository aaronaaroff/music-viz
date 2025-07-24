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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          website: string | null
          social_links: Json | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          social_links?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          website?: string | null
          social_links?: Json | null
        }
      }
      visualizations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          description: string | null
          settings: Json
          audio_file_url: string | null
          audio_file_name: string | null
          thumbnail_url: string | null
          is_public: boolean
          is_draft: boolean
          duration: number | null
          category: string | null
          tags: string[] | null
          likes_count: number
          comments_count: number
          saves_count: number
          views_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          description?: string | null
          settings: Json
          audio_file_url?: string | null
          audio_file_name?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          is_draft?: boolean
          duration?: number | null
          category?: string | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          saves_count?: number
          views_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          description?: string | null
          settings?: Json
          audio_file_url?: string | null
          audio_file_name?: string | null
          thumbnail_url?: string | null
          is_public?: boolean
          is_draft?: boolean
          duration?: number | null
          category?: string | null
          tags?: string[] | null
          likes_count?: number
          comments_count?: number
          saves_count?: number
          views_count?: number
        }
      }
      likes: {
        Row: {
          id: string
          created_at: string
          user_id: string
          visualization_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          visualization_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          visualization_id?: string
        }
      }
      saves: {
        Row: {
          id: string
          created_at: string
          user_id: string
          visualization_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          visualization_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          visualization_id?: string
        }
      }
      comments: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          visualization_id: string
          content: string
          parent_id: string | null
          likes_count: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          visualization_id: string
          content: string
          parent_id?: string | null
          likes_count?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          visualization_id?: string
          content?: string
          parent_id?: string | null
          likes_count?: number
        }
      }
      follows: {
        Row: {
          id: string
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          id?: string
          created_at?: string
          follower_id?: string
          following_id?: string
        }
      }
      categories: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          color: string | null
          icon: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          color?: string | null
          icon?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          color?: string | null
          icon?: string | null
        }
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
  }
}