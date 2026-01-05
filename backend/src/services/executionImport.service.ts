import { ImportService } from './import.service';
import {
  ImportResult,
  ImportMapping,
  ImportOptions,
  ExecutionImportRow,
} from '../types/import.types';
import prisma from '../config/database';
import { BadRequestError } from '../middleware/errorHandler';

export class ExecutionImportService {
  /**
   * Mapping pour l'importation d'exécutions budgétaires
   */
  static getExecutionMapping(): ImportMapping[] {
    return [
      {
        excelColumn: 'Année',
        dbField: 'annee',
        required: true,
        type: 'number',
        validator: (value) => value >= 2020 && value <= 2050,
      },
      {
        excelColumn: 'Mois',
        dbField: 'mois',
        required: false,
        type: 'number',
        validator: (value) => !value || (value >= 1 && value <= 12),
      },
      {
        excelColumn: 'Trimestre',
        dbField: 'trimestre',
        required: false,
        type: 'number',
        validator: (value) => !value || (value >= 1 && value <= 4),
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
        excelColumn: 'Montant Prévu',
        dbField: 'montantPrevu',
        required: true,
        type: 'number',
        validator: (value) => value >= 0,
      },
      {
        excelColumn: 'Montant Engagé',
        dbField: 'montantEngage',
        required: false,
        type: 'number',
        validator: (value) => !value || value >= 0,
      },
      {
        excelColumn: 'Montant Ordonnancé',
        dbField: 'montantOrdonnance',
        required: false,
        type: 'number',
        validator: (value) => !value || value >= 0,
      },
      {
        excelColumn: 'Montant Payé',
        dbField: 'montantPaye',
        required: false,
        type: 'number',
        validator: (value) => !value || value >= 0,
      },
    ];
  }

  /**
   * Valider les références (ministères, programmes, etc.)
   */
  static async validateReferences(data: ExecutionImportRow[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Récupérer tous les codes uniques
    const ministryCodesSet = new Set(data.map((row) => row.ministereCode));
    const programCodesSet = new Set(data.map((row) => row.programmeCode));
    const economicCategoryCodesSet = new Set(data.map((row) => row.categorieEconomiqueCode));

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

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Importer des exécutions depuis un fichier
   */
  static async importExecutions(
    filePath: string,
    fileType: 'excel' | 'csv',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const mapping = this.getExecutionMapping();

    // Importer et valider le fichier
    const result = await ImportService.importFile(filePath, fileType, mapping, options);

    if (!result.success || !result.data) {
      return result;
    }

    // Valider les références
    const referenceValidation = await this.validateReferences(result.data as ExecutionImportRow[]);

    if (!referenceValidation.valid) {
      result.success = false;
      result.errors.push(
        ...referenceValidation.errors.map((error) => ({
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

    // Insérer les données dans la base
    const insertedCount = await this.insertExecutions(
      result.data as ExecutionImportRow[],
      options.updateExisting || false
    );

    result.successCount = insertedCount;
    result.success = insertedCount > 0;

    return result;
  }

  /**
   * Insérer les exécutions dans la base de données
   */
  static async insertExecutions(
    data: ExecutionImportRow[],
    updateExisting: boolean
  ): Promise<number> {
    let insertedCount = 0;

    for (const row of data) {
      try {
        // Récupérer les IDs des références
        const ministry = await prisma.ministry.findUnique({
          where: { code: row.ministereCode },
          select: { id: true },
        });

        const program = await prisma.program.findUnique({
          where: { code: row.programmeCode },
          select: { id: true },
        });

        const economicCategory = await prisma.economicCategory.findUnique({
          where: { code: row.categorieEconomiqueCode },
          select: { id: true },
        });

        if (!ministry || !program || !economicCategory) {
          continue;
        }

        // Créer ou mettre à jour l'exécution via raw query (table budget_executions)
        const existingExecution = await prisma.$queryRaw<any[]>`
          SELECT id FROM budget_executions
          WHERE fiscal_year = ${row.annee}
          AND ministry_id::text = ${ministry.id}
          AND program_id::text = ${program.id}
          AND economic_category_id::text = ${economicCategory.id}
          ${row.mois ? prisma.$queryRaw`AND month = ${row.mois}` : prisma.$queryRaw`AND month IS NULL`}
          ${row.trimestre ? prisma.$queryRaw`AND quarter = ${row.trimestre}` : prisma.$queryRaw`AND quarter IS NULL`}
          LIMIT 1
        `;

        if (existingExecution.length > 0 && updateExisting) {
          await prisma.$queryRaw`
            UPDATE budget_executions
            SET
              planned_amount = ${row.montantPrevu},
              committed_amount = ${row.montantEngage || 0},
              ordered_amount = ${row.montantOrdonnance || 0},
              paid_amount = ${row.montantPaye || 0},
              updated_at = NOW()
            WHERE id::text = ${existingExecution[0].id}
          `;
          insertedCount++;
        } else if (existingExecution.length === 0) {
          await prisma.$queryRaw`
            INSERT INTO budget_executions (
              id, fiscal_year, ministry_id, program_id, economic_category_id,
              month, quarter, planned_amount, committed_amount, ordered_amount, paid_amount,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${row.annee},
              ${ministry.id}::uuid,
              ${program.id}::uuid,
              ${economicCategory.id}::uuid,
              ${row.mois || null},
              ${row.trimestre || null},
              ${row.montantPrevu},
              ${row.montantEngage || 0},
              ${row.montantOrdonnance || 0},
              ${row.montantPaye || 0},
              NOW(),
              NOW()
            )
          `;
          insertedCount++;
        }
      } catch (error) {
        console.error('Erreur insertion exécution:', error);
      }
    }

    return insertedCount;
  }

  /**
   * Générer un template Excel pour l'importation d'exécutions
   */
  static generateExecutionTemplate(): Buffer {
    const mapping = this.getExecutionMapping();
    return ImportService.generateTemplate(mapping, 'Template_Import_Executions.xlsx');
  }
}
