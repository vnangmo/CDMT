import { ImportService } from './import.service';
import {
  ImportResult,
  ImportMapping,
  ImportOptions,
  PIEImportRow,
} from '../types/import.types';
import prisma from '../config/database';
import { BadRequestError } from '../middleware/errorHandler';

export class PIEImportService {
  /**
   * Mapping pour l'importation de PIE (Programme d'Investissement de l'État)
   */
  static getPIEMapping(): ImportMapping[] {
    return [
      {
        excelColumn: 'Année',
        dbField: 'annee',
        required: true,
        type: 'number',
        validator: (value) => value >= 2020 && value <= 2050,
      },
      {
        excelColumn: 'Code Projet',
        dbField: 'projetCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Nom Projet',
        dbField: 'projetNom',
        required: true,
        type: 'string',
        transformer: (value) => String(value).trim(),
      },
      {
        excelColumn: 'Code Ministère',
        dbField: 'ministereCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Code Secteur',
        dbField: 'secteurCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Montant Total',
        dbField: 'montantTotal',
        required: true,
        type: 'number',
        validator: (value) => value >= 0,
      },
      {
        excelColumn: 'Montant Année',
        dbField: 'montantAnnee',
        required: true,
        type: 'number',
        validator: (value) => value >= 0,
      },
      {
        excelColumn: 'Code Source Financement',
        dbField: 'sourceFinancementCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Statut',
        dbField: 'statut',
        required: false,
        type: 'string',
        transformer: (value) => (value ? String(value).toUpperCase().trim() : 'EN_COURS'),
        validator: (value) =>
          !value || ['PLANIFIE', 'EN_COURS', 'TERMINE', 'SUSPENDU', 'ANNULE'].includes(value.toUpperCase()),
      },
      {
        excelColumn: 'Description',
        dbField: 'description',
        required: false,
        type: 'string',
      },
      {
        excelColumn: 'Localisation',
        dbField: 'localisation',
        required: false,
        type: 'string',
      },
      {
        excelColumn: 'Date Début',
        dbField: 'dateDebut',
        required: false,
        type: 'date',
      },
      {
        excelColumn: 'Date Fin Prévue',
        dbField: 'dateFinPrevue',
        required: false,
        type: 'date',
      },
    ];
  }

  /**
   * Valider les références (ministères, sources de financement, etc.)
   */
  static async validateReferences(data: PIEImportRow[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Récupérer tous les codes uniques
    const ministryCodesSet = new Set(data.map((row) => row.ministereCode));
    const fundingSourceCodesSet = new Set(data.map((row) => row.sourceFinancementCode));

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

    // Vérifier les sources de financement
    const fundingSourceCodes = Array.from(fundingSourceCodesSet);
    const fundingSources = await prisma.fundingSource.findMany({
      where: { code: { in: fundingSourceCodes } },
      select: { code: true },
    });
    const foundFundingSourceCodes = fundingSources.map((f) => f.code);
    const missingFundingSourceCodes = fundingSourceCodes.filter(
      (code) => !foundFundingSourceCodes.includes(code)
    );
    if (missingFundingSourceCodes.length > 0) {
      errors.push(`Sources de financement introuvables: ${missingFundingSourceCodes.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Importer des PIE depuis un fichier
   */
  static async importPIE(
    filePath: string,
    fileType: 'excel' | 'csv',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const mapping = this.getPIEMapping();

    // Importer et valider le fichier
    const result = await ImportService.importFile(filePath, fileType, mapping, options);

    if (!result.success || !result.data) {
      return result;
    }

    // Valider les références
    const referenceValidation = await this.validateReferences(result.data as PIEImportRow[]);

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
    const insertedCount = await this.insertPIE(
      result.data as PIEImportRow[],
      options.updateExisting || false
    );

    result.successCount = insertedCount;
    result.success = insertedCount > 0;

    return result;
  }

  /**
   * Insérer les PIE dans la base de données
   */
  static async insertPIE(
    data: PIEImportRow[],
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

        const fundingSource = await prisma.fundingSource.findUnique({
          where: { code: row.sourceFinancementCode },
          select: { id: true },
        });

        if (!ministry || !fundingSource) {
          continue;
        }

        // Vérifier si le projet existe déjà
        const existingProject = await prisma.$queryRaw<any[]>`
          SELECT id FROM pie_projects
          WHERE project_code = ${row.projetCode}
          AND fiscal_year = ${row.annee}
          LIMIT 1
        `;

        if (existingProject.length > 0 && updateExisting) {
          await prisma.$queryRaw`
            UPDATE pie_projects
            SET
              project_name = ${row.projetNom},
              ministry_id = ${ministry.id}::uuid,
              sector_code = ${row.secteurCode},
              total_amount = ${row.montantTotal},
              annual_amount = ${row.montantAnnee},
              funding_source_id = ${fundingSource.id}::uuid,
              status = ${row.statut || 'EN_COURS'},
              updated_at = NOW()
            WHERE id::text = ${existingProject[0].id}
          `;
          insertedCount++;
        } else if (existingProject.length === 0) {
          await prisma.$queryRaw`
            INSERT INTO pie_projects (
              id, project_code, project_name, fiscal_year, ministry_id,
              sector_code, total_amount, annual_amount, funding_source_id, status,
              created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${row.projetCode},
              ${row.projetNom},
              ${row.annee},
              ${ministry.id}::uuid,
              ${row.secteurCode},
              ${row.montantTotal},
              ${row.montantAnnee},
              ${fundingSource.id}::uuid,
              ${row.statut || 'EN_COURS'},
              NOW(),
              NOW()
            )
          `;
          insertedCount++;
        }
      } catch (error) {
        console.error('Erreur insertion PIE:', error);
      }
    }

    return insertedCount;
  }

  /**
   * Générer un template Excel pour l'importation de PIE
   */
  static generatePIETemplate(): Buffer {
    const mapping = this.getPIEMapping();
    return ImportService.generateTemplate(mapping, 'Template_Import_PIE.xlsx');
  }
}
