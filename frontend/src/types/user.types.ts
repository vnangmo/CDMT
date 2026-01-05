import { User, Role, Permission, Ministry } from './auth.types';

// Extension des types pour la gestion des utilisateurs
export interface UserListItem extends User {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  ministryId?: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleId?: string;
  ministryId?: string;
  isActive?: boolean;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordDto {
  newPassword: string;
  confirmPassword: string;
}

// Types pour les rôles et permissions
export interface RoleListItem extends Role {
  _count?: {
    users: number;
    permissions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  code: string;
  name: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface UpdateRoleDto {
  code?: string;
  name?: string;
  description?: string;
  permissionIds?: string[];
  isActive?: boolean;
}

export interface PermissionListItem extends Permission {
  createdAt: string;
  updatedAt: string;
}

// Types pour les filtres et pagination
export interface UserFilters {
  search?: string;
  roleId?: string;
  ministryId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface RoleFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les statistiques utilisateurs
export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    roleId: string;
    roleName: string;
    count: number;
  }[];
  byMinistry: {
    ministryId: string;
    ministryName: string;
    count: number;
  }[];
}

export type { User, Role, Permission, Ministry };
