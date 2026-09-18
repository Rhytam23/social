# 03_ARCHITECTURE.md — System Architecture & Diagrams

This document details the high-level system architecture, client/server boundaries, module responsibilities, and key system workflows of the **Private Chat** application.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    subgraph Client ["Client Browser (Next.js Frontend & E2EE Crypto Engine)"]
        UI["React UI Shell / App Layout"]
        State["React Component State / Context"]
        SignalStore["SignalKeyStore (IndexedDB Local Key Storage)"]
        SignalEngine["@signalapp/libsignal-client (WASM)"]
        WebCrypto["Web Crypto API (AES-256-GCM Attachment Engine)"]
    end

    subgraph Supabase ["Supabase Cloud Backend"]
        Auth["Supabase Auth Engine"]
        Storage["Supabase Private Storage Bucket ('attachments')"]
        
        subgraph Database ["PostgreSQL Database with Row Level Security"]
            Profiles["public.profiles"]
            Invites["public.invites"]
            Convs["public.conversations"]
            Members["public.conversation_members"]
            Msgs["public.messages (Ciphertext Only)"]
            Devices["public.user_devices (Public Prekeys)"]
            Envelopes["public.group_key_envelopes"]
            Presence["public.presence"]
            ConsumeRPC["consume_invite() RPC"]
        end
    end

    UI --> State
    State --> SignalEngine
    SignalEngine <--> SignalStore
    State --> WebCrypto
    UI --> Auth
    UI --> Storage
    State <--> Msgs
    State <--> Devices
    State <--> Envelopes
    Auth --> Profiles
    UI --> ConsumeRPC
```

---

## 2. Authentication & Invite Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    actor NewUser
    participant NextServer as Next.js Server Route
    participant RPC as consume_invite() RPC
    participant DB as PostgreSQL Database

    Admin->>NextServer: POST /api/invites (assignedEmail)
    NextServer->>DB: INSERT into public.invites (token_hash, assigned_email)
    NextServer-->>Admin: Return raw invite token URL
    Admin->>NewUser: Distribute token URL securely
    NewUser->>NextServer: Submit Registration Form (token, password)
    NextServer->>RPC: SELECT consume_invite(token_hash, user_id, email)
    Note over RPC,DB: Locks invite row with FOR UPDATE
    RPC-->>NextServer: Return Success Status
    NextServer-->>NewUser: Registration Complete
```

---

## 3. 1-to-1 Encrypted Message Flow

```mermaid
sequenceDiagram
    autonumber
    actor Alice
    actor Bob
    participant DB as Supabase DB (public.messages)

    Alice->>DB: Query Bob's Prekey Bundle (public.user_devices)
    DB-->>Alice: Return Bob's Identity & Signed Prekeys
    Alice->>Alice: Establish Outbound Signal Session (Double Ratchet)
    Alice->>Alice: signalEncrypt(plaintext) -> Ciphertext + Nonce
    Alice->>DB: INSERT into public.messages (ciphertext, nonce)
    DB-->>Bob: Realtime Delivery / Query Messages
    Bob->>Bob: Inspect Nonce & Match Local Session
    Bob->>Bob: signalDecrypt(ciphertext) -> Decrypted Plaintext
```

---

## 4. Group Encrypted Message Flow

```mermaid
sequenceDiagram
    autonumber
    actor Sender
    actor Recipient
    participant DB as Supabase DB

    Sender->>Sender: Create SenderKeyDistributionMessage
    Sender->>Sender: Encrypt SenderKey via 1-to-1 Signal channel for Recipient
    Sender->>DB: INSERT into public.group_key_envelopes
    DB-->>Recipient: Deliver Encrypted Group Key Envelope
    Recipient->>Recipient: Decrypt Envelope & Store Sender Key
    Sender->>Sender: groupEncrypt(messageText, distributionId)
    Sender->>DB: INSERT into public.messages (ciphertext, nonce)
    DB-->>Recipient: Deliver Encrypted Group Message
    Recipient->>Recipient: groupDecrypt(ciphertext) -> Plaintext
```

---

## 5. End-to-End Encryption & Data Flow

```mermaid
graph LR
    subgraph ClientSide ["Client Cryptographic Isolation"]
        Plaintext["Plaintext Input"] --> SignalEngine["@signalapp/libsignal-client"]
        Keys["IndexedDB KeyStore"] <--> SignalEngine
        SignalEngine --> Ciphertext["Encrypted Ciphertext + Nonce"]
        
        File["Raw File Buffer"] --> AESGCM["Web Crypto AES-256-GCM"]
        AESGCM --> EncryptedFile["Encrypted File Buffer + B64 Key/IV"]
    end

    subgraph Transport ["Network Boundary (TLS / HTTPS)"]
        Ciphertext --> SupabaseDB["Supabase public.messages"]
        EncryptedFile --> SupabaseStorage["Supabase Storage 'attachments'"]
    end
```

---

## 6. Entity Relationship Diagram (Database Schema)

```mermaid
erDiagram
    PROFILES ||--o{ INVITES : "created / used"
    PROFILES ||--o{ CONVERSATION_MEMBERS : "belongs to"
    PROFILES ||--o{ MESSAGES : "sends"
    PROFILES ||--o{ USER_DEVICES : "owns"
    PROFILES ||--o{ PRESENCE : "maintains"
    CONVERSATIONS ||--o{ CONVERSATION_MEMBERS : "contains"
    CONVERSATIONS ||--o{ MESSAGES : "holds"
    CONVERSATIONS ||--o{ GROUP_KEY_ENVELOPES : "scopes"
    MESSAGES ||--o{ MESSAGE_REACTIONS : "receives"
    MESSAGES ||--o{ MESSAGE_RECEIPTS : "tracks"

    PROFILES {
        uuid id PK
        string username
        string display_name
        boolean is_admin
        timestamptz created_at
    }

    INVITES {
        uuid id PK
        string token_hash
        string assigned_email
        string status
        timestamptz expires_at
    }

    CONVERSATIONS {
        uuid id PK
        string type
        string name
        uuid created_by
    }

    CONVERSATION_MEMBERS {
        uuid conversation_id PK, FK
        uuid user_id PK, FK
        timestamptz joined_at
        timestamptz left_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        string ciphertext
        string nonce
        int encryption_version
    }

    USER_DEVICES {
        uuid id PK
        uuid user_id FK
        string device_id
        string identity_public_key
        string signed_prekey
    }

    GROUP_KEY_ENVELOPES {
        uuid id PK
        uuid conversation_id FK
        uuid user_id FK
        string device_id
        string encrypted_group_key
        int key_version
    }
```

---

## 7. Main Frontend Component Structure

```mermaid
graph TD
    AppShell["AppShell (Main Layout Container)"] --> Header["Header (App Title, Search, User Status)"]
    AppShell --> NavDeck["NavDeck (Navigation & Conversation Sidebar)"]
    AppShell --> MobileNav["MobileNav (Mobile Bottom Navigation)"]
    AppShell --> MainContent["Main Content Area"]

    MainContent --> ChatCanvas["ChatCanvas (Active Conversation View)"]
    MainContent --> PeopleDirectory["PeopleDirectory (User Directory & Prekeys)"]
    MainContent --> GroupSpaceView["GroupSpaceView (Group Member Management)"]
    MainContent --> SecuritySettings["SecuritySettings (Key Backup & Device List)"]
    MainContent --> AdminDashboard["AdminDashboard (Invite & User Admin)"]

    ChatCanvas --> MessageItem["MessageItem (Encrypted Message Render)"]
    ChatCanvas --> MessageComposer["MessageComposer (Input, File Encryptor)"]
    ChatCanvas --> InspectorDeck["InspectorDeck (E2EE Session Debugger)"]

    MessageItem --> ForwardModal["ForwardMessageModal"]
    MessageItem --> MessageInfo["MessageInfoModal"]
    MessageComposer --> VoicePreview["VoiceMessagePreview"]
```
