export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  lastLogin?: string;
  role: Role;
  ministry?: Ministry | null;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  description?: string;
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canValidate: boolean;
}

export interface Ministry {
  id: string;
  code: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  ministryId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
