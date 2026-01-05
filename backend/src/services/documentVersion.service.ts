import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

interface CreateVersionData {
  documentType: 'CDMT_GLOBAL' | 'CDMT_SECTORAL' | 'MACRO_FRAMEWORK' | 'CBMT' | 'OTHER';
  documentId: string;
  versionNumber: number;
  description?: string;
  createdBy: string;
  data: any; // JSON data snapshot
}

interface VersionFilter {
  documentType?: string;
  documentId?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
}

export class DocumentVersionService {
  /**
   * Créer une nouvelle version d'un document
   */
  static async createVersion(data: CreateVersionData) {
    // Vérifier que le numéro de version n'existe pas déjà pour ce document
    const existingVersion = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      WHERE "documentType" = ${data.documentType}
      AND "documentId" = ${data.documentId}
      AND "versionNumber" = ${data.versionNumber}
      LIMIT 1
    `;

    if (existingVersion && existingVersion.length > 0) {
      throw new BadRequestError(
        `La version ${data.versionNumber} existe déjà pour ce document`
      );
    }

    // Créer la version
    const version = await prisma.$queryRaw<any>`
      INSERT INTO document_versions
      ("id", "documentType", "documentId", "versionNumber", "description", "createdBy", "data", "createdAt")
      VALUES (
        gen_random_uuid(),
        ${data.documentType},
        ${data.documentId},
        ${data.versionNumber},
        ${data.description || ''},
        ${data.createdBy},
        ${JSON.stringify(data.data)}::jsonb,
        NOW()
      )
      RETURNING *
    `;

    return version;
  }

  /**
   * Obtenir toutes les versions d'un document
   */
  static async getDocumentVersions(documentType: string, documentId: string) {
    const versions = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      WHERE "documentType" = ${documentType}
      AND "documentId" = ${documentId}
      ORDER BY "versionNumber" DESC
    `;

    return versions;
  }

  /**
   * Obtenir une version spécifique
   */
  static async getVersion(id: string) {
    const version = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      WHERE id::text = ${id}
      LIMIT 1
    `;

    if (!version || version.length === 0) {
      throw new NotFoundError('Version non trouvée');
    }

    return version[0];
  }

  /**
   * Obtenir une version spécifique par numéro
   */
  static async getVersionByNumber(
    documentType: string,
    documentId: string,
    versionNumber: number
  ) {
    const version = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      WHERE "documentType" = ${documentType}
      AND "documentId" = ${documentId}
      AND "versionNumber" = ${versionNumber}
      LIMIT 1
    `;

    if (!version || version.length === 0) {
      throw new NotFoundError(
        `Version ${versionNumber} non trouvée pour ce document`
      );
    }

    return version[0];
  }

  /**
   * Obtenir la dernière version d'un document
   */
  static async getLatestVersion(documentType: string, documentId: string) {
    const version = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      WHERE "documentType" = ${documentType}
      AND "documentId" = ${documentId}
      ORDER BY "versionNumber" DESC
      LIMIT 1
    `;

    if (!version || version.length === 0) {
      throw new NotFoundError('Aucune version trouvée pour ce document');
    }

    return version[0];
  }

  /**
   * Comparer deux versions
   */
  static async compareVersions(version1Id: string, version2Id: string) {
    const [v1Result, v2Result] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT * FROM document_versions WHERE id::text = ${version1Id} LIMIT 1
      `,
      prisma.$queryRaw<any[]>`
        SELECT * FROM document_versions WHERE id::text = ${version2Id} LIMIT 1
      `,
    ]);

    if (!v1Result || v1Result.length === 0) {
      throw new NotFoundError('Version 1 non trouvée');
    }

    if (!v2Result || v2Result.length === 0) {
      throw new NotFoundError('Version 2 non trouvée');
    }

    const v1 = v1Result[0];
    const v2 = v2Result[0];

    // Vérifier que les versions concernent le même document
    if (
      v1.documentType !== v2.documentType ||
      v1.documentId !== v2.documentId
    ) {
      throw new BadRequestError(
        'Les versions doivent concerner le même document'
      );
    }

    return {
      version1: {
        id: v1.id,
        versionNumber: v1.versionNumber,
        createdAt: v1.createdAt,
        createdBy: v1.createdBy,
        data: v1.data,
      },
      version2: {
        id: v2.id,
        versionNumber: v2.versionNumber,
        createdAt: v2.createdAt,
        createdBy: v2.createdBy,
        data: v2.data,
      },
      documentType: v1.documentType,
      documentId: v1.documentId,
    };
  }

  /**
   * Restaurer une version (créer une nouvelle version à partir d'une ancienne)
   */
  static async restoreVersion(
    versionId: string,
    userId: string,
    description?: string
  ) {
    // Récupérer la version à restaurer
    const versionResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions WHERE id::text = ${versionId} LIMIT 1
    `;

    if (!versionResult || versionResult.length === 0) {
      throw new NotFoundError('Version non trouvée');
    }

    const oldVersion = versionResult[0];

    // Obtenir le prochain numéro de version
    const latestVersion = await this.getLatestVersion(
      oldVersion.documentType,
      oldVersion.documentId
    );

    const newVersionNumber = latestVersion.versionNumber + 1;

    // Créer une nouvelle version avec les données de l'ancienne
    const newVersion = await this.createVersion({
      documentType: oldVersion.documentType,
      documentId: oldVersion.documentId,
      versionNumber: newVersionNumber,
      description:
        description ||
        `Restauration de la version ${oldVersion.versionNumber}`,
      createdBy: userId,
      data: oldVersion.data,
    });

    return newVersion;
  }

  /**
   * Supprimer une version
   */
  static async deleteVersion(id: string) {
    // Vérifier que la version existe
    const versionResult = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions WHERE id::text = ${id} LIMIT 1
    `;

    if (!versionResult || versionResult.length === 0) {
      throw new NotFoundError('Version non trouvée');
    }

    const version = versionResult[0];

    // Vérifier qu'il ne s'agit pas de la seule version
    const versionCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM document_versions
      WHERE "documentType" = ${version.documentType}
      AND "documentId" = ${version.documentId}
    `;

    if (versionCount[0].count <= 1) {
      throw new BadRequestError(
        'Impossible de supprimer la seule version d\'un document'
      );
    }

    // Supprimer la version
    await prisma.$queryRaw`
      DELETE FROM document_versions WHERE id::text = ${id}
    `;

    return { message: 'Version supprimée avec succès' };
  }

  /**
   * Obtenir les statistiques de versioning
   */
  static async getStats() {
    const totalVersions = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM document_versions
    `;

    const versionsByType = await prisma.$queryRaw<any[]>`
      SELECT "documentType", COUNT(*) as count
      FROM document_versions
      GROUP BY "documentType"
    `;

    const recentVersions = await prisma.$queryRaw<any[]>`
      SELECT * FROM document_versions
      ORDER BY "createdAt" DESC
      LIMIT 10
    `;

    return {
      total: parseInt(totalVersions[0]?.count || '0'),
      byType: versionsByType.reduce((acc: any, item: any) => {
        acc[item.documentType] = parseInt(item.count);
        return acc;
      }, {}),
      recentVersions: recentVersions,
    };
  }

  /**
   * Obtenir l'historique complet d'un document
   */
  static async getDocumentHistory(documentType: string, documentId: string) {
    const versions = await this.getDocumentVersions(documentType, documentId);

    return {
      documentType,
      documentId,
      totalVersions: versions.length,
      versions: versions.map((v: any) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        description: v.description,
        createdBy: v.createdBy,
        createdAt: v.createdAt,
      })),
      latestVersion: versions[0],
      oldestVersion: versions[versions.length - 1],
    };
  }
}
