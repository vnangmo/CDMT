import { Router } from 'express';
import fiscalMarginController from '../controllers/fiscalMargin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// =============================================
// RESERVE RATES (Taux des réserves)
// =============================================

router.get(
  '/reserve-rates/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getReserveRates
);

router.post(
  '/reserve-rates',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createReserveRate
);

router.put(
  '/reserve-rates/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateReserveRate
);

router.delete(
  '/reserve-rates/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteReserveRate
);

router.post(
  '/reserve-rates/:macroFrameworkId/bulk',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.upsertReserveRates
);

// =============================================
// AVAILABLE FISCAL MARGINS (Marges disponibles)
// =============================================

router.get(
  '/available-margins/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getAvailableFiscalMargins
);

router.post(
  '/available-margins',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createAvailableFiscalMargin
);

router.put(
  '/available-margins/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateAvailableFiscalMargin
);

router.delete(
  '/available-margins/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteAvailableFiscalMargin
);

router.post(
  '/available-margins/:macroFrameworkId/calculate',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.calculateAvailableFiscalMargins
);

// =============================================
// NEW MEASURE RATES (Taux mesures nouvelles)
// =============================================

router.get(
  '/new-measure-rates/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getNewMeasureRates
);

router.post(
  '/new-measure-rates',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createNewMeasureRate
);

router.put(
  '/new-measure-rates/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateNewMeasureRate
);

router.delete(
  '/new-measure-rates/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteNewMeasureRate
);

router.post(
  '/new-measure-rates/:macroFrameworkId/bulk',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.upsertNewMeasureRates
);

// =============================================
// NEW MEASURES (Mesures nouvelles centrales)
// =============================================

router.get(
  '/new-measures/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getNewMeasures
);

router.post(
  '/new-measures',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createNewMeasure
);

router.put(
  '/new-measures/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateNewMeasure
);

router.delete(
  '/new-measures/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteNewMeasure
);

// =============================================
// DISTRIBUTION KEYS (Clé de répartition)
// =============================================

router.get(
  '/distribution-keys/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getDistributionKeys
);

router.post(
  '/distribution-keys',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createDistributionKey
);

router.put(
  '/distribution-keys/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateDistributionKey
);

router.delete(
  '/distribution-keys/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteDistributionKey
);

router.post(
  '/distribution-keys/:macroFrameworkId/bulk',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.upsertDistributionKeys
);

// =============================================
// MINISTRY MARGINS (Marge par ministère)
// =============================================

router.get(
  '/ministry-margins/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getMinistryMargins
);

router.get(
  '/ministry-margins/:macroFrameworkId/ministry/:ministryId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getMinistryMarginsByMinistry
);

router.post(
  '/ministry-margins',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.createMinistryMargin
);

router.put(
  '/ministry-margins/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.updateMinistryMargin
);

router.delete(
  '/ministry-margins/:id',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.deleteMinistryMargin
);

router.post(
  '/ministry-margins/:macroFrameworkId/calculate',
  authorize(['ADMIN', 'DGBF_AGENT']),
  fiscalMarginController.calculateMinistryMargins
);

// =============================================
// SUMMARY
// =============================================

router.get(
  '/summary/:macroFrameworkId',
  authorize(['ADMIN', 'DGBF_AGENT', 'MINISTRY_USER', 'SUPERVISOR', 'VALIDATOR']),
  fiscalMarginController.getFiscalMarginSummary
);

export default router;
