import { Router } from 'express';
import { DocumentVersionController } from '../controllers/documentVersion.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   GET /api/v1/document-versions/stats
 * @desc    Obtenir les statistiques de versioning
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/stats',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getStats
);

/**
 * @route   GET /api/v1/document-versions/:documentType/:documentId
 * @desc    Obtenir toutes les versions d'un document
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/:documentType/:documentId',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getDocumentVersions
);

/**
 * @route   GET /api/v1/document-versions/:documentType/:documentId/history
 * @desc    Obtenir l'historique complet d'un document
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/:documentType/:documentId/history',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getDocumentHistory
);

/**
 * @route   GET /api/v1/document-versions/:documentType/:documentId/latest
 * @desc    Obtenir la dernière version d'un document
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/:documentType/:documentId/latest',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getLatestVersion
);

/**
 * @route   GET /api/v1/document-versions/:documentType/:documentId/version/:versionNumber
 * @desc    Obtenir une version spécifique par numéro
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/:documentType/:documentId/version/:versionNumber',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getVersionByNumber
);

/**
 * @route   GET /api/v1/document-versions/compare/:version1Id/:version2Id
 * @desc    Comparer deux versions
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/compare/:version1Id/:version2Id',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.compareVersions
);

/**
 * @route   GET /api/v1/document-versions/version/:id
 * @desc    Obtenir une version spécifique par ID
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/version/:id',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  DocumentVersionController.getVersion
);

/**
 * @route   POST /api/v1/document-versions
 * @desc    Créer une nouvelle version
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  DocumentVersionController.createVersion
);

/**
 * @route   POST /api/v1/document-versions/:id/restore
 * @desc    Restaurer une version (créer une nouvelle version à partir d'une ancienne)
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  DocumentVersionController.restoreVersion
);

/**
 * @route   DELETE /api/v1/document-versions/:id
 * @desc    Supprimer une version
 * @access  Private (BUDGET:DELETE)
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['BUDGET:DELETE', 'ADMIN:DELETE']),
  DocumentVersionController.deleteVersion
);

export default router;
