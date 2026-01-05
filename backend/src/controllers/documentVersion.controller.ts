import { Request, Response, NextFunction } from 'express';
import { DocumentVersionService } from '../services/documentVersion.service';
import { BadRequestError } from '../middleware/errorHandler';

export class DocumentVersionController {
  /**
   * Créer une nouvelle version d'un document
   */
  static async createVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, documentId, versionNumber, description, data } = req.body;
      const userId = (req as any).user.userId;

      if (!documentType || !documentId || !versionNumber || !data) {
        throw new BadRequestError('Champs requis manquants: documentType, documentId, versionNumber, data');
      }

      const validDocTypes = ['CDMT_GLOBAL', 'CDMT_SECTORAL', 'MACRO_FRAMEWORK', 'CBMT', 'OTHER'];
      if (!validDocTypes.includes(documentType)) {
        throw new BadRequestError(`Type de document invalide. Types valides: ${validDocTypes.join(', ')}`);
      }

      const version = await DocumentVersionService.createVersion({
        documentType,
        documentId,
        versionNumber: parseInt(versionNumber),
        description,
        createdBy: userId,
        data,
      });

      res.status(201).json({
        status: 'success',
        message: 'Version créée avec succès',
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir toutes les versions d'un document
   */
  static async getDocumentVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, documentId } = req.params;

      const versions = await DocumentVersionService.getDocumentVersions(documentType, documentId);

      res.status(200).json({
        status: 'success',
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une version spécifique par ID
   */
  static async getVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const version = await DocumentVersionService.getVersion(id);

      res.status(200).json({
        status: 'success',
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une version spécifique par numéro
   */
  static async getVersionByNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, documentId, versionNumber } = req.params;

      const version = await DocumentVersionService.getVersionByNumber(
        documentType,
        documentId,
        parseInt(versionNumber)
      );

      res.status(200).json({
        status: 'success',
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir la dernière version d'un document
   */
  static async getLatestVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, documentId } = req.params;

      const version = await DocumentVersionService.getLatestVersion(documentType, documentId);

      res.status(200).json({
        status: 'success',
        data: version,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Comparer deux versions
   */
  static async compareVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const { version1Id, version2Id } = req.params;

      const comparison = await DocumentVersionService.compareVersions(version1Id, version2Id);

      res.status(200).json({
        status: 'success',
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaurer une version (créer une nouvelle version à partir d'une ancienne)
   */
  static async restoreVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { description } = req.body;
      const userId = (req as any).user.userId;

      const newVersion = await DocumentVersionService.restoreVersion(id, userId, description);

      res.status(201).json({
        status: 'success',
        message: 'Version restaurée avec succès',
        data: newVersion,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une version
   */
  static async deleteVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const result = await DocumentVersionService.deleteVersion(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les statistiques de versioning
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await DocumentVersionService.getStats();

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir l'historique complet d'un document
   */
  static async getDocumentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { documentType, documentId } = req.params;

      const history = await DocumentVersionService.getDocumentHistory(documentType, documentId);

      res.status(200).json({
        status: 'success',
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
