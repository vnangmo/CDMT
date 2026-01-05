import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { config } from '../config/config';
import { UnauthorizedError, BadRequestError, ConflictError } from '../middleware/errorHandler';

interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  ministryId?: string;
}

export class AuthService {
  /**
   * Générer un token JWT
   */
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
    );
  }

  /**
   * Générer un refresh token
   */
  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      payload,
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
    );
  }

  /**
   * Vérifier un token JWT
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Token invalide ou expiré');
    }
  }

  /**
   * Vérifier un refresh token
   */
  static verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedError('Refresh token invalide ou expiré');
    }
  }

  /**
   * Connexion utilisateur
   * REQ-SEC-01: Support pour l'authentification à deux facteurs (2FA)
   */
  static async login(credentials: LoginCredentials) {
    const { email, password } = credentials;

    // Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      throw new BadRequestError('Email et mot de passe requis');
    }

    // Trouver l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        ministry: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      throw new UnauthorizedError('Compte désactivé. Contactez l\'administrateur.');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect');
    }

    // Vérifier si la 2FA est activée
    if (user.twoFactorEnabled) {
      // Retourner une réponse partielle indiquant que la 2FA est requise
      return {
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Authentification à deux facteurs requise',
      };
    }

    // Générer les tokens (si pas de 2FA)
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Logger l'événement de connexion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    });

    // Retourner les données utilisateur et les tokens
    return {
      requiresTwoFactor: false,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
          permissions: user.role.permissions.map((rp) => ({
            code: rp.permission.code,
            name: rp.permission.name,
            module: rp.permission.module,
            canCreate: rp.canCreate,
            canRead: rp.canRead,
            canUpdate: rp.canUpdate,
            canDelete: rp.canDelete,
            canValidate: rp.canValidate,
          })),
        },
        ministry: user.ministry
          ? {
              id: user.ministry.id,
              code: user.ministry.code,
              name: user.ministry.name,
            }
          : null,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Compléter la connexion après vérification 2FA
   */
  static async completeTwoFactorLogin(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        ministry: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Utilisateur non trouvé');
    }

    // Générer les tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const token = this.generateToken(tokenPayload);
    const refreshToken = this.generateRefreshToken(tokenPayload);

    // Mettre à jour la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Logger l'événement de connexion
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_2FA',
        entity: 'User',
        entityId: user.id,
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: {
          id: user.role.id,
          code: user.role.code,
          name: user.role.name,
          permissions: user.role.permissions.map((rp) => ({
            code: rp.permission.code,
            name: rp.permission.name,
            module: rp.permission.module,
            canCreate: rp.canCreate,
            canRead: rp.canRead,
            canUpdate: rp.canUpdate,
            canDelete: rp.canDelete,
            canValidate: rp.canValidate,
          })),
        },
        ministry: user.ministry
          ? {
              id: user.ministry.id,
              code: user.ministry.code,
              name: user.ministry.name,
            }
          : null,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Inscription utilisateur
   */
  static async register(data: RegisterData) {
    const { email, password, firstName, lastName, phone, roleId, ministryId } = data;

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('Un utilisateur avec cet email existe déjà');
    }

    // Vérifier que le rôle existe
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new BadRequestError('Rôle invalide');
    }

    // Si un ministère est fourni, vérifier qu'il existe
    if (ministryId) {
      const ministry = await prisma.ministry.findUnique({
        where: { id: ministryId },
      });

      if (!ministry) {
        throw new BadRequestError('Ministère invalide');
      }
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        roleId,
        ministryId,
        isActive: true,
      },
      include: {
        role: true,
        ministry: true,
      },
    });

    // Logger l'événement de création
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'User',
        entityId: user.id,
        newValue: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });

    // Retourner l'utilisateur (sans le mot de passe)
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
      ministry: user.ministry
        ? {
            id: user.ministry.id,
            code: user.ministry.code,
            name: user.ministry.name,
          }
        : null,
    };
  }

  /**
   * Rafraîchir le token
   */
  static async refreshToken(refreshToken: string) {
    // Vérifier le refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Vérifier que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Utilisateur invalide');
    }

    // Générer un nouveau token
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    const token = this.generateToken(tokenPayload);
    const newRefreshToken = this.generateRefreshToken(tokenPayload);

    return {
      token,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Obtenir les informations de l'utilisateur connecté
   */
  static async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        ministry: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      lastLogin: user.lastLogin,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
        permissions: user.role.permissions.map((rp) => ({
          code: rp.permission.code,
          name: rp.permission.name,
          module: rp.permission.module,
          canCreate: rp.canCreate,
          canRead: rp.canRead,
          canUpdate: rp.canUpdate,
          canDelete: rp.canDelete,
          canValidate: rp.canValidate,
        })),
      },
      ministry: user.ministry
        ? {
            id: user.ministry.id,
            code: user.ministry.code,
            name: user.ministry.name,
          }
        : null,
    };
  }

  /**
   * Changer le mot de passe
   */
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedError('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Ancien mot de passe incorrect');
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Logger l'événement
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'User',
        entityId: user.id,
        newValue: { passwordChanged: true },
      },
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  /**
   * Déconnexion (pour le logging)
   */
  static async logout(userId: string) {
    // Logger l'événement de déconnexion
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
      },
    });

    return { message: 'Déconnexion réussie' };
  }
}
