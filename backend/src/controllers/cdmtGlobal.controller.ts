import { Request, Response, NextFunction } from 'express';
import { CDMTGlobalService } from '../services/cdmtGlobal.service';
import { CDMTGlobalCalculationService } from '../services/cdmtGlobalCalculation.service';
import { CDMTGlobalCBMTIntegrationService } from '../services/cdmtGlobalCBMTIntegration.service';
import { CDMTGlobalExportService } from '../services/cdmtGlobalExport.service';
import { CDMTGlobalEnhancedService } from '../services/cdmtGlobalEnhanced.service';
import { CDMTGlobalIterationService } from '../services/cdmtGlobalIteration.service';

export class CDMTGlobalController {
  // ===== SCENARIOS =====

  /**
   * Obtenir tous les scénarios
   */
  static async getScenarios(req: Request, res: Response, next: NextFunction) {
    try {
      const { fiscalYear, status, page, limit } = req.query;

      const filters = {
        fiscalYear: fiscalYear ? parseInt(fiscalYear as string, 10) : undefined,
        status: status as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await CDMTGlobalService.getScenarios(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un scénario par ID
   */
  static async getScenarioById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const scenario = await CDMTGlobalService.getScenarioById(id);

      res.status(200).json({
        status: 'success',
        data: scenario,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un scénario
   */
  static async createScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const data = {
        ...req.body,
        createdBy: userId,
      };

      const scenario = await CDMTGlobalService.createScenario(data);

      res.status(201).json({
        status: 'success',
        data: scenario,
        message: 'Scénario créé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un scénario
   */
  static async updateScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const scenario = await CDMTGlobalService.updateScenario(id, req.body);

      res.status(200).json({
        status: 'success',
        data: scenario,
        message: 'Scénario mis à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un scénario
   */
  static async deleteScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CDMTGlobalService.deleteScenario(id);

      res.status(200).json({
        status: 'success',
        message: 'Scénario supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Dupliquer un scénario
   */
  static async duplicateScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, code } = req.body;

      const scenario = await CDMTGlobalService.duplicateScenario(id, name, code);

      res.status(201).json({
        status: 'success',
        data: scenario,
        message: 'Scénario dupliqué avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activer un scénario
   */
  static async activateScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const scenario = await CDMTGlobalService.activateScenario(id, userId);

      res.status(200).json({
        status: 'success',
        data: scenario,
        message: 'Scénario activé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Désactiver un scénario
   */
  static async deactivateScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const scenario = await CDMTGlobalService.deactivateScenario(id);

      res.status(200).json({
        status: 'success',
        data: scenario,
        message: 'Scénario désactivé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Archiver un scénario
   */
  static async archiveScenario(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const scenario = await CDMTGlobalService.archiveScenario(id);

      res.status(200).json({
        status: 'success',
        data: scenario,
        message: 'Scénario archivé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== POLICY MEASURES =====

  /**
   * Obtenir les mesures nouvelles d'un scénario
   */
  static async getPolicyMeasures(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { ministryId } = req.query;

      const filters = { ministryId: ministryId as string | undefined };
      const measures = await CDMTGlobalService.getPolicyMeasures(scenarioId, filters);

      res.status(200).json({
        status: 'success',
        data: measures,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une mesure nouvelle
   */
  static async createPolicyMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const userId = (req as any).user?.id;

      const data = {
        ...req.body,
        scenarioId,
        createdBy: userId,
      };

      const measure = await CDMTGlobalService.createPolicyMeasure(data);

      res.status(201).json({
        status: 'success',
        data: measure,
        message: 'Mesure nouvelle créée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une mesure nouvelle
   */
  static async updatePolicyMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const measure = await CDMTGlobalService.updatePolicyMeasure(id, req.body);

      res.status(200).json({
        status: 'success',
        data: measure,
        message: 'Mesure nouvelle mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une mesure nouvelle
   */
  static async deletePolicyMeasure(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CDMTGlobalService.deletePolicyMeasure(id);

      res.status(200).json({
        status: 'success',
        message: 'Mesure nouvelle supprimée avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import massif de mesures nouvelles
   */
  static async bulkImportPolicyMeasures(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { measures } = req.body;

      const result = await CDMTGlobalService.bulkImportPolicyMeasures(scenarioId, measures);

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.imported} mesure(s) importée(s) avec succès`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== MARGIN ALLOCATION =====

  /**
   * Obtenir les allocations de marge d'un scénario
   */
  static async getMarginAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const allocations = await CDMTGlobalService.getMarginAllocations(scenarioId);

      res.status(200).json({
        status: 'success',
        data: allocations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour l'allocation de marge pour un ministère
   */
  static async updateMarginAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, ministryId } = req.params;
      const userId = (req as any).user?.id;

      const data = {
        ...req.body,
        createdBy: userId,
      };

      const allocation = await CDMTGlobalService.updateMarginAllocation(
        scenarioId,
        ministryId,
        data
      );

      res.status(200).json({
        status: 'success',
        data: allocation,
        message: 'Allocation de marge mise à jour avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mise à jour multiple d'allocations
   */
  static async bulkUpdateMarginAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { allocations } = req.body;

      const result = await CDMTGlobalService.bulkUpdateMarginAllocations(scenarioId, allocations);

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.updated} allocation(s) mise(s) à jour avec succès`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Réinitialiser toutes les allocations à 0
   */
  static async resetMarginAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalService.resetMarginAllocations(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
        message: 'Allocations réinitialisées avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir la marge restante à allouer
   */
  static async getRemainingMargin(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalService.getRemainingMargin(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== MINISTERIAL CEILINGS =====

  /**
   * Obtenir les plafonds ministériels d'un scénario
   */
  static async getMinisterialCeilings(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { ministryId, year } = req.query;

      const filters = {
        ministryId: ministryId as string | undefined,
        year: year ? parseInt(year as string, 10) : undefined,
      };

      const ceilings = await CDMTGlobalService.getMinisterialCeilings(scenarioId, filters);

      res.status(200).json({
        status: 'success',
        data: ceilings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le plafond d'un ministère pour un scénario
   */
  static async getMinisterialCeilingByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, ministryId } = req.params;
      const ceilings = await CDMTGlobalService.getMinisterialCeilingByMinistry(
        scenarioId,
        ministryId
      );

      res.status(200).json({
        status: 'success',
        data: ceilings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculer tous les plafonds d'un scénario
   */
  static async recalculateCeilings(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalService.recalculateCeilings(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.calculated} plafond(s) calculé(s) avec succès`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider les allocations de marge
   */
  static async validateAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const validation = await CDMTGlobalCalculationService.validateMarginAllocation(scenarioId);

      res.status(200).json({
        status: 'success',
        data: validation,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== COMPARISON =====

  /**
   * Comparer plusieurs scénarios
   */
  static async compareScenarios(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { scenarioIds } = req.body;

      if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length < 2) {
        res.status(400).json({
          status: 'error',
          message: 'Au moins 2 scénarios doivent être fournis pour la comparaison',
        });
        return;
      }

      const comparison = await CDMTGlobalService.compareScenarios(scenarioIds);

      res.status(200).json({
        status: 'success',
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les différences détaillées entre deux scénarios
   */
  static async getScenarioDifferences(req: Request, res: Response, next: NextFunction) {
    try {
      const { id1, id2 } = req.params;
      const differences = await CDMTGlobalService.getScenarioDifferences(id1, id2);

      res.status(200).json({
        status: 'success',
        data: differences,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== CBMT INTEGRATION =====

  /**
   * Synchroniser les plafonds vers CBMT
   */
  static async syncCBMT(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalCBMTIntegrationService.syncCeilingsToCBMT(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
        message: `Synchronisation réussie: ${result.synced} plafond(s) synchronisé(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un document CBMT depuis un scénario
   */
  static async createCBMT(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const userId = (req as any).user?.id;

      const data = {
        ...req.body,
        createdBy: userId,
      };

      const result = await CDMTGlobalCBMTIntegrationService.createCBMTFromScenario(
        scenarioId,
        data
      );

      res.status(201).json({
        status: 'success',
        data: result,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider la cohérence avec CBMT
   */
  static async validateCBMTCoherence(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, cbmtId } = req.params;
      const validation = await CDMTGlobalCBMTIntegrationService.validateCBMTCoherence(
        scenarioId,
        cbmtId
      );

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
      const { scenarioId } = req.params;
      const buffer = await CDMTGlobalExportService.exportToExcel(scenarioId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=cdmt_global_${scenarioId}.xlsx`);
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
      const { scenarioId } = req.params;
      const csv = await CDMTGlobalExportService.exportToCSV(scenarioId);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=cdmt_global_${scenarioId}.csv`);
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
      const { scenarioId } = req.params;
      const buffer = await CDMTGlobalExportService.exportSummaryPDF(scenarioId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=cdmt_global_summary_${scenarioId}.pdf`);
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
      const { scenarioId } = req.params;
      const report = await CDMTGlobalExportService.generateComparisonReport(scenarioId);

      res.status(200).json({
        status: 'success',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-01: ENHANCED TREND BUDGET CALCULATION =====

  /**
   * Get growth hypotheses
   */
  static async getGrowthHypotheses(_req: Request, res: Response, next: NextFunction) {
    try {
      const hypotheses = CDMTGlobalEnhancedService.getDefaultGrowthHypotheses();

      res.status(200).json({
        status: 'success',
        data: hypotheses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Identify temporary expenses
   */
  static async identifyTemporaryExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const expenses = await CDMTGlobalEnhancedService.identifyTemporaryExpenses(trendConfigId);

      res.status(200).json({
        status: 'success',
        data: expenses,
        count: expenses.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculate trend budgets by ministry with category breakdown
   */
  static async calculateTrendBudgetsByMinistry(req: Request, res: Response, next: NextFunction) {
    try {
      const { trendConfigId } = req.params;
      const { customHypotheses } = req.body;

      const result = await CDMTGlobalEnhancedService.calculateTrendBudgetsByMinistry(
        trendConfigId,
        customHypotheses
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-02: ENHANCED FISCAL MARGIN CALCULATION =====

  /**
   * Calculate enhanced fiscal margin with category and resource type breakdown
   */
  static async calculateEnhancedFiscalMargin(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalEnhancedService.calculateEnhancedFiscalMargin(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-03: CENTRAL NEW MEASURES WITH TRACEABILITY =====

  /**
   * Create policy measure with full traceability
   */
  static async createPolicyMeasureWithTraceability(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const userId = (req as any).user?.id;

      const data = {
        ...req.body,
        scenarioId,
        createdBy: userId,
      };

      const result = await CDMTGlobalEnhancedService.createPolicyMeasureWithTraceability(data);

      res.status(201).json({
        status: 'success',
        data: result,
        message: 'Mesure nouvelle créée avec traçabilité complète',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get measures aggregated by ministry
   */
  static async getMeasuresByMinistryAggregated(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalEnhancedService.getMeasuresByMinistryAggregated(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-04: MARGIN DISTRIBUTION WITH JUSTIFICATIONS =====

  /**
   * Suggest margin allocation based on strategy
   */
  static async suggestMarginAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { strategy } = req.query;

      const result = await CDMTGlobalEnhancedService.suggestMarginAllocation(
        scenarioId,
        (strategy as 'EQUAL' | 'PRIORITY_WEIGHTED' | 'HISTORICAL_BASED' | 'CUSTOM') || 'PRIORITY_WEIGHTED'
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply margin allocation with justification requirement
   */
  static async applyMarginAllocationWithJustification(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { allocations } = req.body;
      const userId = (req as any).user?.id;

      const result = await CDMTGlobalEnhancedService.applyMarginAllocationWithJustification(
        scenarioId,
        allocations,
        userId
      );

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.applied} allocation(s) appliquée(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-05: CEILING CALCULATION BY CATEGORY =====

  /**
   * Calculate ministerial ceilings with category breakdown
   */
  static async calculateCeilingsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalIterationService.calculateCeilingsByCategory(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== REQ-GLOB-06: CBMT-CDMT GLOBAL ITERATION =====

  /**
   * Initialize iteration between CDMT Global and CBMT
   */
  static async initializeIteration(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const { cbmtDocumentId, convergenceThreshold } = req.body;

      const result = await CDMTGlobalIterationService.initializeIteration(
        scenarioId,
        cbmtDocumentId,
        convergenceThreshold
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform iteration adjustment
   */
  static async performIterationAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, cbmtDocumentId } = req.params;
      const { adjustmentType } = req.body;

      const result = await CDMTGlobalIterationService.performIterationAdjustment(
        scenarioId,
        cbmtDocumentId,
        adjustmentType
      );

      res.status(200).json({
        status: 'success',
        data: result,
        message: `${result.adjustmentsMade.length} ajustement(s) effectué(s)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get iteration summary
   */
  static async getIterationSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalIterationService.getIterationSummary(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate convergence between CDMT Global and CBMT
   */
  static async validateConvergence(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId, cbmtDocumentId } = req.params;
      const { tolerance } = req.query;

      const result = await CDMTGlobalIterationService.validateConvergence(
        scenarioId,
        cbmtDocumentId,
        tolerance ? parseFloat(tolerance as string) : undefined
      );

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== INTEGRATION MODULE FISCAL MARGINS =====

  /**
   * Obtenir les marges disponibles depuis le module FiscalMargin
   */
  static async getAvailableMarginsFromModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalCalculationService.getAvailableMarginsFromModule(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les taux de réserves depuis le module FiscalMargin
   */
  static async getReserveRatesFromModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalCalculationService.getReserveRatesFromModule(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les clés de répartition depuis le module FiscalMargin
   */
  static async getDistributionKeysFromModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalCalculationService.getDistributionKeysFromModule(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les marges par ministère depuis le module FiscalMargin
   */
  static async getMinistryMarginsFromModule(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalCalculationService.getMinistryMarginsFromModule(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer les plafonds en utilisant les données du module FiscalMargin
   */
  static async calculateCeilingsWithFiscalMargin(req: Request, res: Response, next: NextFunction) {
    try {
      const { scenarioId } = req.params;
      const result = await CDMTGlobalCalculationService.calculateCeilingsWithFiscalMarginModule(scenarioId);

      res.status(200).json({
        status: 'success',
        data: result,
        message: result.usedFiscalMarginData
          ? `${result.calculated} plafond(s) calculé(s) avec les données du module FiscalMargin`
          : `${result.calculated} plafond(s) calculé(s) avec les allocations manuelles (pas de données FiscalMargin)`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le résumé de l'intégration FiscalMargin
   */
  static async getFiscalMarginIntegrationSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const result = await CDMTGlobalCalculationService.getFiscalMarginIntegrationSummary(macroFrameworkId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
