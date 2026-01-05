import { Request, Response, NextFunction } from 'express';
import { CBMTService } from '../services/cbmt.service';
import { CBMTCalculationService } from '../services/cbmtCalculation.service';
import { CBMTAnalysisService } from '../services/cbmtAnalysis.service';
import { CBMTExportService } from '../services/cbmtExport.service';

export class CBMTController {
  // ===== DOCUMENTS CBMT =====

  /**
   * Obtenir tous les documents CBMT
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, fiscalYear, status, page, limit } = req.query;

      const filters = {
        macroFrameworkId: macroFrameworkId as string | undefined,
        fiscalYear: fiscalYear ? parseInt(fiscalYear as string, 10) : undefined,
        status: status as string | undefined,
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      };

      const result = await CBMTService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un document CBMT par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await CBMTService.getById(id);

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un document CBMT par cadre macro et année fiscale
   */
  static async getByMacroFrameworkAndYear(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, fiscalYear } = req.params;
      const document = await CBMTService.getByMacroFrameworkAndYear(
        macroFrameworkId,
        parseInt(fiscalYear, 10)
      );

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un document CBMT
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const documentData = {
        ...req.body,
        createdBy: userId,
      };

      const document = await CBMTService.create(documentData);

      res.status(201).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un document CBMT
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await CBMTService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un document CBMT
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CBMTService.delete(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider un document CBMT
   */
  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const document = await CBMTService.validate(id, userId);

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approuver un document CBMT
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const document = await CBMTService.approve(id, userId);

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Générer un CBMT depuis un TOFE
   */
  static async generateFromTOFE(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const userId = (req as any).user?.id;
      const document = await CBMTService.generateFromTOFE(macroFrameworkId, userId);

      res.status(201).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== AGRÉGATS =====

  /**
   * Obtenir les agrégats d'un document CBMT
   */
  static async getAggregates(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const { aggregateType, economicNatureId } = req.query;

      const aggregates = await CBMTService.getAggregates(cbmtDocumentId, {
        aggregateType: aggregateType as string | undefined,
        economicNatureId: economicNatureId as string | undefined,
      });

      res.status(200).json({
        status: 'success',
        data: aggregates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer un agrégat CBMT
   */
  static async createAggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const aggregate = await CBMTService.createAggregate(req.body);

      res.status(201).json({
        status: 'success',
        data: aggregate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un agrégat CBMT
   */
  static async updateAggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const aggregate = await CBMTService.updateAggregate(id, req.body);

      res.status(200).json({
        status: 'success',
        data: aggregate,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un agrégat CBMT
   */
  static async deleteAggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CBMTService.deleteAggregate(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== RÉSERVES =====

  /**
   * Obtenir les réserves d'un document CBMT
   */
  static async getReserves(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const reserves = await CBMTService.getReserves(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: reserves,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une réserve CBMT
   */
  static async createReserve(req: Request, res: Response, next: NextFunction) {
    try {
      const reserve = await CBMTService.createReserve(req.body);

      res.status(201).json({
        status: 'success',
        data: reserve,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une réserve CBMT
   */
  static async updateReserve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const reserve = await CBMTService.updateReserve(id, req.body);

      res.status(200).json({
        status: 'success',
        data: reserve,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une réserve CBMT
   */
  static async deleteReserve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CBMTService.deleteReserve(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Allouer une réserve
   */
  static async allocateReserve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { year, amount } = req.body;
      const result = await CBMTCalculationService.allocateReserve(id, year, amount);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== CALCULS =====

  /**
   * Recalculer les écarts
   */
  static async recalculateGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const result = await CBMTCalculationService.recalculateGaps(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Analyser les écarts budgétaires
   */
  static async analyzeGaps(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const result = await CBMTCalculationService.analyzeGaps(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir le résumé budgétaire
   */
  static async getBudgetSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const result = await CBMTCalculationService.getBudgetSummary(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer les plafonds de dépenses
   */
  static async calculateSpendingCeilings(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const result = await CBMTCalculationService.calculateSpendingCeilings(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Détecter les dépassements
   */
  static async detectOverruns(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const result = await CBMTCalculationService.detectOverruns(cbmtDocumentId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== ANALYSES =====

  /**
   * Obtenir toutes les analyses
   */
  static async getAnalyses(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const { analysisType } = req.query;
      const analyses = await CBMTAnalysisService.getAnalyses(
        cbmtDocumentId,
        analysisType as string | undefined
      );

      res.status(200).json({
        status: 'success',
        data: analyses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir une analyse par ID
   */
  static async getAnalysisById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const analysis = await CBMTAnalysisService.getAnalysisById(id);

      res.status(200).json({
        status: 'success',
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exécuter une analyse de sensibilité
   */
  static async runSensitivityAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const userId = (req as any).user?.id;
      const { gdpGrowthVariation, inflationVariation } = req.body;

      const result = await CBMTAnalysisService.runSensitivityAnalysis(
        cbmtDocumentId,
        { gdpGrowthVariation, inflationVariation },
        userId
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exécuter une simulation de choc
   */
  static async runShockSimulation(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const userId = (req as any).user?.id;
      const { shockType, magnitude, duration } = req.body;

      const result = await CBMTAnalysisService.runShockSimulation(
        cbmtDocumentId,
        { shockType, magnitude, duration },
        userId
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer les ratios de soutenabilité
   */
  static async calculateSustainabilityRatios(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const userId = (req as any).user?.id;
      const { gdpProjections } = req.body;

      const result = await CBMTAnalysisService.calculateSustainabilityRatios(
        cbmtDocumentId,
        gdpProjections,
        userId
      );

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une analyse
   */
  static async deleteAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await CBMTAnalysisService.deleteAnalysis(id);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===== EXPORTS =====

  /**
   * Export Excel
   */
  static async exportToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const buffer = await CBMTExportService.exportToExcel(cbmtDocumentId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=CBMT-${cbmtDocumentId}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export PDF
   */
  static async exportToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { cbmtDocumentId } = req.params;
      const buffer = await CBMTExportService.exportToPDF(cbmtDocumentId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=CBMT-${cbmtDocumentId}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default CBMTController;
