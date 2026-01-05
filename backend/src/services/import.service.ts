import * as XLSX from 'xlsx';
import * as fs from 'fs';
import csvParser from 'csv-parser';
import {
  ImportResult,
  ImportError,
  ImportWarning,
  ImportOptions,
  ImportMapping,
} from '../types/import.types';
import { BadRequestError } from '../middleware/errorHandler';

export class ImportService {
  /**
   * Lire un fichier Excel et retourner les données
   */
  static async readExcelFile(filePath: string, sheetName?: string): Promise<any[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = sheetName
        ? workbook.Sheets[sheetName]
        : workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new BadRequestError(
          `Feuille ${sheetName || 'par défaut'} non trouvée dans le fichier Excel`
        );
      }

      const data = XLSX.utils.sheet_to_json(sheet);
      return data;
    } catch (error: any) {
      throw new BadRequestError(`Erreur lors de la lecture du fichier Excel: ${error.message}`);
    }
  }

  /**
   * Lire un fichier CSV et retourner les données
   */
  static async readCSVFile(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data: any) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error: any) =>
          reject(new BadRequestError(`Erreur lors de la lecture du fichier CSV: ${error.message}`))
        );
    });
  }

  /**
   * Valider les données selon un mapping
   */
  static validateData(
    data: any[],
    mapping: ImportMapping[]
  ): { valid: boolean; errors: ImportError[]; warnings: ImportWarning[] } {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 car ligne 1 = header, et index commence à 0

      mapping.forEach((map) => {
        const value = row[map.excelColumn];

        // Vérifier les champs requis
        if (map.required && (value === undefined || value === null || value === '')) {
          errors.push({
            row: rowNumber,
            field: map.dbField,
            message: `Champ requis manquant: ${map.excelColumn}`,
            value,
          });
          return;
        }

        // Vérifier le type
        if (value !== undefined && value !== null && value !== '') {
          const actualType = typeof value;
          let isValidType = true;

          switch (map.type) {
            case 'number':
              isValidType = !isNaN(Number(value));
              break;
            case 'string':
              isValidType = true; // Tout peut être converti en string
              break;
            case 'date':
              isValidType = !isNaN(Date.parse(value));
              break;
            case 'boolean':
              isValidType =
                value === true ||
                value === false ||
                value === 'true' ||
                value === 'false' ||
                value === 1 ||
                value === 0;
              break;
          }

          if (!isValidType) {
            errors.push({
              row: rowNumber,
              field: map.dbField,
              message: `Type invalide pour ${map.excelColumn}. Attendu: ${map.type}, Reçu: ${actualType}`,
              value,
            });
          }

          // Validation personnalisée
          if (map.validator && !map.validator(value)) {
            errors.push({
              row: rowNumber,
              field: map.dbField,
              message: `Validation échouée pour ${map.excelColumn}`,
              value,
            });
          }
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Transformer les données selon un mapping
   */
  static transformData(data: any[], mapping: ImportMapping[]): any[] {
    return data.map((row) => {
      const transformedRow: any = {};

      mapping.forEach((map) => {
        let value = row[map.excelColumn];

        // Appliquer la transformation si définie
        if (map.transformer && value !== undefined && value !== null) {
          value = map.transformer(value);
        } else {
          // Transformation par défaut selon le type
          if (value !== undefined && value !== null && value !== '') {
            switch (map.type) {
              case 'number':
                value = Number(value);
                break;
              case 'string':
                value = String(value).trim();
                break;
              case 'date':
                value = new Date(value);
                break;
              case 'boolean':
                value =
                  value === true ||
                  value === 'true' ||
                  value === 1 ||
                  value === '1' ||
                  value === 'oui' ||
                  value === 'yes';
                break;
            }
          }
        }

        transformedRow[map.dbField] = value;
      });

      return transformedRow;
    });
  }

  /**
   * Importer des données depuis un fichier
   */
  static async importFile(
    filePath: string,
    fileType: 'excel' | 'csv',
    mapping: ImportMapping[],
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      // Lire le fichier
      let rawData: any[];
      if (fileType === 'excel') {
        rawData = await this.readExcelFile(filePath);
      } else {
        rawData = await this.readCSVFile(filePath);
      }

      if (rawData.length === 0) {
        throw new BadRequestError('Le fichier est vide');
      }

      // Valider les données
      const validation = this.validateData(rawData, mapping);

      if (!validation.valid && !options.skipValidation) {
        if (options.stopOnError) {
          return {
            success: false,
            totalRows: rawData.length,
            successCount: 0,
            errorCount: validation.errors.length,
            errors: validation.errors,
            warnings: validation.warnings,
          };
        }
      }

      // Transformer les données
      const transformedData = this.transformData(rawData, mapping);

      // Retourner le résultat
      return {
        success: validation.valid,
        totalRows: rawData.length,
        successCount: rawData.length - validation.errors.length,
        errorCount: validation.errors.length,
        errors: validation.errors,
        warnings: validation.warnings,
        data: transformedData,
      };
    } catch (error: any) {
      throw new BadRequestError(`Erreur lors de l'importation: ${error.message}`);
    } finally {
      // Nettoyer le fichier temporaire
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  /**
   * Générer un template Excel pour l'importation
   */
  static generateTemplate(mapping: ImportMapping[], fileName: string): Buffer {
    const headers = mapping.map((m) => m.excelColumn);
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
