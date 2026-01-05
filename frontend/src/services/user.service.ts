import api from '../config/api';
import {
  UserListItem,
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  ResetPasswordDto,
  RoleListItem,
  CreateRoleDto,
  UpdateRoleDto,
  PermissionListItem,
  UserFilters,
  RoleFilters,
  PaginatedResponse,
  UserStats
} from '../types/user.types';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  role: {
    id: string;
    code: string;
    name: string;
  };
  ministry?: {
    id: string;
    code: string;
    name: string;
    acronym: string;
  };
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface UserSettings {
  language: string;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
  };
  accessibility: {
    largeText: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
  privacy: {
    showEmail: boolean;
    showPhone: boolean;
    showOnlineStatus: boolean;
  };
}

class UserService {
  // === PROFIL UTILISATEUR ===
  async getProfile(): Promise<UserProfile> {
    const response = await api.get('/users/me');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du profil');
  }

  async updateProfile(data: UpdateProfileDto): Promise<UserProfile> {
    const response = await api.put('/users/me', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du profil');
  }

  async updateAvatar(avatar: string): Promise<UserProfile> {
    const response = await api.put('/users/me/avatar', { avatar });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'avatar');
  }

  // === PARAMÈTRES UTILISATEUR ===
  async getSettings(): Promise<UserSettings> {
    const response = await api.get('/users/me/settings');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des paramètres');
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await api.put('/users/me/settings', settings);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour des paramètres');
  }

  // === GESTION DES UTILISATEURS (ADMIN) ===
  async getUsers(filters?: UserFilters): Promise<PaginatedResponse<UserListItem>> {
    const response = await api.get('/users', { params: filters });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des utilisateurs');
  }

  async getUser(id: string): Promise<UserListItem> {
    const response = await api.get(`/users/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de l\'utilisateur');
  }

  async createUser(data: CreateUserDto): Promise<UserListItem> {
    const response = await api.post('/users', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création de l\'utilisateur');
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<UserListItem> {
    const response = await api.patch(`/users/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour de l\'utilisateur');
  }

  async deleteUser(id: string): Promise<void> {
    const response = await api.delete(`/users/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression de l\'utilisateur');
    }
  }

  async toggleUserStatus(id: string): Promise<UserListItem> {
    const response = await api.patch(`/users/${id}/toggle-status`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors du changement de statut de l\'utilisateur');
  }

  async changePassword(id: string, data: ChangePasswordDto): Promise<void> {
    const response = await api.patch(`/users/${id}/change-password`, data);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors du changement de mot de passe');
    }
  }

  async resetPassword(id: string, data: ResetPasswordDto): Promise<void> {
    const response = await api.patch(`/users/${id}/reset-password`, data);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la réinitialisation du mot de passe');
    }
  }

  async getUserStats(): Promise<UserStats> {
    const response = await api.get('/users/stats');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des statistiques');
  }

  // === RÔLES ===
  async getRoles(filters?: RoleFilters): Promise<PaginatedResponse<RoleListItem>> {
    const response = await api.get('/roles', { params: filters });
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des rôles');
  }

  async getRole(id: string): Promise<RoleListItem> {
    const response = await api.get(`/roles/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du rôle');
  }

  async createRole(data: CreateRoleDto): Promise<RoleListItem> {
    const response = await api.post('/roles', data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la création du rôle');
  }

  async updateRole(id: string, data: UpdateRoleDto): Promise<RoleListItem> {
    const response = await api.patch(`/roles/${id}`, data);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du rôle');
  }

  async deleteRole(id: string): Promise<void> {
    const response = await api.delete(`/roles/${id}`);
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Erreur lors de la suppression du rôle');
    }
  }

  // === PERMISSIONS ===
  async getPermissions(): Promise<PermissionListItem[]> {
    const response = await api.get('/permissions');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des permissions');
  }

  async getPermission(id: string): Promise<PermissionListItem> {
    const response = await api.get(`/permissions/${id}`);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération de la permission');
  }
}

const userService = new UserService();
export default userService;
