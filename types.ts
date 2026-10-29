export interface NoteAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  id: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO Date string
  updatedAt: string;
  thumbnailUrl?: string;
  tags?: string[];
  attachments?: NoteAttachment[];
  meetingDate?: string;
  meetingVenue?: string;
  agenda?: string;
  meetingPriority?: string;
}

export interface User {
  id: string;
  name: string;
  full_name?: string;
  display_name?: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  can_access_welcome?: boolean;
  can_access_it?: boolean;
  can_access_pro?: boolean;
}

export enum RoutePath {
  HOME = '/',
  NOTES = '/notes',
  CREATE_NOTE = '/notes/new',
  EDIT_NOTE = '/notes/:id/edit',
  NOTE_DETAIL = '/notes/:id',
  ACCOUNT = '/account',
  SETTINGS = '/settings',
  LOGIN = '/login',
  SIGNUP = '/signup',
  FORGOT_PASSWORD = '/forgot-password',
  RESET_PASSWORD = '/reset-password',
  IT_DASHBOARD = '/it-dashboard',
  INVOICES = '/invoices',
  CREATE_INVOICE = '/invoices/new',
  EDIT_INVOICE = '/invoices/:id/edit',
  VENDORS = '/vendors',
  MAIL_ASSISTANT = '/mail',
}

export interface MailAccount {
  id: string;
  user_id: string;
  email: string;
  provider: string;
  imap_host: string;
  imap_port: number;
  smtp_host: string;
  smtp_port: number;
  username: string;
  password?: string;
  has_password?: boolean;
  auto_sync_interval: number;
  last_synced_at?: string;
  is_active: boolean;
  compose_signature?: string;
  reply_signature?: string;
  include_reply_signature?: boolean;
}

export interface MailMessage {
  id: string;
  account_id: string;
  user_id: string;
  folder: 'inbox' | 'sent' | 'starred' | 'trash' | 'drafts';
  message_id: string;
  from_address: string;
  from_name: string;
  to_address: string;
  cc_address?: string;
  reply_to_id?: string;
  is_replied?: boolean;
  replied_at?: string;
  thread_history?: MailMessage[];
  subject: string;
  snippet: string;
  body_text: string;
  body_html?: string;
  is_read: boolean;
  is_starred: boolean;
  received_at: string;
  created_at?: string;
}