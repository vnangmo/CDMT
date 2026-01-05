import prisma from '../config/database';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Get user profile with role and ministry
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        ministry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé');
    }

    return user;
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string }
  ) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        ministry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Update user avatar
   * NOTE: For now, avatar is not in the schema.
   * You can either:
   * 1. Add an 'avatar' field to User model
   * 2. Store in a separate UserProfile table
   * 3. Use file storage and store URL
   */
  static async updateAvatar(userId: string, avatar: string) {
    // TODO: Implement avatar storage
    // For now, return user without avatar
    return this.getProfile(userId);
  }

  /**
   * Get user settings
   */
  static async getSettings(userId: string) {
    // Default settings structure
    const defaultSettings = {
      language: 'fr',
      theme: 'light',
      notifications: {
        email: true,
        push: true,
        sms: false,
        weeklyReport: true,
        monthlyReport: true,
      },
      accessibility: {
        largeText: false,
        highContrast: false,
        screenReader: false,
      },
      privacy: {
        showEmail: false,
        showPhone: false,
        showOnlineStatus: true,
      },
    };

    // Try to get settings from database
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // If settings don't exist, create with defaults
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId,
          language: defaultSettings.language,
          theme: defaultSettings.theme,
          notifications: defaultSettings.notifications,
          accessibility: defaultSettings.accessibility,
          privacy: defaultSettings.privacy,
        },
      });
    }

    // Return formatted settings
    return {
      language: userSettings.language,
      theme: userSettings.theme,
      notifications: userSettings.notifications as any,
      accessibility: userSettings.accessibility as any,
      privacy: userSettings.privacy as any,
    };
  }

  /**
   * Update user settings
   */
  static async updateSettings(userId: string, settings: any) {
    // Update or create settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        language: settings.language,
        theme: settings.theme,
        notifications: settings.notifications,
        accessibility: settings.accessibility,
        privacy: settings.privacy,
      },
      create: {
        userId,
        language: settings.language || 'fr',
        theme: settings.theme || 'light',
        notifications: settings.notifications || {
          email: true,
          push: true,
          sms: false,
          weeklyReport: true,
          monthlyReport: true,
        },
        accessibility: settings.accessibility || {
          largeText: false,
          highContrast: false,
          screenReader: false,
        },
        privacy: settings.privacy || {
          showEmail: false,
          showPhone: false,
          showOnlineStatus: true,
        },
      },
    });

    // Return formatted settings
    return {
      language: updatedSettings.language,
      theme: updatedSettings.theme,
      notifications: updatedSettings.notifications as any,
      accessibility: updatedSettings.accessibility as any,
      privacy: updatedSettings.privacy as any,
    };
  }

  /**
   * Get all users with pagination and filters
   */
  static async getAll(filters: {
    page: number;
    limit: number;
    search?: string;
    roleId?: string;
    ministryId?: string;
    isActive?: boolean;
  }) {
    const { page, limit, search, roleId, ministryId, isActive } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (ministryId) {
      where.ministryId = ministryId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          ministry: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
    };
  }

  /**
   * Get user by ID
   */
  static async getById(id: string) {
    return this.getProfile(id);
  }

  /**
   * Update user (Admin only)
   */
  static async update(id: string, data: any) {
    const { password, ...updateData } = data;

    // Hash password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        ministry: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  /**
   * Delete user
   */
  static async delete(id: string) {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Set user active status
   */
  static async setActive(id: string, isActive: boolean) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });

    return user;
  }
}
