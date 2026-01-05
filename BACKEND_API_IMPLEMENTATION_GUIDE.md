# Guide d'Implémentation des APIs Backend
## Configuration Utilisateur - CDMT Djibouti

**Date**: 2026-01-04
**Status**: Routes créées - Controllers et Services à implémenter

---

## Vue d'ensemble

Les routes suivantes ont été créées et doivent maintenant être connectées aux controllers et services:

### 1. Routes Utilisateur (`user.routes.ts`) ✅
- `GET /api/v1/users/me` - Profil utilisateur actuel
- `PUT /api/v1/users/me` - Mise à jour profil
- `PUT /api/v1/users/me/avatar` - Upload avatar
- `GET /api/v1/users/me/settings` - Paramètres utilisateur
- `PUT /api/v1/users/me/settings` - Mise à jour paramètres
- `GET /api/v1/users` - Liste utilisateurs (Admin)
- `GET /api/v1/users/:id` - Détail utilisateur (Admin)
- `PUT /api/v1/users/:id` - Mise à jour utilisateur (Admin)
- `DELETE /api/v1/users/:id` - Suppression utilisateur (Admin)
- `POST /api/v1/users/:id/activate` - Activer utilisateur (Admin)
- `POST /api/v1/users/:id/deactivate` - Désactiver utilisateur (Admin)

### 2. Routes Paramètres Généraux (`settings.routes.ts`) ✅
- `GET /api/v1/settings` - Paramètres application
- `PUT /api/v1/settings` - Mise à jour paramètres
- `GET /api/v1/settings/:key` - Paramètre spécifique
- `PUT /api/v1/settings/:key` - Mise à jour paramètre spécifique

### 3. Routes Notifications (`notification.routes.ts`) ✅ DÉJÀ IMPLÉMENTÉES
- `GET /api/v1/notifications` - Liste notifications
- `GET /api/v1/notifications/unread-count` - Nombre non lues
- `POST /api/v1/notifications/mark-all-read` - Tout marquer lu
- `POST /api/v1/notifications/:id/read` - Marquer comme lu
- `POST /api/v1/notifications/:id/unread` - Marquer comme non lu
- `DELETE /api/v1/notifications/:id` - Supprimer

---

## Implémentation Requise

### Étape 1: Créer les Controllers

#### `backend/src/controllers/user.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id; // From auth middleware
      const user = await UserService.getProfile(userId);

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update current user profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { firstName, lastName, phone } = req.body;

      const user = await UserService.updateProfile(userId, {
        firstName,
        lastName,
        phone,
      });

      res.status(200).json({
        status: 'success',
        message: 'Profil mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/avatar
   * Update user avatar
   */
  static async updateAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { avatar } = req.body; // Base64 ou URL

      const user = await UserService.updateAvatar(userId, avatar);

      res.status(200).json({
        status: 'success',
        message: 'Avatar mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/settings
   * Get user settings/preferences
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const settings = await UserService.getSettings(userId);

      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/me/settings
   * Update user settings/preferences
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const settingsData = req.body;

      const settings = await UserService.updateSettings(userId, settingsData);

      res.status(200).json({
        status: 'success',
        message: 'Paramètres mis à jour avec succès',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users
   * Get all users (Admin only)
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 50, search, roleId, ministryId, isActive } = req.query;

      const result = await UserService.getAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        roleId: roleId as string,
        ministryId: ministryId as string,
        isActive: isActive === 'true',
      });

      res.status(200).json({
        status: 'success',
        data: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get user by ID (Admin only)
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getById(id);

      if (!user) {
        throw new NotFoundError('Utilisateur non trouvé');
      }

      res.status(200).json({
        status: 'success',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/:id
   * Update user (Admin only)
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await UserService.update(id, updateData);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur mis à jour avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/:id
   * Delete user (Admin only)
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UserService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/activate
   * Activate user (Admin only)
   */
  static async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.setActive(id, true);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur activé avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/:id/deactivate
   * Deactivate user (Admin only)
   */
  static async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.setActive(id, false);

      res.status(200).json({
        status: 'success',
        message: 'Utilisateur désactivé avec succès',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

#### `backend/src/controllers/settings.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { NotFoundError } from '../middleware/errorHandler';

export class SettingsController {
  /**
   * GET /api/v1/settings
   * Get all application settings
   */
  static async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await SettingsService.getAll();

      res.status(200).json({
        status: 'success',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/settings
   * Update application settings
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settingsData = req.body;
      const settings = await SettingsService.update(settingsData);

      res.status(200).json({
        status: 'success',
        message: 'Paramètres mis à jour avec succès',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/settings/:key
   * Get specific setting by key
   */
  static async getSettingByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const value = await SettingsService.getByKey(key);

      if (value === null) {
        throw new NotFoundError(`Paramètre '${key}' non trouvé`);
      }

      res.status(200).json({
        status: 'success',
        data: { key, value },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/settings/:key
   * Update specific setting by key
   */
  static async updateSettingByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      const updated = await SettingsService.updateByKey(key, value);

      res.status(200).json({
        status: 'success',
        message: `Paramètre '${key}' mis à jour avec succès`,
        data: { key, value: updated },
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

### Étape 2: Créer les Services

#### `backend/src/services/user.service.ts`

```typescript
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
            acronym: true,
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
   * Using localStorage approach - settings stored as JSON in user's preferences
   * Alternative: Create UserSettings table in database
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

    // TODO: Retrieve from database if UserSettings table exists
    // For now, return default settings
    return defaultSettings;
  }

  /**
   * Update user settings
   */
  static async updateSettings(userId: string, settings: any) {
    // TODO: Store in UserSettings table
    // For now, return the settings as-is
    return settings;
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
```

#### `backend/src/services/settings.service.ts`

```typescript
/**
 * Application Settings Service
 *
 * NOTE: This is a simplified implementation using in-memory storage.
 * For production, you should:
 * 1. Create an AppSettings table in the database
 * 2. Store settings as key-value pairs
 * 3. Implement caching for frequently accessed settings
 */

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

// In-memory settings (replace with database)
let appSettings: AppSettings = {
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
   * Get all settings
   */
  static async getAll(): Promise<AppSettings> {
    // TODO: Fetch from database
    return appSettings;
  }

  /**
   * Update settings
   */
  static async update(data: Partial<AppSettings>): Promise<AppSettings> {
    // TODO: Save to database
    appSettings = {
      ...appSettings,
      ...data,
    };

    return appSettings;
  }

  /**
   * Get setting by key
   */
  static async getByKey(key: string): Promise<any> {
    // Parse dot notation: "general.appName"
    const keys = key.split('.');
    let value: any = appSettings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  }

  /**
   * Update setting by key
   */
  static async updateByKey(key: string, value: any): Promise<any> {
    // TODO: Validate key exists and value type is correct
    // TODO: Save to database

    const keys = key.split('.');
    let obj: any = appSettings;

    for (let i = 0; i < keys.length - 1; i++) {
      obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;

    return value;
  }
}
```

---

### Étape 3: Enregistrer les Routes dans le Server

#### `backend/src/server.ts` (UPDATE)

Ajouter les imports et enregistrer les routes:

```typescript
import userRoutes from './routes/user.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';

// ... existing code ...

// Enregistrer les routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);  // NEW
app.use('/api/v1/settings', settingsRoutes);  // NEW
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/ministries', ministryRoutes);
// ... other routes ...
```

---

### Étape 4: Ajouter le Middleware authorizeRoles

#### `backend/src/middleware/auth.middleware.ts` (UPDATE)

Ajouter la fonction `authorizeRoles` si elle n'existe pas:

```typescript
/**
 * Authorize specific roles
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentification requise',
      });
    }

    const userRole = req.user.role?.code;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès non autorisé - Rôle insuffisant',
      });
    }

    next();
  };
};
```

---

## Solution Simplifiée - Utilisation du modèle User existant

Pour éviter les migrations de base de données immédiates, l'implémentation actuelle:

1. **Profil Utilisateur**: Utilise directement les champs du modèle `User`
2. **Paramètres Utilisateur**: Stockés en mémoire/localStorage (à migrer vers BDD plus tard)
3. **Paramètres App**: Stockés en mémoire (à migrer vers table AppSettings plus tard)
4. **Avatar**: Non implémenté (nécessite ajout champ ou stockage fichiers)

### Migration Future Recommandée

Ajouter au schéma Prisma:

```prisma
model UserSettings {
  id        String   @id @default(uuid())
  userId    String   @unique
  language  String   @default("fr")
  theme     String   @default("light")
  settings  Json     // Store all preferences as JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model AppSettings {
  id        String   @id @default(uuid())
  key       String   @unique
  value     Json
  category  String   // "general", "security", "email", "storage"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@map("app_settings")
}
```

---

## Checklist d'Implémentation

- [x] Routes créées (`user.routes.ts`, `settings.routes.ts`)
- [ ] Controller `user.controller.ts` créé
- [ ] Controller `settings.controller.ts` créé
- [ ] Service `user.service.ts` créé
- [ ] Service `settings.service.ts` créé
- [ ] Middleware `authorizeRoles` ajouté
- [ ] Routes enregistrées dans `server.ts`
- [ ] Tests API avec Postman/Thunder Client
- [ ] Connexion frontend aux APIs
- [ ] Migration vers tables UserSettings/AppSettings (optionnel)

---

## Tests API Recommandés

### Test Profil Utilisateur

```bash
# Get profile
GET http://localhost:5000/api/v1/users/me
Authorization: Bearer {token}

# Update profile
PUT http://localhost:5000/api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+253 77 12 34 56"
}

# Get settings
GET http://localhost:5000/api/v1/users/me/settings
Authorization: Bearer {token}

# Update settings
PUT http://localhost:5000/api/v1/users/me/settings
Authorization: Bearer {token}
Content-Type: application/json

{
  "language": "fr",
  "theme": "dark",
  "notifications": {
    "email": true,
    "push": false
  }
}
```

### Test Paramètres Généraux (Admin)

```bash
# Get all settings
GET http://localhost:5000/api/v1/settings
Authorization: Bearer {admin_token}

# Update settings
PUT http://localhost:5000/api/v1/settings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "general": {
    "maintenanceMode": true
  },
  "security": {
    "sessionTimeout": 60
  }
}
```

---

**Prochaine étape**: Créer les fichiers controllers et services, puis tester les endpoints avant de connecter le frontend.
