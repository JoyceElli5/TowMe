/**
 * Database types for Supabase
 * These types represent the database schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type UserRole = 'vehicle_owner' | 'tow_operator';
export type RequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
export type VehicleType = 'car' | 'suv' | 'saloon' | 'van' | 'truck' | 'motorcycle' | 'others';
export type VehicleCondition = 'good' | 'damaged' | 'needs_attention';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type NotificationType = 'request' | 'status_update' | 'rating' | 'payment';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          role: UserRole;
          avatar_url: string | null;
          average_rating: number;
          total_trips: number;
          is_online: boolean;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone: string;
          role: UserRole;
          avatar_url?: string | null;
          average_rating?: number;
          total_trips?: number;
          is_online?: boolean;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string;
          role?: UserRole;
          avatar_url?: string | null;
          average_rating?: number;
          total_trips?: number;
          is_online?: boolean;
          is_verified?: boolean;
          updated_at?: string;
        };
      };
      towing_requests: {
        Row: {
          id: string;
          user_id: string;
          operator_id: string | null;
          pickup_address: string;
          destination_address: string;
          pickup_lat: number;
          pickup_lng: number;
          destination_lat: number;
          destination_lng: number;
          vehicle_type: VehicleType;
          estimated_price: number;
          final_price: number | null;
          distance_km: number;
          status: RequestStatus;
          cancellation_reason: string | null;
          created_at: string;
          accepted_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          operator_id?: string | null;
          pickup_address: string;
          destination_address: string;
          pickup_lat: number;
          pickup_lng: number;
          destination_lat: number;
          destination_lng: number;
          vehicle_type: VehicleType;
          estimated_price: number;
          final_price?: number | null;
          distance_km: number;
          status?: RequestStatus;
          cancellation_reason?: string | null;
          created_at?: string;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          operator_id?: string | null;
          final_price?: number | null;
          status?: RequestStatus;
          cancellation_reason?: string | null;
          accepted_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          request_id: string;
          from_user_id: string;
          to_user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          from_user_id: string;
          to_user_id: string;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string | null;
        };
      };
      inspections: {
        Row: {
          id: string;
          request_id: string;
          operator_id: string;
          photos: string[];
          vehicle_condition: VehicleCondition;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          operator_id: string;
          photos: string[];
          vehicle_condition: VehicleCondition;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          photos?: string[];
          vehicle_condition?: VehicleCondition;
          notes?: string | null;
        };
      };
      operator_locations: {
        Row: {
          id: string;
          operator_id: string;
          request_id: string | null;
          latitude: number;
          longitude: number;
          heading: number | null;
          speed: number | null;
          timestamp: string;
        };
        Insert: {
          id?: string;
          operator_id: string;
          request_id?: string | null;
          latitude: number;
          longitude: number;
          heading?: number | null;
          speed?: number | null;
          timestamp?: string;
        };
        Update: {
          latitude?: number;
          longitude?: number;
          heading?: number | null;
          speed?: number | null;
          timestamp?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read?: boolean;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
      };
      payments: {
        Row: {
          id: string;
          request_id: string;
          user_id: string;
          operator_id: string;
          amount: number;
          status: PaymentStatus;
          payment_method: string;
          transaction_reference: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          request_id: string;
          user_id: string;
          operator_id: string;
          amount: number;
          status?: PaymentStatus;
          payment_method: string;
          transaction_reference: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: PaymentStatus;
          completed_at?: string | null;
        };
      };
      messages: {
        Row: {
          id: string;
          request_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          content?: string;
          is_read?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      request_status: RequestStatus;
      vehicle_type: VehicleType;
      vehicle_condition: VehicleCondition;
      payment_status: PaymentStatus;
      notification_type: NotificationType;
    };
  };
}

// Helper types for database operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type User = Tables<'users'>;
export type TowingRequest = Tables<'towing_requests'>;
export type Rating = Tables<'ratings'>;
export type Inspection = Tables<'inspections'>;
export type OperatorLocation = Tables<'operator_locations'>;
export type Notification = Tables<'notifications'>;
export type Payment = Tables<'payments'>;
export type Message = Tables<'messages'>;
