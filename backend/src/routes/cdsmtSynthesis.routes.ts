import { Router } from 'express';
import { CDSMTSynthesisController } from '../controllers/cdsmtSynthesis.controller';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @route   GET /api/v1/cdsmt-synthesis/national
 * @desc    Générer la synthèse nationale (tous les ministères)
 * @access  Private - Admin, DIR_BUDGET
 * @query   fiscalYear - Année fiscale (requis)
 *
 * Génère une vue d'ensemble de tous les CDSMT ministériels
 * conformément au processus de consolidation du guide méthodologique.
 */
router.get(
  '/national',
  authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET']),
  CDSMTSynthesisController.getNationalSynthesis
);

/**
 * @route   GET /api/v1/cdsmt-synthesis/ministry/:ministryId
 * @desc    Générer la synthèse CDSMT pour un ministère (Maquette CDSMT - Figure 10)
 * @access  Private - Admin, DIR_BUDGET, DIR_SECTEUR (son ministère)
 * @query   fiscalYear - Année fiscale (requis)
 *
 * Retourne la Maquette CDSMT complète avec:
 * - Structure: Programme → Action → Activité
 * - Colonnes: Tendanciel, Mesures Nouvelles, Prévisions (pour N+1, N+2, N+3)
 * - Catégories économiques: Personnel, B&S, Transferts, Investissements internes/externes
 */
router.get(
  '/ministry/:ministryId',
  authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET', 'DIR_SECTEUR', 'CONTROLEUR', 'USER_SECTEUR']),
  CDSMTSynthesisController.getMinistrySDMT
);

/**
 * @route   GET /api/v1/cdsmt-synthesis/ministry/:ministryId/validate
 * @desc    Valider le CDSMT par rapport au plafond CDMT Global
 * @access  Private - Admin, DIR_BUDGET, DIR_SECTEUR
 * @query   fiscalYear - Année fiscale (requis)
 *
 * Vérifie que les prévisions CDSMT respectent les plafonds
 * ministériels définis dans le CDMT Global.
 * Retourne les erreurs et avertissements éventuels.
 */
router.get(
  '/ministry/:ministryId/validate',
  authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET', 'DIR_SECTEUR', 'CONTROLEUR']),
  CDSMTSynthesisController.validateMinistrySDMT
);

/**
 * @route   GET /api/v1/cdsmt-synthesis/ministry/:ministryId/export
 * @desc    Exporter le CDSMT en format officiel
 * @access  Private - Admin, DIR_BUDGET, DIR_SECTEUR
 * @query   fiscalYear - Année fiscale (requis)
 * @query   format - Format d'export (json ou csv, défaut: json)
 *
 * Export au format Maquette CDSMT:
 * - CSV: Format tableur compatible Excel
 * - JSON: Format structuré pour intégration
 */
router.get(
  '/ministry/:ministryId/export',
  authorizeRoles(['ADMIN_SYSTEM', 'DIR_BUDGET', 'DIR_SECTEUR', 'CONTROLEUR']),
  CDSMTSynthesisController.exportMinistrySDMT
);

export default router;
