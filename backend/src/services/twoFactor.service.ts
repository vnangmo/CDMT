/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP (Time-based One-Time Password) authentication
 * REQ-SEC-01: Authentification à deux facteurs (optionnelle)
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { BadRequestError, UnauthorizedError } from '../middleware/errorHandler';

const APP_NAME = 'CDMT Djibouti';
const BACKUP_CODES_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface VerifyResult {
  verified: boolean;
  usedBackupCode?: boolean;
}

export class TwoFactorService {
  /**
   * Generate a new 2FA secret for a user
   * Returns the secret, QR code URL, and backup codes
   */
  static async generateSecret(userId: string): Promise<TwoFactorSetupResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestError('Utilisateur non trouvé');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestError('La 2FA est déjà activée. Désactivez-la d\'abord pour la reconfigurer.');
    }

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${user.email})`,
      issuer: APP_NAME,
      length: 32,
    });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    // Store the secret and backup codes temporarily (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: this.encryptSecret(secret.base32),
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify a TOTP token and enable 2FA if valid
   * Called after generateSecret to confirm user has set up their authenticator
   */
  static async verifyAndEnable(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true, twoFactorEnabled: true },
    });

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestError('Configuration 2FA non trouvée. Générez d\'abord un secret.');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestError('La 2FA est déjà activée.');
    }

    const secret = this.decryptSecret(user.twoFactorSecret);

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1, // Allow 1 step before/after for time drift
    });

    if (!verified) {
      throw new UnauthorizedError('Code 2FA invalide. Vérifiez votre application d\'authentification.');
    }

    // Enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'ENABLE_2FA',
        entity: 'User',
        entityId: userId,
        newValue: { twoFactorEnabled: true },
      },
    });

    return true;
  }

  /**
   * Verify a TOTP token during login
   */
  static async verifyToken(userId: string, token: string): Promise<VerifyResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorSecret: true,
        twoFactorEnabled: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestError('2FA non activée pour cet utilisateur.');
    }

    const secret = this.decryptSecret(user.twoFactorSecret);

    // First try TOTP verification
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (verified) {
      // Update last verification time
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorVerifiedAt: new Date() },
      });

      return { verified: true, usedBackupCode: false };
    }

    // If TOTP failed, try backup codes
    const backupCodeUsed = await this.verifyBackupCode(userId, token, user.twoFactorBackupCodes);

    if (backupCodeUsed) {
      return { verified: true, usedBackupCode: true };
    }

    throw new UnauthorizedError('Code 2FA invalide.');
  }

  /**
   * Verify and consume a backup code
   */
  private static async verifyBackupCode(
    userId: string,
    code: string,
    hashedCodes: string[]
  ): Promise<boolean> {
    // Normalize the code (remove dashes/spaces, uppercase)
    const normalizedCode = code.replace(/[-\s]/g, '').toUpperCase();

    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(normalizedCode, hashedCodes[i]);
      if (match) {
        // Remove the used backup code
        const newCodes = [...hashedCodes];
        newCodes.splice(i, 1);

        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: newCodes,
            twoFactorVerifiedAt: new Date(),
          },
        });

        // Log backup code usage
        await prisma.auditLog.create({
          data: {
            userId,
            action: 'USE_BACKUP_CODE',
            entity: 'User',
            entityId: userId,
            newValue: { remainingBackupCodes: newCodes.length },
          },
        });

        return true;
      }
    }

    return false;
  }

  /**
   * Disable 2FA for a user
   */
  static async disable(userId: string, password: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestError('Utilisateur non trouvé');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestError('La 2FA n\'est pas activée.');
    }

    // Verify password before disabling 2FA
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Mot de passe incorrect.');
    }

    // Disable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      },
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DISABLE_2FA',
        entity: 'User',
        entityId: userId,
        newValue: { twoFactorEnabled: false },
      },
    });

    return true;
  }

  /**
   * Regenerate backup codes
   */
  static async regenerateBackupCodes(userId: string, password: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, twoFactorEnabled: true },
    });

    if (!user) {
      throw new BadRequestError('Utilisateur non trouvé');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestError('La 2FA doit être activée pour régénérer les codes de secours.');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedError('Mot de passe incorrect.');
    }

    // Generate new backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: hashedBackupCodes },
    });

    // Log the event
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'REGENERATE_BACKUP_CODES',
        entity: 'User',
        entityId: userId,
      },
    });

    return backupCodes;
  }

  /**
   * Get 2FA status for a user
   */
  static async getStatus(userId: string): Promise<{
    enabled: boolean;
    verifiedAt: Date | null;
    backupCodesRemaining: number;
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true,
        twoFactorBackupCodes: true,
      },
    });

    if (!user) {
      throw new BadRequestError('Utilisateur non trouvé');
    }

    return {
      enabled: user.twoFactorEnabled,
      verifiedAt: user.twoFactorVerifiedAt,
      backupCodesRemaining: user.twoFactorBackupCodes.length,
    };
  }

  /**
   * Check if user has 2FA enabled
   */
  static async isEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });

    return user?.twoFactorEnabled || false;
  }

  // ==================== Helper Methods ====================

  /**
   * Generate random backup codes
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];

    for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
      const code = crypto
        .randomBytes(BACKUP_CODE_LENGTH / 2)
        .toString('hex')
        .toUpperCase();
      // Format as XXXX-XXXX for readability
      codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return codes;
  }

  /**
   * Encrypt the TOTP secret for storage
   * Uses AES-256-GCM encryption
   */
  private static encryptSecret(secret: string): string {
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt the TOTP secret
   */
  private static decryptSecret(encryptedSecret: string): string {
    const key = this.getEncryptionKey();
    const parts = encryptedSecret.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted secret format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Get encryption key from environment or generate from JWT secret
   */
  private static getEncryptionKey(): Buffer {
    const secret = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-secret';
    // Derive a 32-byte key using SHA-256
    return crypto.createHash('sha256').update(secret).digest();
  }
}

export default TwoFactorService;
