import { Request, Response, NextFunction } from 'express';
import { TOFEService } from '../services/tofe.service';
import { TOFECalculationService } from '../services/tofeCalculation.service';
import { TOFEExportService } from '../services/tofeExport.service';

export class TOFEController {
  /**
   * Obtenir tous les documents TOFE
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

      const result = await TOFEService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un document TOFE par ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await TOFEService.getById(id);

      res.status(200).json({
        status: 'success',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un document TOFE par cadre macro et année fiscale
   */
  static async getByMacroFrameworkAndYear(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId, fiscalYear } = req.params;
      const document = await TOFEService.getByMacroFrameworkAndYear(
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
   * Créer un document TOFE
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const documentData = {
        ...req.body,
        createdBy: userId,
      };

      const document = await TOFEService.create(documentData);

      res.status(201).json({
        status: 'success',
        message: 'Document TOFE créé avec succès',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Générer automatiquement un document TOFE à partir d'un cadre macro
   */
  static async generateFromMacroFramework(req: Request, res: Response, next: NextFunction) {
    try {
      const { macroFrameworkId } = req.params;
      const userId = (req as any).user?.id;

      const document = await TOFEService.generateFromMacroFramework(macroFrameworkId, userId);

      res.status(201).json({
        status: 'success',
        message: 'Document TOFE généré automatiquement avec succès',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour un document TOFE
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await TOFEService.update(id, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Document TOFE mis à jour avec succès',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Valider un document TOFE
   */
  static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const document = await TOFEService.validate(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Document TOFE validé avec succès',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approuver un document TOFE
   */
  static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const document = await TOFEService.approve(id, userId);

      res.status(200).json({
        status: 'success',
        message: 'Document TOFE approuvé avec succès',
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer un document TOFE
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await TOFEService.delete(id);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir les lignes d'un document TOFE
   */
  static async getLines(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lines = await TOFEService.getLines(id);

      res.status(200).json({
        status: 'success',
        data: lines,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Créer une ligne TOFE
   */
  static async createLine(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const lineData = {
        ...req.body,
        tofeDocumentId: id,
      };

      const line = await TOFEService.createLine(lineData);

      res.status(201).json({
        status: 'success',
        message: 'Ligne TOFE créée avec succès',
        data: line,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mettre à jour une ligne TOFE
   */
  static async updateLine(req: Request, res: Response, next: NextFunction) {
    try {
      const { lineId } = req.params;
      const line = await TOFEService.updateLine(lineId, req.body);

      res.status(200).json({
        status: 'success',
        message: 'Ligne TOFE mise à jour avec succès',
        data: line,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Supprimer une ligne TOFE
   */
  static async deleteLine(req: Request, res: Response, next: NextFunction) {
    try {
      const { lineId } = req.params;
      const result = await TOFEService.deleteLine(lineId);

      res.status(200).json({
        status: 'success',
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recalculer toutes les lignes d'un document TOFE
   */
  static async recalculate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await TOFEService.recalculateAllLines(id);

      res.status(200).json({
        status: 'success',
        message: 'Lignes TOFE recalculées avec succès',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer le solde budgétaire
   */
  static async calculateFiscalBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const balances = await TOFECalculationService.calculateFiscalBalance(id);

      res.status(200).json({
        status: 'success',
        data: balances,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Vérifier la cohérence d'un document TOFE
   */
  static async checkConsistency(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const consistency = await TOFECalculationService.checkConsistency(id);

      res.status(200).json({
        status: 'success',
        data: consistency,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Calculer les ratios budgétaires
   */
  static async calculateRatios(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ratios = await TOFECalculationService.calculateBudgetRatios(id);

      res.status(200).json({
        status: 'success',
        data: ratios,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtenir un résumé du document TOFE
   */
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const summary = await TOFECalculationService.getSummary(id);

      res.status(200).json({
        status: 'success',
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter un document TOFE en Excel
   */
  static async exportToExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { buffer, filename, mimeType } = await TOFEExportService.export(id, 'excel');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exporter un document TOFE en PDF
   */
  static async exportToPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { buffer, filename, mimeType } = await TOFEExportService.export(id, 'pdf');

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export default TOFEController;
