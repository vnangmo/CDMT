import { Request, Response, NextFunction } from 'express';
import { TrendBudgetService } from '../services/trendBudget.service';
import { TrendBudgetImportService } from '../services/trendBudgetImport.service';
import { TrendCalculationService } from '../services/trendCalculation.service';
import { TrendExportService } from '../services/trendExport.service';

export class TrendBudgetController {
  // ===== TREND BUDGET CONFIG =====

  /**
   * Obtenir toutes les configurations
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { fiscalYear, status, page, limit } = req.query;

      const filters = {
        fiscalYear: fiscalYear ? parseInt(fiscalYear as string, 10) : undefined,
        status: status as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await TrendBudgetService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une configuration par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const config = await TrendBudgetService.getById(id);

      res.status(200).json({
        status: 'success',
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une configuration
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const data = {
        ...req.body,
        createdBy: userId,
      };

      const config = await TrendBudgetService.create(data);

      res.status(201).json({
        status: 'success',
        data: config,
        message: 'Configuration créée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une configuration
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const config = await TrendBudgetService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        data: config,
        message: 'Configuration mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une configuration
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TrendBudgetService.delete(id);

      res.status(200).json({
        status: 'success',
        message: 'Configuration supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider une configuration
   */
  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const config = await TrendBudgetService.validate(id, userId);

      res.status(200).json({
        status: 'success',
        data: config,
        message: 'Configuration validée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approuver une configuration
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const config = await TrendBudgetService.approve(id, userId);

      res.status(200).json({
        status: 'success',
        data: config,
        message: 'Configuration approuvée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== HISTORICAL BUDGETS =====

  /**
   * Obtenir les budgets historiques
   */
  static async getHistoricalBudgets(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const { ministryId, fiscalYear, isTemporary, page, limit } = req.query;

      const filters = {
        ministryId: ministryId as string | undefined,
        fiscalYear: fiscalYear ? parseInt(fiscalYear as string, 10) : undefined,
        isTemporary: isTemporary !== undefined ? isTemporary === 'true' : undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await TrendBudgetService.getHistoricalBudgets(configId, filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un budget historique
   */
  static async createHistoricalBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const data = {
        ...req.body,
        userId,
      };

      const historical = await TrendBudgetService.createHistoricalBudget(data);

      res.status(201).json({
        status: 'success',
        data: historical,
        message: 'Budget historique créé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un budget historique
   */
  static async updateHistoricalBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const historical = await TrendBudgetService.updateHistoricalBudget(id, req.body);

      res.status(200).json({
        status: 'success',
        data: historical,
        message: 'Budget historique mis à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un budget historique
   */
  static async deleteHistoricalBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TrendBudgetService.deleteHistoricalBudget(id);

      res.status(200).json({
        status: 'success',
        message: 'Budget historique supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Basculer le flag isTemporary
   */
  static async toggleTemporary(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const historical = await TrendBudgetService.toggleTemporary(id);

      res.status(200).json({
        status: 'success',
        data: historical,
        message: 'Flag temporaire basculé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== IMPORT =====

  /**
   * Importer depuis Excel
   */
  static async importExcel(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { configId } = req.params;
      const userId = (req as any).user?.id;

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Aucun fichier fourni',
        });
      }

      const result = await TrendBudgetImportService.importFromExcel(
        configId,
        req.file.path,
        userId
      );

      res.status(200).json({
        status: result.success ? 'success' : 'partial',
        data: result,
        message: `Import terminé: ${result.imported} ligne(s) importée(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importer depuis CSV
   */
  static async importCSV(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const { configId } = req.params;
      const userId = (req as any).user?.id;

      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'Aucun fichier fourni',
        });
      }

      const result = await TrendBudgetImportService.importFromCSV(
        configId,
        req.file.path,
        userId
      );

      res.status(200).json({
        status: result.success ? 'success' : 'partial',
        data: result,
        message: `Import terminé: ${result.imported} ligne(s) importée(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Télécharger le template d'import
   */
  static async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const buffer = TrendBudgetImportService.generateTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=template_budgets_historiques.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  // ===== PROJECTIONS =====

  /**
   * Obtenir les projections
   */
  static async getTrendProjections(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const { ministryId, isPriorityMinistry, calculationMethod, page, limit } = req.query;

      const filters = {
        ministryId: ministryId as string | undefined,
        isPriorityMinistry: isPriorityMinistry !== undefined ? isPriorityMinistry === 'true' : undefined,
        calculationMethod: calculationMethod as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await TrendBudgetService.getTrendProjections(configId, filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une projection par ID
   */
  static async getTrendProjectionById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await TrendBudgetService.getTrendProjectionById(id);

      res.status(200).json({
        status: 'success',
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une projection
   */
  static async updateTrendProjection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await TrendBudgetService.updateTrendProjection(id, req.body);

      res.status(200).json({
        status: 'success',
        data: projection,
        message: 'Projection mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer toutes les projections
   */
  static async calculateProjections(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const result = await TrendBudgetService.recalculateAll(configId);

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.calculated} projection(s) calculée(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculer une projection
   */
  static async recalculateProjection(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const projection = await TrendBudgetService.recalculateProjection(id);

      res.status(200).json({
        status: 'success',
        data: projection,
        message: 'Projection recalculée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== SUMMARIES =====

  /**
   * Obtenir le résumé par ministère
   */
  static async getSummaryByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const summary = await TrendCalculationService.getSummaryByMinistry(configId);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le résumé par priorité
   */
  static async getSummaryByPriority(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const summary = await TrendCalculationService.getSummaryByPriority(configId);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider la cohérence
   */
  static async validateCoherence(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const validation = await TrendCalculationService.validateCoherence(configId);

      res.status(200).json({
        status: 'success',
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== EXPORTS =====

  /**
   * Exporter vers Excel
   */
  static async exportExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const buffer = await TrendExportService.exportToExcel(configId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=trend_budget_${configId}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter vers CSV
   */
  static async exportCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const csv = await TrendExportService.exportToCSV(configId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=trend_budget_${configId}.csv`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter vers PDF
   */
  static async exportPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const buffer = await TrendExportService.exportSummaryPDF(configId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=trend_budget_summary_${configId}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le rapport comparatif
   */
  static async getComparisonReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { configId } = req.params;
      const report = await TrendExportService.generateComparisonReport(configId);

      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }
}
