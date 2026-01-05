import api from '../config/api';
import { User, LoginCredentials, AuthResponse } from '../types/auth.types';

class AuthService {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);

    if (response.data.status === 'success') {
      const { user, token, refreshToken } = response.data.data;

      // Stocker les tokens et les infos utilisateur
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { user, token, refreshToken };
    }

    throw new Error(response.data.message || 'Erreur de connexion');
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  /**
   * Rafraîchir le token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('Aucun refresh token disponible');
    }

    const response = await api.post('/auth/refresh', { refreshToken });

    if (response.data.status === 'success') {
      const { token } = response.data.data;
      localStorage.setItem('accessToken', token);
      return token;
    }

    throw new Error(response.data.message || 'Erreur lors du rafraîchissement du token');
  }

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  async getMe(): Promise<{ user: User }> {
    const response = await api.get('/auth/me');

    if (response.data.status === 'success') {
      const { user } = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return { user };
    }

    throw new Error(response.data.message || 'Erreur lors de la récupération du profil');
  }

  /**
   * Obtenir l'utilisateur courant
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erreur lors du parsing de l\'utilisateur:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Vérifier si l'utilisateur a une permission
   */
  hasPermission(permissionCode: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role.permissions.some(p => p.code === permissionCode);
  }

  /**
   * Vérifier si l'utilisateur a un rôle
   */
  hasRole(roleCode: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    return user.role.code === roleCode;
  }
}

// Export de l'instance
const authService = new AuthService();
export default authService;
export { authService };
