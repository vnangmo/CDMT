import { PrismaClient } from '@prisma/client';
import { ImportService } from './import.service';
import { ImportMapping } from '../types/import.types';
import { BadRequestError, NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class TrendBudgetImportService {
  /**
   * Définition du mapping pour l'import de budgets historiques
   */
  private static getImportMapping(): ImportMapping[] {
    return [
      {
        excelColumn: 'Ministry Code',
        dbField: 'ministryCode',
        type: 'string',
        required: true,
      },
      {
        excelColumn: 'Program Code',
        dbField: 'programCode',
        type: 'string',
        required: false,
      },
      {
        excelColumn: 'Economic Nature',
        dbField: 'economicNatureCode',
        type: 'string',
        required: false,
      },
      {
        excelColumn: 'Funding Source',
        dbField: 'fundingSourceCode',
        type: 'string',
        required: false,
      },
      {
        excelColumn: 'Fiscal Year',
        dbField: 'fiscalYear',
        type: 'number',
        required: true,
        validator: (value: any) => {
          const year = Number(value);
          return year >= 2000 && year <= 2100;
        },
      },
      {
        excelColumn: 'Budget Amount',
        dbField: 'budgetAmount',
        type: 'number',
        required: true,
        validator: (value: any) => Number(value) >= 0,
      },
      {
        excelColumn: 'Executed Amount',
        dbField: 'executedAmount',
        type: 'number',
        required: false,
        validator: (value: any) => !value || Number(value) >= 0,
      },
      {
        excelColumn: 'Is Temporary',
        dbField: 'isTemporary',
        type: 'boolean',
        required: false,
        transformer: (value: any) => {
          if (typeof value === 'boolean') return value;
          if (typeof value === 'number') return value === 1;
          if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            return lower === 'true' || lower === 'oui' || lower === 'yes' || lower === '1';
          }
          return false;
        },
      },
      {
        excelColumn: 'Notes',
        dbField: 'notes',
        type: 'string',
        required: false,
      },
    ];
  }

  /**
   * Importer depuis un fichier Excel
   */
  static async importFromExcel(
    trendConfigId: string,
    filePath: string,
    userId: string
  ): Promise<{
    success: boolean;
    imported: number;
    errors: any[];
    warnings: any[];
  }> {
    // Vérifier que la config existe
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Importer le fichier
    const mapping = this.getImportMapping();
    const importResult = await ImportService.importFile(filePath, 'excel', mapping, {
      stopOnError: false,
    });

    if (!importResult.success) {
      return {
        success: false,
        imported: 0,
        errors: importResult.errors || [],
        warnings: importResult.warnings || [],
      };
    }

    // Traiter les données importées
    const result = await this.processImportBatch(
      trendConfigId,
      importResult.data || [],
      userId,
      'EXCEL'
    );

    return {
      success: result.imported > 0,
      imported: result.imported,
      errors: result.errors,
      warnings: importResult.warnings || [],
    };
  }

  /**
   * Importer depuis un fichier CSV
   */
  static async importFromCSV(
    trendConfigId: string,
    filePath: string,
    userId: string
  ): Promise<{
    success: boolean;
    imported: number;
    errors: any[];
    warnings: any[];
  }> {
    // Vérifier que la config existe
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration de budget tendanciel non trouvée');
    }

    // Importer le fichier
    const mapping = this.getImportMapping();
    const importResult = await ImportService.importFile(filePath, 'csv', mapping, {
      stopOnError: false,
    });

    if (!importResult.success) {
      return {
        success: false,
        imported: 0,
        errors: importResult.errors || [],
        warnings: importResult.warnings || [],
      };
    }

    // Traiter les données importées
    const result = await this.processImportBatch(
      trendConfigId,
      importResult.data || [],
      userId,
      'CSV'
    );

    return {
      success: result.imported > 0,
      imported: result.imported,
      errors: result.errors,
      warnings: importResult.warnings || [],
    };
  }

  /**
   * Traiter un lot de données importées
   */
  static async processImportBatch(
    trendConfigId: string,
    data: any[],
    userId: string,
    importSource: string
  ): Promise<{ imported: number; errors: any[] }> {
    let imported = 0;
    const errors: any[] = [];

    for (const row of data) {
      try {
        // Résoudre les IDs des entités référencées
        const ministryId = await this.resolveMinistry(row.ministryCode);
        if (!ministryId) {
          errors.push({
            row: row,
            error: `Ministère non trouvé: ${row.ministryCode}`,
          });
          continue;
        }

        const programId = row.programCode
          ? await this.resolveProgram(row.programCode)
          : null;
        if (row.programCode && !programId) {
          errors.push({
            row: row,
            error: `Programme non trouvé: ${row.programCode}`,
          });
          continue;
        }

        const economicNatureId = row.economicNatureCode
          ? await this.resolveEconomicNature(row.economicNatureCode)
          : null;

        const fundingSourceId = row.fundingSourceCode
          ? await this.resolveFundingSource(row.fundingSourceCode)
          : null;

        // Créer ou mettre à jour le budget historique
        await prisma.historicalBudget.upsert({
          where: {
            trendConfigId_ministryId_programId_actionId_activityId_economicNatureId_fundingSourceId_fiscalYear: {
              trendConfigId,
              ministryId,
              programId: programId || '',
              actionId: '',
              activityId: '',
              economicNatureId: economicNatureId || '',
              fundingSourceId: fundingSourceId || '',
              fiscalYear: row.fiscalYear,
            },
          },
          update: {
            budgetAmount: row.budgetAmount,
            executedAmount: row.executedAmount || null,
            isTemporary: row.isTemporary || false,
            notes: row.notes || null,
            importSource,
            importedAt: new Date(),
            importedBy: userId,
          },
          create: {
            trendConfigId,
            ministryId,
            programId: programId || null,
            economicNatureId: economicNatureId || null,
            fundingSourceId: fundingSourceId || null,
            fiscalYear: row.fiscalYear,
            budgetAmount: row.budgetAmount,
            executedAmount: row.executedAmount || null,
            isTemporary: row.isTemporary || false,
            notes: row.notes || null,
            importSource,
            importedAt: new Date(),
            importedBy: userId,
          },
        });

        imported++;
      } catch (error: any) {
        errors.push({
          row: row,
          error: error.message,
        });
      }
    }

    return { imported, errors };
  }

  /**
   * Résoudre l'ID d'un ministère par son code
   */
  private static async resolveMinistry(code: string): Promise<string | null> {
    const ministry = await prisma.ministry.findUnique({
      where: { code },
      select: { id: true },
    });
    return ministry?.id || null;
  }

  /**
   * Résoudre l'ID d'un programme par son code
   */
  private static async resolveProgram(code: string): Promise<string | null> {
    const program = await prisma.program.findUnique({
      where: { code },
      select: { id: true },
    });
    return program?.id || null;
  }

  /**
   * Résoudre l'ID d'une nature économique par son code
   */
  private static async resolveEconomicNature(code: string): Promise<string | null> {
    const economicNature = await prisma.economicNature.findUnique({
      where: { code },
      select: { id: true },
    });
    return economicNature?.id || null;
  }

  /**
   * Résoudre l'ID d'une source de financement par son code
   */
  private static async resolveFundingSource(code: string): Promise<string | null> {
    const fundingSource = await prisma.fundingSource.findUnique({
      where: { code },
      select: { id: true },
    });
    return fundingSource?.id || null;
  }

  /**
   * Générer un template Excel pour l'import
   */
  static generateTemplate(): Buffer {
    const mapping = this.getImportMapping();
    return ImportService.generateTemplate(mapping, 'template_budgets_historiques.xlsx');
  }

  /**
   * Valider les données d'import
   */
  static validateImportData(data: any[]): {
    valid: boolean;
    errors: any[];
    warnings: any[];
  } {
    const mapping = this.getImportMapping();
    return ImportService.validateData(data, mapping);
  }
}
