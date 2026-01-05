import { ImportService } from './import.service';
import {
  ImportResult,
  ImportMapping,
  ImportOptions,
  PIPImportRow,
} from '../types/import.types';
import prisma from '../config/database';
import { BadRequestError } from '../middleware/errorHandler';

export class PIPImportService {
  /**
   * Mapping pour l'importation de PIP (Programme d'Investissement Public)
   */
  static getPIPMapping(): ImportMapping[] {
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
        excelColumn: 'Code Programme',
        dbField: 'programmeCode',
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
        excelColumn: 'Montant Année N',
        dbField: 'montantAnneeN',
        required: true,
        type: 'number',
        validator: (value) => value >= 0,
      },
      {
        excelColumn: 'Montant Année N+1',
        dbField: 'montantAnneeN1',
        required: false,
        type: 'number',
        validator: (value) => !value || value >= 0,
      },
      {
        excelColumn: 'Montant Année N+2',
        dbField: 'montantAnneeN2',
        required: false,
        type: 'number',
        validator: (value) => !value || value >= 0,
      },
      {
        excelColumn: 'Code Source Financement',
        dbField: 'sourceFinancementCode',
        required: true,
        type: 'string',
        transformer: (value) => String(value).toUpperCase().trim(),
      },
      {
        excelColumn: 'Type Projet',
        dbField: 'typeProjet',
        required: false,
        type: 'string',
        transformer: (value) => (value ? String(value).toUpperCase().trim() : 'NOUVEAU'),
        validator: (value) =>
          !value || ['NOUVEAU', 'EN_COURS', 'EXTENSION', 'REHABILITATION'].includes(value.toUpperCase()),
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
        excelColumn: 'Priorité',
        dbField: 'priorite',
        required: false,
        type: 'number',
        validator: (value) => !value || (value >= 1 && value <= 5),
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
   * Valider les références (ministères, programmes, sources de financement)
   */
  static async validateReferences(data: PIPImportRow[]): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Récupérer tous les codes uniques
    const ministryCodesSet = new Set(data.map((row) => row.ministereCode));
    const programCodesSet = new Set(data.map((row) => row.programmeCode));
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
   * Importer des PIP depuis un fichier
   */
  static async importPIP(
    filePath: string,
    fileType: 'excel' | 'csv',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const mapping = this.getPIPMapping();

    // Importer et valider le fichier
    const result = await ImportService.importFile(filePath, fileType, mapping, options);

    if (!result.success || !result.data) {
      return result;
    }

    // Valider les références
    const referenceValidation = await this.validateReferences(result.data as PIPImportRow[]);

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
    const insertedCount = await this.insertPIP(
      result.data as PIPImportRow[],
      options.updateExisting || false
    );

    result.successCount = insertedCount;
    result.success = insertedCount > 0;

    return result;
  }

  /**
   * Insérer les PIP dans la base de données
   */
  static async insertPIP(
    data: PIPImportRow[],
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

        const fundingSource = await prisma.fundingSource.findUnique({
          where: { code: row.sourceFinancementCode },
          select: { id: true },
        });

        if (!ministry || !program || !fundingSource) {
          continue;
        }

        // Vérifier si le projet existe déjà
        const existingProject = await prisma.$queryRaw<any[]>`
          SELECT id FROM pip_projects
          WHERE project_code = ${row.projetCode}
          AND fiscal_year = ${row.annee}
          LIMIT 1
        `;

        if (existingProject.length > 0 && updateExisting) {
          await prisma.$queryRaw`
            UPDATE pip_projects
            SET
              project_name = ${row.projetNom},
              ministry_id = ${ministry.id}::uuid,
              program_id = ${program.id}::uuid,
              total_amount = ${row.montantTotal},
              amount_year_n = ${row.montantAnneeN},
              amount_year_n1 = ${row.montantAnneeN1 || 0},
              amount_year_n2 = ${row.montantAnneeN2 || 0},
              funding_source_id = ${fundingSource.id}::uuid,
              project_type = ${row.typeProjet || 'NOUVEAU'},
              updated_at = NOW()
            WHERE id::text = ${existingProject[0].id}
          `;
          insertedCount++;
        } else if (existingProject.length === 0) {
          await prisma.$queryRaw`
            INSERT INTO pip_projects (
              id, project_code, project_name, fiscal_year, ministry_id, program_id,
              total_amount, amount_year_n, amount_year_n1, amount_year_n2,
              funding_source_id, project_type, created_at, updated_at
            ) VALUES (
              gen_random_uuid(),
              ${row.projetCode},
              ${row.projetNom},
              ${row.annee},
              ${ministry.id}::uuid,
              ${program.id}::uuid,
              ${row.montantTotal},
              ${row.montantAnneeN},
              ${row.montantAnneeN1 || 0},
              ${row.montantAnneeN2 || 0},
              ${fundingSource.id}::uuid,
              ${row.typeProjet || 'NOUVEAU'},
              NOW(),
              NOW()
            )
          `;
          insertedCount++;
        }
      } catch (error) {
        console.error('Erreur insertion PIP:', error);
      }
    }

    return insertedCount;
  }

  /**
   * Générer un template Excel pour l'importation de PIP
   */
  static generatePIPTemplate(): Buffer {
    const mapping = this.getPIPMapping();
    return ImportService.generateTemplate(mapping, 'Template_Import_PIP.xlsx');
  }
}
