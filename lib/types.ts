// Tipos da aplicação

export type UserRole = 'ADMIN' | 'USER';
export type EventStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  name: string;
  date: Date;
  description?: string;
  status: EventStatus;
  created_at: Date;
  updated_at: Date;
}

export interface UserEvent {
  id: string;
  userId: string;
  eventId: string;
  created_at: Date;
}

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  error?: string;
}

export interface SessionResponse {
  user: AuthUser | null;
}
