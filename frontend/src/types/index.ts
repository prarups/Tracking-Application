export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'VIEWER';

export interface CustomRole {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  user_count?: number;
  created_at?: string;
}

export interface User {
  id: number;
  employee_id?: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  custom_role?: number | null;
  custom_role_details?: CustomRole | null;
  avatar?: string;
  phone_number?: string;
  is_mfa_enabled: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface Group {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  lead?: number;
  lead_details?: User;
  member_count: number;
  permissions?: Record<string, any>;
  created_at: string;
}

export interface Project {
  id: number;
  key: string;
  name: string;
  description?: string;
  group: number;
  group_details?: Group;
  lead?: number;
  lead_details?: User;
  is_active: boolean;
  created_at: string;
}

export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'RICH_TEXT'
  | 'NUMBER'
  | 'EMAIL'
  | 'PHONE'
  | 'DATE'
  | 'DATETIME'
  | 'DROPDOWN'
  | 'SEARCHABLE_DROPDOWN'
  | 'MULTI_SELECT'
  | 'CHECKBOX'
  | 'RADIO'
  | 'TOGGLE'
  | 'USER_PICKER'
  | 'GROUP_PICKER'
  | 'IMAGE_UPLOAD'
  | 'FILE_UPLOAD'
  | 'COLOR_PICKER';

export interface CustomField {
  id: number;
  field_key: string;
  label: string;
  field_type: FieldType;
  group?: number;
  project?: number;
  is_required: boolean;
  default_value?: any;
  options?: string[];
  validation_rules?: Record<string, any>;
  conditional_logic?: Record<string, any>;
  display_order: number;
  is_active: boolean;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type TicketStatus = 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'IN_REVIEW' | 'REOPEN' | 'DONE' | 'CLOSED';

export interface Attachment {
  id: number;
  ticket: number;
  uploaded_by: number;
  uploaded_by_details?: User;
  file: string;
  thumbnail?: string;
  original_filename: string;
  file_size_bytes: number;
  mime_type: string;
  is_compressed: boolean;
  created_at: string;
}

export interface CustomFieldValue {
  id: number;
  custom_field: number;
  field_key: string;
  field_label: string;
  value: any;
}

export interface Ticket {
  id: number;
  ticket_number: string;
  title: string;
  description?: string;
  acceptance_criteria?: string;
  priority: Priority;
  status: TicketStatus;
  start_date?: string;
  due_date?: string;
  project: number;
  project_details?: Project;
  assigned_group: number;
  assigned_group_details?: Group;
  assigned_user?: number;
  assigned_user_details?: User;
  reporter: number;
  reporter_details?: User;
  watchers: number[];
  labels: string[];
  parent_ticket?: number;
  dependencies: number[];
  story_points: number;
  custom_values: CustomFieldValue[];
  attachments: Attachment[];
  subtask_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  ticket: number;
  attachment?: number;
  author: number;
  author_details?: User;
  parent?: number;
  content: string;
  is_pinned: boolean;
  edit_history?: { content: string; edited_at: string }[];
  mentions: number[];
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  recipient: number;
  actor: number;
  actor_details?: User;
  ticket?: number;
  ticket_number?: string;
  verb: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  ticket?: number;
  ticket_number?: string;
  actor: number;
  actor_details?: User;
  action_type: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface GlobalSearchResult {
  tickets: {
    id: number;
    ticket_number: string;
    title: string;
    status: TicketStatus;
    priority: Priority;
    group_name: string;
    assigned_username: string;
  }[];
  comments: {
    id: number;
    ticket_id: number;
    ticket_number: string;
    author: string;
    snippet: string;
  }[];
  users: {
    id: number;
    username: string;
    email: string;
    role: Role;
  }[];
  groups: {
    id: number;
    code: string;
    name: string;
    color: string;
    icon: string;
  }[];
  projects: {
    id: number;
    key: string;
    name: string;
  }[];
}
