import express from 'express';
import SectoralTrendController from '../controllers/sectoralTrend.controller';
import { authenticate, authorize, checkPermission } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Sectoral Trend Calculations
router.post('/:trendConfigId/calculate', authorize(['TREND:CALCULATE']), SectoralTrendController.calculateProjections);
router.get('/:trendConfigId/summary/action', authorize(['TREND:READ']), SectoralTrendController.getSummaryByAction);
router.get('/:trendConfigId/summary/activity', authorize(['TREND:READ']), SectoralTrendController.getSummaryByActivity);
router.get('/:trendConfigId/ceiling-exceedances', authorize(['TREND:READ']), SectoralTrendController.checkCeilingExceedances);
router.get('/ministry/:ministryId/ceilings', authorize(['TREND:READ']), SectoralTrendController.getCDMTGlobalCeilings);
router.post('/:trendConfigId/integrate-projects', authorize(['TREND:UPDATE']), SectoralTrendController.integratePIEPIPProjects);
router.get('/:trendConfigId/validate', authorize(['TREND:READ']), SectoralTrendController.validateCoherence);

export default router;
