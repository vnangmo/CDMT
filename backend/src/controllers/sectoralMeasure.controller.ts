import { Request, Response, NextFunction } from 'express';
import { SectoralMeasureService } from '../services/sectoralMeasure.service';
import { SectoralMeasureCostingService } from '../services/sectoralMeasureCosting.service';
import { SectoralMeasureValidationService } from '../services/sectoralMeasureValidation.service';
import { SectoralMeasureIntegrationService } from '../services/sectoralMeasureIntegration.service';
import { SectoralMeasureExportService } from '../services/sectoralMeasureExport.service';
import prisma from '../config/database';

export class SectoralMeasureController {
  /**
   * Get all sectoral measures
   */
  static async getSectoralMeasures(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        ministryId: req.query.ministryId as string | undefined,
        programId: req.query.programId as string | undefined,
        actionId: req.query.actionId as string | undefined,
        activityId: req.query.activityId as string | undefined,
        entityType: req.query.entityType as string | undefined,
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        fiscalYear: req.query.fiscalYear ? parseInt(req.query.fiscalYear as string) : undefined,
      };

      const measures = await SectoralMeasureService.getSectoralMeasures(filters);
      res.json(measures);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sectoral measure by ID
   */
  static async getSectoralMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const measure = await SectoralMeasureService.getSectoralMeasure(id);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sectoral measure
   */
  static async createSectoralMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const measure = await SectoralMeasureService.createSectoralMeasure(req.body);
      res.status(201).json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sectoral measure
   */
  static async updateSectoralMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const measure = await SectoralMeasureService.updateSectoralMeasure(id, req.body);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sectoral measure
   */
  static async deleteSectoralMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await SectoralMeasureService.deleteSectoralMeasure(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit measure for validation
   */
  static async submitForValidation(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const submittedBy = req.body.submittedBy || (req as any).user?.id;
      const measure = await SectoralMeasureService.submitForValidation(id, submittedBy);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate measure
   */
  static async validateMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedBy = req.body.validatedBy || (req as any).user?.id;
      const measure = await SectoralMeasureService.validateMeasure(id, validatedBy);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject measure
   */
  static async rejectMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const validatedBy = req.body.validatedBy || (req as any).user?.id;
      const measure = await SectoralMeasureService.rejectMeasure(id, rejectionReason, validatedBy);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  // =====================================================
  // NEW WORKFLOW METHODS (5-Level Workflow)
  // =====================================================

  /**
   * Submit measure for review (5-level workflow)
   */
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const measure = await SectoralMeasureService.submit(id, userId);
      res.json({
        status: 'success',
        message: 'Mesure soumise pour révision',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start review of measure
   */
  static async startReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const measure = await SectoralMeasureService.startReview(id, userId);
      res.json({
        status: 'success',
        message: 'Révision commencée',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate measure (5-level workflow)
   */
  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { comment } = req.body;
      const measure = await SectoralMeasureService.validate(id, userId, comment);
      res.json({
        status: 'success',
        message: 'Mesure validée',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve measure
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { comment } = req.body;
      const measure = await SectoralMeasureService.approve(id, userId, comment);
      res.json({
        status: 'success',
        message: 'Mesure approuvée',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject measure (5-level workflow)
   */
  static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { reason } = req.body;

      if (!reason) {
        res.status(400).json({
          status: 'error',
          message: 'Raison du rejet requise',
        });
        return;
      }

      const measure = await SectoralMeasureService.reject(id, userId, reason);
      res.json({
        status: 'success',
        message: 'Mesure rejetée',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return measure to draft
   */
  static async returnToDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const { comment } = req.body;
      const measure = await SectoralMeasureService.returnToDraft(id, userId, comment);
      res.json({
        status: 'success',
        message: 'Mesure retournée en brouillon',
        data: measure,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by ministry
   */
  static async getSummaryByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await SectoralMeasureService.getSummaryByMinistry(fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by category
   */
  static async getSummaryByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await SectoralMeasureService.getSummaryByCategory(fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by action
   */
  static async getSummaryByAction(req: Request, res: Response, next: NextFunction) {
    try {
      const ministryId = req.query.ministryId as string | undefined;
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await SectoralMeasureService.getSummaryByAction(ministryId, fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get summary by activity
   */
  static async getSummaryByActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const ministryId = req.query.ministryId as string | undefined;
      const fiscalYear = req.query.fiscalYear
        ? parseInt(req.query.fiscalYear as string)
        : undefined;

      const summary = await SectoralMeasureService.getSummaryByActivity(ministryId, fiscalYear);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculate measure costs
   */
  static async recalculateCosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const measure = await SectoralMeasureCostingService.recalculateMeasureCosts(id);
      res.json(measure);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ministry aggregated costs
   */
  static async getMinistryAggregatedCosts(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const costs = await SectoralMeasureCostingService.getMinistryAggregatedCosts(
        ministryId,
        fiscalYear
      );
      res.json(costs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cost breakdown by economic nature
   */
  static async getCostBreakdownByEconomicNature(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const breakdown = await SectoralMeasureCostingService.getCostBreakdownByEconomicNature(
        ministryId,
        fiscalYear
      );
      res.json(breakdown);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get cost breakdown by funding source
   */
  static async getCostBreakdownByFundingSource(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const breakdown = await SectoralMeasureCostingService.getCostBreakdownByFundingSource(
        ministryId,
        fiscalYear
      );
      res.json(breakdown);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get comprehensive cost report
   */
  static async getComprehensiveCostReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const report = await SectoralMeasureCostingService.getComprehensiveCostReport(
        ministryId,
        fiscalYear
      );
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate ministry ceiling
   */
  static async validateMinisteryCeiling(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const validation = await SectoralMeasureValidationService.validateMinisteryCeiling(
        ministryId,
        fiscalYear
      );
      res.json(validation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check all ministry ceilings
   */
  static async checkAllMinisteryCeilings(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const validation = await SectoralMeasureValidationService.checkAllMinisteryCeilings(
        fiscalYear
      );
      res.json(validation);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate available margin
   */
  static async calculateAvailableMargin(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const margin = await SectoralMeasureValidationService.calculateAvailableMargin(
        ministryId,
        fiscalYear
      );
      res.json(margin);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate validation report
   */
  static async generateValidationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const report = await SectoralMeasureValidationService.generateValidationReport(
        ministryId,
        fiscalYear
      );
      res.json(report);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Integrate ministry measures
   */
  static async integrateMinistryMeasures(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.body.fiscalYear);
      const integratedBy = req.body.integratedBy || (req as any).user?.id;

      const result = await SectoralMeasureIntegrationService.integrateMinistryMeasures(
        ministryId,
        fiscalYear,
        integratedBy
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rollback integration
   */
  static async rollbackIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.body.fiscalYear);

      const result = await SectoralMeasureIntegrationService.rollbackIntegration(
        ministryId,
        fiscalYear
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get integration status
   */
  static async getIntegrationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const status = await SectoralMeasureIntegrationService.getIntegrationStatus(
        ministryId,
        fiscalYear
      );
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview integration
   */
  static async previewIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { ministryId } = req.params;
      const fiscalYear = parseInt(req.query.fiscalYear as string);

      const preview = await SectoralMeasureIntegrationService.previewIntegration(
        ministryId,
        fiscalYear
      );
      res.json(preview);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Integrate all ministries
   */
  static async integrateAllMinistries(req: Request, res: Response, next: NextFunction) {
    try {
      const fiscalYear = parseInt(req.body.fiscalYear);
      const integratedBy = req.body.integratedBy || (req as any).user?.id;

      const result = await SectoralMeasureIntegrationService.integrateAllMinistries(
        fiscalYear,
        integratedBy
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export sectoral measure to PDF
   */
  static async exportPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await SectoralMeasureExportService.generatePDF(id);

      const measure = await prisma.sectoralMeasure.findUnique({ where: { id } });
      const filename = `mesure-sectorielle-${measure?.measureCode || id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export sectoral measure to Excel
   */
  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await SectoralMeasureExportService.generateExcel(id);

      const measure = await prisma.sectoralMeasure.findUnique({ where: { id } });
      const filename = `mesure-sectorielle-${measure?.measureCode || id}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export sectoral measure to CSV
   */
  static async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const buffer = await SectoralMeasureExportService.generateCSV(id);

      const measure = await prisma.sectoralMeasure.findUnique({ where: { id } });
      const filename = `mesure-sectorielle-${measure?.measureCode || id}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default SectoralMeasureController;
