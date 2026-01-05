import api from '../config/api';

export interface AppSettings {
  general: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    allowRegistration: boolean;
  };
  security: {
    sessionTimeout: number;
    passwordMinLength: number;
    requireStrongPassword: boolean;
    twoFactorAuth: boolean;
    ipWhitelisting: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpFrom: string;
    enableEmailNotifications: boolean;
  };
  storage: {
    maxFileSize: number;
    allowedFileTypes: string;
    storageQuota: number;
  };
}

class SettingsService {
  /**
   * Get all application settings (Admin only)
   */
  async getSettings(): Promise<AppSettings> {
    const response = await api.get('/settings');
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération des paramètres');
  }

  /**
   * Update application settings (Admin only)
   */
  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await api.put('/settings', settings);
    if (response.data.status === 'success') {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour des paramètres');
  }

  /**
   * Get specific setting by key (Admin only)
   * @param key - Dot notation key (e.g., "general.appName")
   */
  async getSettingByKey(key: string): Promise<any> {
    const response = await api.get(`/settings/${key}`);
    if (response.data.status === 'success') {
      return response.data.data.value;
    }
    throw new Error(response.data.message || 'Erreur lors de la récupération du paramètre');
  }

  /**
   * Update specific setting by key (Admin only)
   * @param key - Dot notation key (e.g., "general.appName")
   * @param value - New value
   */
  async updateSettingByKey(key: string, value: any): Promise<any> {
    const response = await api.put(`/settings/${key}`, { value });
    if (response.data.status === 'success') {
      return response.data.data.value;
    }
    throw new Error(response.data.message || 'Erreur lors de la mise à jour du paramètre');
  }
}

const settingsService = new SettingsService();
export default settingsService;
