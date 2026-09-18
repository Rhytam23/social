import type { Database, InviteStatus, ConversationType } from './database';

export type { InviteStatus, ConversationType };

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type Invite = Database['public']['Tables']['invites']['Row'];
export type InviteInsert = Database['public']['Tables']['invites']['Insert'];
export type InviteUpdate = Database['public']['Tables']['invites']['Update'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type ConversationMember = Database['public']['Tables']['conversation_members']['Row'];
export type ConversationMemberInsert = Database['public']['Tables']['conversation_members']['Insert'];
export type ConversationMemberUpdate = Database['public']['Tables']['conversation_members']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
export type MessageUpdate = Database['public']['Tables']['messages']['Update'];

export type Reaction = Database['public']['Tables']['message_reactions']['Row'];
export type ReactionInsert = Database['public']['Tables']['message_reactions']['Insert'];

export type Receipt = Database['public']['Tables']['message_receipts']['Row'];
export type ReceiptInsert = Database['public']['Tables']['message_receipts']['Insert'];

export type Device = Database['public']['Tables']['user_devices']['Row'];
export type DeviceInsert = Database['public']['Tables']['user_devices']['Insert'];
export type DeviceUpdate = Database['public']['Tables']['user_devices']['Update'];

export type GroupKeyEnvelope = Database['public']['Tables']['group_key_envelopes']['Row'];
export type GroupKeyEnvelopeInsert = Database['public']['Tables']['group_key_envelopes']['Insert'];

export type Presence = Database['public']['Tables']['presence']['Row'];
export type PresenceInsert = Database['public']['Tables']['presence']['Insert'];
export type PresenceUpdate = Database['public']['Tables']['presence']['Update'];

export interface UserSession {
  id: string;
  email: string;
  isAdmin: boolean;
}
