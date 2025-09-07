export interface Database {
  public: {
    Tables: {
      routes: {
        Row: {
          id: string
          short_name: string
          long_name: string
          color: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          short_name: string
          long_name: string
          color: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          short_name?: string
          long_name?: string
          color?: string
          active?: boolean
          created_at?: string
        }
      }
      shapes: {
        Row: {
          id: string
          route_id: string
          geom: any
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          geom: any
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          geom?: any
          created_at?: string
        }
      }
      stops: {
        Row: {
          id: string
          route_id: string
          name: string
          lat: number
          lng: number
          sequence: number
          created_at: string
        }
        Insert: {
          id?: string
          route_id: string
          name: string
          lat: number
          lng: number
          sequence: number
          created_at?: string
        }
        Update: {
          id?: string
          route_id?: string
          name?: string
          lat?: number
          lng?: number
          sequence?: number
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          label: string
          route_id: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          route_id: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          route_id?: string
          active?: boolean
          created_at?: string
        }
      }
      drivers: {
        Row: {
          user_id: string
          name: string
          assigned_vehicle: string
          active: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          assigned_vehicle: string
          active?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          name?: string
          assigned_vehicle?: string
          active?: boolean
          created_at?: string
        }
      }
      vehicle_positions: {
        Row: {
          id: string
          vehicle_id: string
          lat: number
          lng: number
          timestamp: string
          speed: number | null
          heading: number | null
          accuracy: number | null
          battery: number | null
          created_at: string
        }
        Insert: {
          id?: string
          vehicle_id: string
          lat: number
          lng: number
          timestamp: string
          speed?: number | null
          heading?: number | null
          accuracy?: number | null
          battery?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          vehicle_id?: string
          lat?: number
          lng?: number
          timestamp?: string
          speed?: number | null
          heading?: number | null
          accuracy?: number | null
          battery?: number | null
          created_at?: string
        }
      }
      vehicle_latest: {
        Row: {
          vehicle_id: string
          lat: number
          lng: number
          snapped_lat: number
          snapped_lng: number
          route_progress: number
          timestamp: string
          speed: number | null
          heading: number | null
          accuracy: number | null
          battery: number | null
          updated_at: string
        }
        Insert: {
          vehicle_id: string
          lat: number
          lng: number
          snapped_lat: number
          snapped_lng: number
          route_progress: number
          timestamp: string
          speed?: number | null
          heading?: number | null
          accuracy?: number | null
          battery?: number | null
          updated_at?: string
        }
        Update: {
          vehicle_id?: string
          lat?: number
          lng?: number
          snapped_lat?: number
          snapped_lng?: number
          route_progress?: number
          timestamp?: string
          speed?: number | null
          heading?: number | null
          accuracy?: number | null
          battery?: number | null
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          title: string
          message: string
          type: 'info' | 'warning' | 'urgent'
          active: boolean
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          message: string
          type: 'info' | 'warning' | 'urgent'
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          message?: string
          type?: 'info' | 'warning' | 'urgent'
          active?: boolean
          expires_at?: string | null
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          user_id: string
          role: 'admin' | 'driver' | 'student'
          created_at: string
        }
        Insert: {
          user_id: string
          role: 'admin' | 'driver' | 'student'
          created_at?: string
        }
        Update: {
          user_id?: string
          role?: 'admin' | 'driver' | 'student'
          created_at?: string
        }
      }
    }
    Views: {
      eta_to_stops: {
        Row: {
          vehicle_id: string
          stop_id: string
          stop_name: string
          estimated_arrival: string
          distance_km: number
        }
      }
    }
  }
}

export type UserRole = 'admin' | 'driver' | 'student'