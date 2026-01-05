import { Request, Response, NextFunction } from 'express';
import { BudgetImportService } from '../services/budgetImport.service';
import { ExecutionImportService } from '../services/executionImport.service';
import { PIEImportService } from '../services/pieImport.service';
import { PIPImportService } from '../services/pipImport.service';
import { BadRequestError } from '../middleware/errorHandler';
import prisma from '../config/database';
import path from 'path';

export class ImportController {
  /**
   * Télécharger le template d'importation de budgets
   */
  static async downloadBudgetTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = BudgetImportService.generateBudgetTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Budgets.xlsx');

      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importer des budgets depuis un fichier Excel/CSV
   */
  static async importBudgets(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.csv' ? 'csv' : 'excel';

      const options = {
        skipValidation: req.body.skipValidation === 'true',
        stopOnError: req.body.stopOnError !== 'false',
        updateExisting: req.body.updateExisting === 'true',
        dryRun: req.body.dryRun === 'true',
      };

      const result = await BudgetImportService.importBudgets(filePath, fileType, options);

      // Enregistrer l'import dans l'historique
      await ImportController.logImport('BUDGET', result, (req as any).user?.userId);

      res.status(result.success ? 200 : 400).json({
        status: result.success ? 'success' : 'error',
        message: result.success
          ? `Importation réussie: ${result.successCount}/${result.totalRows} lignes`
          : `Importation échouée: ${result.errorCount} erreur(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Télécharger le template d'importation d'exécutions
   */
  static async downloadExecutionTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = ExecutionImportService.generateExecutionTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Executions.xlsx');

      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importer des exécutions depuis un fichier Excel/CSV
   */
  static async importExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.csv' ? 'csv' : 'excel';

      const options = {
        skipValidation: req.body.skipValidation === 'true',
        stopOnError: req.body.stopOnError !== 'false',
        updateExisting: req.body.updateExisting === 'true',
        dryRun: req.body.dryRun === 'true',
      };

      const result = await ExecutionImportService.importExecutions(filePath, fileType, options);

      // Enregistrer l'import dans l'historique
      await ImportController.logImport('EXECUTION', result, (req as any).user?.userId);

      res.status(result.success ? 200 : 400).json({
        status: result.success ? 'success' : 'error',
        message: result.success
          ? `Importation réussie: ${result.successCount}/${result.totalRows} lignes`
          : `Importation échouée: ${result.errorCount} erreur(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Télécharger le template d'importation PIE
   */
  static async downloadPIETemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = PIEImportService.generatePIETemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_PIE.xlsx');

      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importer des PIE depuis un fichier Excel/CSV
   */
  static async importPIE(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.csv' ? 'csv' : 'excel';

      const options = {
        skipValidation: req.body.skipValidation === 'true',
        stopOnError: req.body.stopOnError !== 'false',
        updateExisting: req.body.updateExisting === 'true',
        dryRun: req.body.dryRun === 'true',
      };

      const result = await PIEImportService.importPIE(filePath, fileType, options);

      // Enregistrer l'import dans l'historique
      await ImportController.logImport('PIE', result, (req as any).user?.userId);

      res.status(result.success ? 200 : 400).json({
        status: result.success ? 'success' : 'error',
        message: result.success
          ? `Importation réussie: ${result.successCount}/${result.totalRows} lignes`
          : `Importation échouée: ${result.errorCount} erreur(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Télécharger le template d'importation PIP
   */
  static async downloadPIPTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = PIPImportService.generatePIPTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_PIP.xlsx');

      res.send(template);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importer des PIP depuis un fichier Excel/CSV
   */
  static async importPIP(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new BadRequestError('Aucun fichier fourni');
      }

      const filePath = req.file.path;
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileType = fileExt === '.csv' ? 'csv' : 'excel';

      const options = {
        skipValidation: req.body.skipValidation === 'true',
        stopOnError: req.body.stopOnError !== 'false',
        updateExisting: req.body.updateExisting === 'true',
        dryRun: req.body.dryRun === 'true',
      };

      const result = await PIPImportService.importPIP(filePath, fileType, options);

      // Enregistrer l'import dans l'historique
      await ImportController.logImport('PIP', result, (req as any).user?.userId);

      res.status(result.success ? 200 : 400).json({
        status: result.success ? 'success' : 'error',
        message: result.success
          ? `Importation réussie: ${result.successCount}/${result.totalRows} lignes`
          : `Importation échouée: ${result.errorCount} erreur(s)`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enregistrer un import dans l'historique
   */
  private static async logImport(
    importType: string,
    result: any,
    userId?: string
  ): Promise<void> {
    try {
      await prisma.$queryRaw`
        INSERT INTO import_history (
          id, import_type, total_rows, success_count, error_count,
          status, errors, created_by, created_at
        ) VALUES (
          gen_random_uuid(),
          ${importType},
          ${result.totalRows},
          ${result.successCount},
          ${result.errorCount},
          ${result.success ? 'SUCCESS' : 'FAILED'},
          ${JSON.stringify(result.errors || [])}::jsonb,
          ${userId || null}::uuid,
          NOW()
        )
      `;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'historique d\'import:', error);
    }
  }

  /**
   * Obtenir l'historique des importations
   */
  static async getImportHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const importType = req.query.type as string;

      let whereClause = '';
      if (importType) {
        whereClause = `WHERE import_type = '${importType}'`;
      }

      const [imports, countResult] = await Promise.all([
        prisma.$queryRawUnsafe<any[]>(`
          SELECT * FROM import_history
          ${whereClause}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `),
        prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(*) as count FROM import_history
          ${whereClause}
        `),
      ]);

      const total = parseInt(countResult[0]?.count || '0');

      res.status(200).json({
        status: 'success',
        data: {
          imports,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      // Si la table n'existe pas, retourner un tableau vide
      res.status(200).json({
        status: 'success',
        data: {
          imports: [],
          pagination: {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
        },
      });
    }
  }
}
