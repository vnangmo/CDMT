import { Router } from 'express';
import { ImportController } from '../controllers/import.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload, handleMulterError } from '../config/multer.config';

const router = Router();

/**
 * @route   GET /api/v1/import/budgets/template
 * @desc    Télécharger le template Excel pour l'importation de budgets
 * @access  Private (BUDGET:CREATE)
 */
router.get(
  '/budgets/template',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  ImportController.downloadBudgetTemplate
);

/**
 * @route   POST /api/v1/import/budgets
 * @desc    Importer des budgets depuis un fichier Excel/CSV
 * @access  Private (BUDGET:CREATE)
 * @params  file (multipart/form-data), skipValidation, stopOnError, updateExisting, dryRun
 */
router.post(
  '/budgets',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  ImportController.importBudgets
);

/**
 * @route   GET /api/v1/import/executions/template
 * @desc    Télécharger le template Excel pour l'importation d'exécutions
 * @access  Private (BUDGET:CREATE)
 */
router.get(
  '/executions/template',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  ImportController.downloadExecutionTemplate
);

/**
 * @route   POST /api/v1/import/executions
 * @desc    Importer des exécutions depuis un fichier Excel/CSV
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/executions',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  ImportController.importExecutions
);

/**
 * @route   GET /api/v1/import/pie/template
 * @desc    Télécharger le template Excel pour l'importation PIE
 * @access  Private (BUDGET:CREATE)
 */
router.get(
  '/pie/template',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  ImportController.downloadPIETemplate
);

/**
 * @route   POST /api/v1/import/pie
 * @desc    Importer des PIE depuis un fichier Excel/CSV
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/pie',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  ImportController.importPIE
);

/**
 * @route   GET /api/v1/import/pip/template
 * @desc    Télécharger le template Excel pour l'importation PIP
 * @access  Private (BUDGET:CREATE)
 */
router.get(
  '/pip/template',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  ImportController.downloadPIPTemplate
);

/**
 * @route   POST /api/v1/import/pip
 * @desc    Importer des PIP depuis un fichier Excel/CSV
 * @access  Private (BUDGET:CREATE)
 */
router.post(
  '/pip',
  authenticate,
  authorize(['BUDGET:CREATE', 'ADMIN:CREATE']),
  upload.single('file'),
  handleMulterError,
  ImportController.importPIP
);

/**
 * @route   GET /api/v1/import/history
 * @desc    Obtenir l'historique des importations
 * @access  Private (BUDGET:READ)
 */
router.get(
  '/history',
  authenticate,
  authorize(['BUDGET:READ', 'ADMIN:READ']),
  ImportController.getImportHistory
);

export default router;
