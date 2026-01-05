import { Request, Response, NextFunction } from 'express';
import { SectoralTrendCalculationService } from '../services/sectoralTrendCalculation.service';

export class SectoralTrendController {
  /**
   * Calculate sectoral projections
   */
  static async calculateProjections(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const result = await SectoralTrendCalculationService.calculateSectoralProjections(trendConfigId);

      res.json({
        status: 'success',
        message: `${result.calculated} projections sectorielles calculées`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by Action
   */
  static async getSummaryByAction(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const summary = await SectoralTrendCalculationService.getSummaryByAction(trendConfigId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by Activity
   */
  static async getSummaryByActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const summary = await SectoralTrendCalculationService.getSummaryByActivity(trendConfigId);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check ceiling exceedances
   */
  static async checkCeilingExceedances(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const result = await SectoralTrendCalculationService.checkCeilingExceedances(trendConfigId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get CDMT Global ceilings for a ministry
   */
  static async getCDMTGlobalCeilings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      if (!fiscalYear) {
        res.status(400).json({
          status: 'error',
          message: 'Année fiscale requise',
        });
        return;
      }

      const ceilings = await SectoralTrendCalculationService.getCDMTGlobalCeilings(
        ministryId,
        fiscalYear
      );

      res.json(ceilings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Integrate PIE/PIP projects
   */
  static async integratePIEPIPProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { trendConfigId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      if (!fiscalYear) {
        res.status(400).json({
          status: 'error',
          message: 'Année fiscale requise',
        });
        return;
      }

      const result = await SectoralTrendCalculationService.integratePIEPIPProjects(
        trendConfigId,
        fiscalYear
      );

      res.json({
        status: 'success',
        message: 'Projets PIE/PIP intégrés',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate sectoral coherence
   */
  static async validateCoherence(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const validation = await SectoralTrendCalculationService.validateSectoralCoherence(trendConfigId);
      res.json(validation);
    } catch (error) {
      next(error);
    }
  }
}

export default SectoralTrendController;
