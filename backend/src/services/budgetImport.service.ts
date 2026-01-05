import { ImportService } from './import.service';
import {
  ImportResult,
  ImportMapping,
  ImportOptions,
  BudgetImportRow,
} from '../types/import.types';
import prisma from '../config/database';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';

export class BudgetImportService {
  /**
   * Mapping pour l'importation de budgets
   */
  static getBudgetMapping(): ImportMapping[] {
    return [
      {
        excelColumn: 'Année',
        dbField: 'annee',
        required: true,
        type: 'number',
        validator: (value) => value >= 2020 && value <= 2050,
      },
      {
        excelColumn: 'Code Ministère',
        dbField: 'ministereCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Code Programme',
        dbField: 'programmeCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Code Action',
        dbField: 'actionCode',
        required: false,
        type: 'string',
        transformer: (value) => (value ? String(value).toUpperCase().trim() : null),
      },
      {
        excelColumn: 'Code Activité',
        dbField: 'activiteCode',
        required: false,
        type: 'string',
        transformer: (value) => (value ? String(value).toUpperCase().trim() : null),
      },
      {
        excelColumn: 'Code Catégorie Économique',
        dbField: 'categorieEconomiqueCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Code Source Financement',
        dbField: 'sourceFinancementCode',
        required: false,
        type: 'string',
        transformer: (value) => (value ? String(value).toUpperCase().trim() : null),
      },
      {
        excelColumn: 'Montant',
        dbField: 'montant',
        required: true,
        type: 'number',
        validator: (value) => value >= 0,
      },
      {
        excelColumn: 'Description',
        dbField: 'description',
        required: false,
        type: 'string',
      },
    ];
  }

  /**
   * Valider les références (ministères, programmes, etc.)
   */
  static async validateReferences(data: BudgetImportRow[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Récupérer tous les codes uniques
    const ministryCodesSet = new Set(data.map((row) => row.ministereCode));
    const programCodesSet = new Set(data.map((row) => row.programmeCode));
    const actionCodesSet = new Set(data.filter((row) => row.actionCode).map((row) => row.actionCode!));
    const activityCodesSet = new Set(
      data.filter((row) => row.activiteCode).map((row) => row.activiteCode!)
    );
    const economicCategoryCodesSet = new Set(data.map((row) => row.categorieEconomiqueCode));
    const financingSourceCodesSet = new Set(
      data.filter((row) => row.sourceFinancementCode).map((row) => row.sourceFinancementCode!)
    );

    // Vérifier les ministères
    const ministryCodes = Array.from(ministryCodesSet);
    const ministries = await prisma.ministry.findMany({
      where: { code: { in: ministryCodes } },
      select: { code: true },
    });
    const foundMinistryCodes = ministries.map((m) => m.code);
    const missingMinistryCodes = ministryCodes.filter((code) => !foundMinistryCodes.includes(code));
    if (missingMinistryCodes.length > 0) {
      errors.push(`Ministères introuvables: ${missingMinistryCodes.join(', ')}`);
    }

    // Vérifier les programmes
    const programCodes = Array.from(programCodesSet);
    const programs = await prisma.program.findMany({
      where: { code: { in: programCodes } },
      select: { code: true },
    });
    const foundProgramCodes = programs.map((p) => p.code);
    const missingProgramCodes = programCodes.filter((code) => !foundProgramCodes.includes(code));
    if (missingProgramCodes.length > 0) {
      errors.push(`Programmes introuvables: ${missingProgramCodes.join(', ')}`);
    }

    // Vérifier les catégories économiques
    const economicCategoryCodes = Array.from(economicCategoryCodesSet);
    const economicCategories = await prisma.economicCategory.findMany({
      where: { code: { in: economicCategoryCodes } },
      select: { code: true },
    });
    const foundEconomicCategoryCodes = economicCategories.map((c) => c.code);
    const missingEconomicCategoryCodes = economicCategoryCodes.filter(
      (code) => !foundEconomicCategoryCodes.includes(code)
    );
    if (missingEconomicCategoryCodes.length > 0) {
      errors.push(`Catégories économiques introuvables: ${missingEconomicCategoryCodes.join(', ')}`);
    }

    // Vérifier les sources de financement si présentes
    if (financingSourceCodesSet.size > 0) {
      const financingSourceCodes = Array.from(financingSourceCodesSet);
      const financingSources = await prisma.financingSource.findMany({
        where: { code: { in: financingSourceCodes } },
        select: { code: true },
      });
      const foundFinancingSourceCodes = financingSources.map((f) => f.code);
      const missingFinancingSourceCodes = financingSourceCodes.filter(
        (code) => !foundFinancingSourceCodes.includes(code)
      );
      if (missingFinancingSourceCodes.length > 0) {
        errors.push(`Sources de financement introuvables: ${missingFinancingSourceCodes.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Importer des budgets depuis un fichier
   */
  static async importBudgets(
    filePath: string,
    fileType: 'excel' | 'csv',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const mapping = this.getBudgetMapping();

    // Importer et valider le fichier
    const result = await ImportService.importFile(filePath, fileType, mapping, options);

    if (!result.success || !result.data) {
      return result;
    }

    // Valider les références
    const referenceValidation = await this.validateReferences(result.data as BudgetImportRow[]);

    if (!referenceValidation.valid) {
      result.success = false;
      result.errors.push(
        ...referenceValidation.errors.map((error, index) => ({
          row: 0,
          message: error,
        }))
      );
      return result;
    }

    // Si dry run, ne pas insérer les données
    if (options.dryRun) {
      return result;
    }

    // TODO: Insérer les données dans la base
    // Cette partie sera implémentée selon le modèle de données pour les budgets
    // qui n'est pas encore défini dans le schéma Prisma

    return result;
  }

  /**
   * Générer un template Excel pour l'importation de budgets
   */
  static generateBudgetTemplate(): Buffer {
    const mapping = this.getBudgetMapping();
    return ImportService.generateTemplate(mapping, 'Template_Import_Budgets.xlsx');
  }
}
