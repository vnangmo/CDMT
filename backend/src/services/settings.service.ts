/**
 * Application Settings Service
 * Stores settings in database as key-value pairs
 */

import prisma from '../config/database';
import { Prisma } from '@prisma/client';

interface AppSettings {
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

// Default settings for initialization
const defaultSettings: AppSettings = {
  general: {
    appName: 'CDMT Djibouti',
    appVersion: '1.0.0',
    maintenanceMode: false,
    allowRegistration: false,
  },
  security: {
    sessionTimeout: 30,
    passwordMinLength: 8,
    requireStrongPassword: true,
    twoFactorAuth: false,
    ipWhitelisting: false,
  },
  email: {
    smtpHost: 'smtp.finances.dj',
    smtpPort: 587,
    smtpUser: 'noreply@finances.dj',
    smtpFrom: 'CDMT System <noreply@finances.dj>',
    enableEmailNotifications: true,
  },
  storage: {
    maxFileSize: 10,
    allowedFileTypes: '.pdf,.xlsx,.docx',
    storageQuota: 1000,
  },
};

export class SettingsService {
  /**
   * Initialize default settings in database if they don't exist
   */
  private static async initializeDefaults(): Promise<void> {
    const settingsCount = await prisma.appSettings.count();

    if (settingsCount === 0) {
      // Flatten default settings and insert into database
      const settingsToCreate = [];

      for (const [category, values] of Object.entries(defaultSettings)) {
        for (const [key, value] of Object.entries(values)) {
          settingsToCreate.push({
            key: `${category}.${key}`,
            value: value as Prisma.InputJsonValue,
            category: category,
            description: null,
          });
        }
      }

      await prisma.appSettings.createMany({
        data: settingsToCreate,
      });
    }
  }

  /**
   * Convert flat settings from database to nested structure
   */
  private static buildSettingsObject(dbSettings: any[]): AppSettings {
    const settings: any = {
      general: {},
      security: {},
      email: {},
      storage: {},
    };

    for (const setting of dbSettings) {
      const [category, field] = setting.key.split('.');
      if (category && field && settings[category]) {
        settings[category][field] = setting.value;
      }
    }

    return settings as AppSettings;
  }

  /**
   * Get all settings
   */
  static async getAll(): Promise<AppSettings> {
    // Initialize defaults if needed
    await this.initializeDefaults();

    // Fetch all settings from database
    const dbSettings = await prisma.appSettings.findMany({
      orderBy: { key: 'asc' },
    });

    return this.buildSettingsObject(dbSettings);
  }

  /**
   * Update settings
   */
  static async update(
    data: Partial<AppSettings>,
    updatedBy?: string
  ): Promise<AppSettings> {
    // Flatten nested structure for database updates
    const updates: Array<{ key: string; value: any; category: string }> = [];

    for (const [category, values] of Object.entries(data)) {
      if (values && typeof values === 'object') {
        for (const [key, value] of Object.entries(values)) {
          updates.push({
            key: `${category}.${key}`,
            value: value,
            category: category,
          });
        }
      }
    }

    // Update each setting
    for (const update of updates) {
      await prisma.appSettings.upsert({
        where: { key: update.key },
        update: {
          value: update.value,
          updatedBy: updatedBy,
        },
        create: {
          key: update.key,
          value: update.value,
          category: update.category,
          updatedBy: updatedBy,
        },
      });
    }

    // Return updated settings
    return this.getAll();
  }

  /**
   * Get setting by key
   */
  static async getByKey(key: string): Promise<any> {
    // Check if key exists in database
    const setting = await prisma.appSettings.findUnique({
      where: { key },
    });

    if (!setting) {
      // Try to get from defaults
      const keys = key.split('.');
      let value: any = defaultSettings;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return null;
        }
      }

      return value;
    }

    return setting.value;
  }

  /**
   * Update setting by key
   */
  static async updateByKey(
    key: string,
    value: any,
    updatedBy?: string
  ): Promise<any> {
    // Extract category from key (e.g., "general.appName" -> "general")
    const category = key.split('.')[0];

    // Update or create setting
    await prisma.appSettings.upsert({
      where: { key },
      update: {
        value: value,
        updatedBy: updatedBy,
      },
      create: {
        key: key,
        value: value,
        category: category,
        updatedBy: updatedBy,
      },
    });

    return value;
  }
}
