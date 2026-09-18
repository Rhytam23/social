export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InviteStatus = 'pending' | 'used' | 'revoked' | 'expired';
export type ConversationType = 'private' | 'group';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          phone_number: string | null;
          email: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          phone_number?: string | null;
          email?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          phone_number?: string | null;
          email?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      invites: {
        Row: {
          id: string;
          token_hash: string;
          assigned_email: string;
          created_by: string | null;
          status: InviteStatus;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token_hash: string;
          assigned_email: string;
          created_by?: string | null;
          status?: InviteStatus;
          expires_at: string;
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token_hash?: string;
          assigned_email?: string;
          created_by?: string | null;
          status?: InviteStatus;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          type: ConversationType;
          name: string | null;
          avatar_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: ConversationType;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: ConversationType;
          name?: string | null;
          avatar_url?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          left_at?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          ciphertext: string;
          nonce: string;
          encryption_version: number;
          reply_to_message_id: string | null;
          created_at: string;
          edited_at: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          ciphertext: string;
          nonce: string;
          encryption_version?: number;
          reply_to_message_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          ciphertext?: string;
          nonce?: string;
          encryption_version?: number;
          reply_to_message_id?: string | null;
          created_at?: string;
          edited_at?: string | null;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      message_reactions: {
        Row: {
          message_id: string;
          user_id: string;
          reaction: string;
          created_at: string;
        };
        Insert: {
          message_id: string;
          user_id: string;
          reaction: string;
          created_at?: string;
        };
        Update: {
          message_id?: string;
          user_id?: string;
          reaction?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      message_receipts: {
        Row: {
          message_id: string;
          user_id: string;
          delivered_at: string | null;
          read_at: string | null;
        };
        Insert: {
          message_id: string;
          user_id: string;
          delivered_at?: string | null;
          read_at?: string | null;
        };
        Update: {
          message_id?: string;
          user_id?: string;
          delivered_at?: string | null;
          read_at?: string | null;
        };
        Relationships: [];
      };
      user_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          identity_public_key: string;
          signed_prekey: string;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          identity_public_key: string;
          signed_prekey: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          identity_public_key?: string;
          signed_prekey?: string;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      group_key_envelopes: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          device_id: string;
          encrypted_group_key: string;
          key_version: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          device_id: string;
          encrypted_group_key: string;
          key_version?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          user_id?: string;
          device_id?: string;
          encrypted_group_key?: string;
          key_version?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      presence: {
        Row: {
          user_id: string;
          online: boolean;
          last_seen: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          online?: boolean;
          last_seen?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          online?: boolean;
          last_seen?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      consume_invite: {
        Args: {
          p_token_hash: string;
          p_user_id: string;
          p_assigned_email: string;
        };
        Returns: {
          success: boolean;
          message: string;
          invite_id?: string;
        };
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_conversation_member: {
        Args: {
          p_conversation_id: string;
        };
        Returns: boolean;
      };
      shares_conversation_with: {
        Args: {
          p_other_user_id: string;
        };
        Returns: boolean;
      };
      is_valid_group_key_recipient: {
        Args: {
          p_conversation_id: string;
          p_user_id: string;
          p_device_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      invite_status: InviteStatus;
      conversation_type: ConversationType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
