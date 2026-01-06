import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, ForbiddenError } from './errorHandler';
import prisma from '../config/database';
import CacheService from '../services/cache.service';

// Étendre l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        roleId: string;
        roleCode?: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * Middleware d'authentification
 * Vérifie que l'utilisateur est connecté avec un token JWT valide
 * Utilise le cache Redis pour réduire les requêtes DB (15 min TTL)
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token d\'authentification manquant');
    }

    const token = authHeader.substring(7); // Retirer "Bearer "

    // Vérifier et décoder le token
    const payload = AuthService.verifyToken(token);
    const userId = payload.userId;
    const cacheKey = `user:${userId}:permissions`;

    // Essayer de récupérer depuis le cache (TTL: 15 min)
    let user = await CacheService.get<any>(cacheKey);

    if (!user) {
      // Cache miss - récupérer depuis la DB avec requête optimisée
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          roleId: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
              permissions: {
                select: {
                  permission: {
                    select: { code: true }
                  }
                }
              }
            }
          }
        }
      });

      if (user) {
        // Mettre en cache pour 15 minutes
        await CacheService.set(cacheKey, user, 900);
      }
    }

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Utilisateur invalide ou inactif');
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleCode: user.role.code,
      permissions: user.role.permissions.map((rp: any) => rp.permission.code),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de vérification des permissions
 * Vérifie que l'utilisateur a les permissions requises
 * Utilise les permissions déjà cachées dans req.user (pas de requête DB supplémentaire)
 */
export const authorize = (requiredPermissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Utilisateur non authentifié');
      }

      // Admin système a toutes les permissions
      if (req.user.roleCode === 'ADMIN' || req.user.roleCode === 'ADMIN_SYSTEM') {
        return next();
      }

      // Utiliser les permissions déjà chargées dans req.user (depuis le cache)
      const userPermissions = req.user.permissions || [];

      // Vérifier que l'utilisateur a au moins une des permissions requises
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ForbiddenError('Permissions insuffisantes');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware de vérification des rôles
 * Vérifie que l'utilisateur a l'un des rôles requis
 * Utilise le rôle déjà caché dans req.user (pas de requête DB supplémentaire)
 */
export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Utilisateur non authentifié');
      }

      // Utiliser le rôle déjà chargé dans req.user (depuis le cache)
      const userRoleCode = req.user.roleCode;

      if (!userRoleCode) {
        throw new UnauthorizedError('Rôle utilisateur non trouvé');
      }

      // Vérifier que l'utilisateur a l'un des rôles autorisés
      if (!allowedRoles.includes(userRoleCode)) {
        throw new ForbiddenError('Accès non autorisé pour ce rôle');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si le token est absent, mais vérifie s'il est présent
 * Utilise le cache Redis pour réduire les requêtes DB
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = AuthService.verifyToken(token);
      const userId = payload.userId;
      const cacheKey = `user:${userId}:permissions`;

      // Essayer de récupérer depuis le cache
      let user = await CacheService.get<any>(cacheKey);

      if (!user) {
        // Cache miss - récupérer depuis la DB avec requête optimisée
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
            roleId: true,
            role: {
              select: {
                id: true,
                code: true,
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: { code: true }
                    }
                  }
                }
              }
            }
          }
        });

        if (user) {
          // Mettre en cache pour 15 minutes
          await CacheService.set(cacheKey, user, 900);
        }
      }

      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          email: user.email,
          roleId: user.roleId,
          roleCode: user.role.code,
          permissions: user.role.permissions.map((rp: any) => rp.permission.code),
        };
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur authentifié
    next();
  }
};

/**
 * Helper function to create permission checker
 * Maps module and action to permission code format
 */
export const checkPermission = (module: string, action: string) => {
  // Map action names to permission suffixes
  const actionMap: Record<string, string> = {
    canRead: 'READ',
    canCreate: 'CREATE',
    canUpdate: 'UPDATE',
    canDelete: 'DELETE',
    canValidate: 'VALIDATE',
    canApprove: 'APPROVE',
  };

  const permissionSuffix = actionMap[action] || action.toUpperCase();
  // Use underscore separator to match database permission codes (e.g., MACRO_READ)
  const permissionCode = `${module.toUpperCase()}_${permissionSuffix}`;

  return authorize([permissionCode]);
};

/**
 * Alias pour requireRole pour compatibilité
 */
export const authorizeRoles = requireRole;
