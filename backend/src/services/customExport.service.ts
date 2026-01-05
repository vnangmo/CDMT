import prisma from '../config/database';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

export type ExportFormat = 'excel' | 'csv' | 'pdf';

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'percentage' | 'date';
}

export interface ExportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith';
  value: any;
}

export interface ExportSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CustomExportOptions {
  entityType: string;
  columns: string[];
  filters?: ExportFilter[];
  sort?: ExportSort[];
  format: ExportFormat;
  title?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  numberFormat?: string;
  fiscalYear?: number;
  ministryId?: string;
}

// Column definitions for each entity type
const ENTITY_COLUMNS: Record<string, ExportColumn[]> = {
  SectoralMeasure: [
    { key: 'measureCode', label: 'Code Mesure', width: 15, format: 'text' },
    { key: 'name', label: 'Nom', width: 40, format: 'text' },
    { key: 'description', label: 'Description', width: 50, format: 'text' },
    { key: 'ministry.name', label: 'Ministère', width: 30, format: 'text' },
    { key: 'ministry.code', label: 'Code Ministère', width: 10, format: 'text' },
    { key: 'program.name', label: 'Programme', width: 30, format: 'text' },
    { key: 'entityType', label: 'Type Entité', width: 15, format: 'text' },
    { key: 'category', label: 'Catégorie', width: 15, format: 'text' },
    { key: 'priority', label: 'Priorité', width: 10, format: 'number' },
    { key: 'status', label: 'Statut', width: 12, format: 'text' },
    { key: 'totalCost', label: 'Coût Total', width: 18, format: 'currency' },
    { key: 'totalCostY1', label: 'Coût Année 1', width: 18, format: 'currency' },
    { key: 'totalCostY2', label: 'Coût Année 2', width: 18, format: 'currency' },
    { key: 'totalCostY3', label: 'Coût Année 3', width: 18, format: 'currency' },
    { key: 'quantityY1', label: 'Quantité Y1', width: 12, format: 'number' },
    { key: 'quantityY2', label: 'Quantité Y2', width: 12, format: 'number' },
    { key: 'quantityY3', label: 'Quantité Y3', width: 12, format: 'number' },
    { key: 'unitCostY1', label: 'Coût Unit. Y1', width: 15, format: 'currency' },
    { key: 'unitCostY2', label: 'Coût Unit. Y2', width: 15, format: 'currency' },
    { key: 'unitCostY3', label: 'Coût Unit. Y3', width: 15, format: 'currency' },
    { key: 'economicNature.name', label: 'Nature Économique', width: 25, format: 'text' },
    { key: 'fundingSource.name', label: 'Source Financement', width: 25, format: 'text' },
    { key: 'justification', label: 'Justification', width: 50, format: 'text' },
    { key: 'expectedImpact', label: 'Impact Attendu', width: 50, format: 'text' },
    { key: 'createdAt', label: 'Date Création', width: 15, format: 'date' },
    { key: 'submittedAt', label: 'Date Soumission', width: 15, format: 'date' },
    { key: 'validatedAt', label: 'Date Validation', width: 15, format: 'date' },
  ],
  ActionPlan: [
    { key: 'planCode', label: 'Code Plan', width: 15, format: 'text' },
    { key: 'planName', label: 'Nom', width: 40, format: 'text' },
    { key: 'description', label: 'Description', width: 50, format: 'text' },
    { key: 'ministry.name', label: 'Ministère', width: 30, format: 'text' },
    { key: 'program.name', label: 'Programme', width: 30, format: 'text' },
    { key: 'action.name', label: 'Action', width: 30, format: 'text' },
    { key: 'status', label: 'Statut', width: 12, format: 'text' },
    { key: 'totalBudget', label: 'Budget Total', width: 18, format: 'currency' },
    { key: 'totalBudgetY1', label: 'Budget Année 1', width: 18, format: 'currency' },
    { key: 'totalBudgetY2', label: 'Budget Année 2', width: 18, format: 'currency' },
    { key: 'totalBudgetY3', label: 'Budget Année 3', width: 18, format: 'currency' },
    { key: 'startDate', label: 'Date Début', width: 15, format: 'date' },
    { key: 'endDate', label: 'Date Fin', width: 15, format: 'date' },
    { key: 'createdAt', label: 'Date Création', width: 15, format: 'date' },
  ],
  MinisterialCeiling: [
    { key: 'ministry.code', label: 'Code Ministère', width: 10, format: 'text' },
    { key: 'ministry.name', label: 'Ministère', width: 40, format: 'text' },
    { key: 'year', label: 'Année', width: 8, format: 'number' },
    { key: 'baseline', label: 'Baseline', width: 18, format: 'currency' },
    { key: 'newMeasures', label: 'Mesures Nouvelles', width: 18, format: 'currency' },
    { key: 'allocatedSpace', label: 'Marge Allouée', width: 18, format: 'currency' },
    { key: 'ceiling', label: 'Plafond Total', width: 18, format: 'currency' },
    { key: 'calculatedAt', label: 'Date Calcul', width: 15, format: 'date' },
    { key: 'notes', label: 'Notes', width: 40, format: 'text' },
  ],
  CBMTDocument: [
    { key: 'documentCode', label: 'Code Document', width: 15, format: 'text' },
    { key: 'title', label: 'Titre', width: 40, format: 'text' },
    { key: 'fiscalYear', label: 'Année Fiscale', width: 12, format: 'number' },
    { key: 'scenarioType', label: 'Type Scénario', width: 15, format: 'text' },
    { key: 'scenarioName', label: 'Nom Scénario', width: 25, format: 'text' },
    { key: 'status', label: 'Statut', width: 12, format: 'text' },
    { key: 'totalRevenueCeiling', label: 'Plafond Recettes', width: 18, format: 'currency' },
    { key: 'totalExpenseCeiling', label: 'Plafond Dépenses', width: 18, format: 'currency' },
    { key: 'fiscalDeficitCeiling', label: 'Plafond Déficit', width: 18, format: 'currency' },
    { key: 'debtCeiling', label: 'Plafond Dette', width: 18, format: 'currency' },
    { key: 'currency', label: 'Devise', width: 8, format: 'text' },
    { key: 'unit', label: 'Unité', width: 8, format: 'text' },
    { key: 'createdAt', label: 'Date Création', width: 15, format: 'date' },
  ],
  CDMTGlobalScenario: [
    { key: 'scenarioCode', label: 'Code Scénario', width: 15, format: 'text' },
    { key: 'name', label: 'Nom', width: 40, format: 'text' },
    { key: 'description', label: 'Description', width: 50, format: 'text' },
    { key: 'fiscalYear', label: 'Année Fiscale', width: 12, format: 'number' },
    { key: 'status', label: 'Statut', width: 12, format: 'text' },
    { key: 'isActive', label: 'Actif', width: 8, format: 'text' },
    { key: 'fiscalMarginY1', label: 'Marge Fiscale Y1', width: 18, format: 'currency' },
    { key: 'fiscalMarginY2', label: 'Marge Fiscale Y2', width: 18, format: 'currency' },
    { key: 'fiscalMarginY3', label: 'Marge Fiscale Y3', width: 18, format: 'currency' },
    { key: 'totalBaselineY1', label: 'Total Baseline Y1', width: 18, format: 'currency' },
    { key: 'totalMeasuresY1', label: 'Total Mesures Y1', width: 18, format: 'currency' },
    { key: 'totalCeilingY1', label: 'Total Plafonds Y1', width: 18, format: 'currency' },
    { key: 'createdAt', label: 'Date Création', width: 15, format: 'date' },
  ],
};

export class CustomExportService {
  /**
   * Get available columns for an entity type
   */
  static getAvailableColumns(entityType: string): ExportColumn[] {
    const columns = ENTITY_COLUMNS[entityType];
    if (!columns) {
      throw new BadRequestError(`Type d'entité non supporté: ${entityType}`);
    }
    return columns;
  }

  /**
   * Get all supported entity types
   */
  static getSupportedEntityTypes(): string[] {
    return Object.keys(ENTITY_COLUMNS);
  }

  /**
   * Export data with custom options
   */
  static async export(options: CustomExportOptions): Promise<{
    buffer: Buffer;
    filename: string;
    mimeType: string;
  }> {
    // Validate entity type
    const availableColumns = ENTITY_COLUMNS[options.entityType];
    if (!availableColumns) {
      throw new BadRequestError(`Type d'entité non supporté: ${options.entityType}`);
    }

    // Validate selected columns
    const selectedColumns = options.columns.length > 0
      ? availableColumns.filter((c) => options.columns.includes(c.key))
      : availableColumns;

    if (selectedColumns.length === 0) {
      throw new BadRequestError('Aucune colonne valide sélectionnée');
    }

    // Fetch data
    const data = await this.fetchData(options);

    // Generate export based on format
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `${options.entityType}_export_${timestamp}`;

    switch (options.format) {
      case 'excel':
        buffer = this.generateExcel(data, selectedColumns, options);
        filename = `${baseFilename}.xlsx`;
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'csv':
        buffer = this.generateCSV(data, selectedColumns, options);
        filename = `${baseFilename}.csv`;
        mimeType = 'text/csv';
        break;
      case 'pdf':
        buffer = await this.generatePDF(data, selectedColumns, options);
        filename = `${baseFilename}.pdf`;
        mimeType = 'application/pdf';
        break;
      default:
        throw new BadRequestError(`Format non supporté: ${options.format}`);
    }

    return { buffer, filename, mimeType };
  }

  /**
   * Fetch data based on entity type and filters
   */
  private static async fetchData(options: CustomExportOptions): Promise<any[]> {
    const where: any = {};
    const orderBy: any[] = [];

    // Apply filters
    if (options.filters) {
      for (const filter of options.filters) {
        where[filter.field] = this.buildFilterCondition(filter);
      }
    }

    // Apply fiscal year filter if provided
    if (options.fiscalYear) {
      if (options.entityType === 'MinisterialCeiling') {
        where.year = options.fiscalYear;
      } else if (['CBMTDocument', 'CDMTGlobalScenario'].includes(options.entityType)) {
        where.fiscalYear = options.fiscalYear;
      }
    }

    // Apply ministry filter if provided
    if (options.ministryId) {
      where.ministryId = options.ministryId;
    }

    // Apply sorting
    if (options.sort) {
      for (const sort of options.sort) {
        orderBy.push({ [sort.field]: sort.direction });
      }
    }

    // Fetch data based on entity type
    switch (options.entityType) {
      case 'SectoralMeasure':
        return prisma.sectoralMeasure.findMany({
          where,
          orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }],
          include: {
            ministry: { select: { id: true, code: true, name: true } },
            program: { select: { id: true, code: true, name: true } },
            economicNature: { select: { id: true, code: true, name: true } },
            fundingSource: { select: { id: true, code: true, name: true } },
          },
        });

      case 'ActionPlan':
        return prisma.actionPlan.findMany({
          where,
          orderBy: orderBy.length > 0 ? orderBy : [{ createdAt: 'desc' }],
          include: {
            ministry: { select: { id: true, code: true, name: true } },
            sectoralMeasure: {
              select: {
                id: true,
                measureCode: true,
                name: true,
                program: { select: { id: true, code: true, name: true } },
              }
            },
          },
        });

      case 'MinisterialCeiling':
        return prisma.ministerialCeiling.findMany({
          where,
          orderBy: orderBy.length > 0 ? orderBy : [{ year: 'asc' }, { ministry: { name: 'asc' } }],
          include: {
            ministry: { select: { id: true, code: true, name: true } },
          },
        });

      case 'CBMTDocument':
        return prisma.cBMTDocument.findMany({
          where,
          orderBy: orderBy.length > 0 ? orderBy : [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
        });

      case 'CDMTGlobalScenario':
        return prisma.cDMTGlobalScenario.findMany({
          where,
          orderBy: orderBy.length > 0 ? orderBy : [{ fiscalYear: 'desc' }, { createdAt: 'desc' }],
        });

      default:
        throw new BadRequestError(`Type d'entité non supporté: ${options.entityType}`);
    }
  }

  /**
   * Build filter condition for Prisma
   */
  private static buildFilterCondition(filter: ExportFilter): any {
    switch (filter.operator) {
      case 'eq':
        return filter.value;
      case 'neq':
        return { not: filter.value };
      case 'gt':
        return { gt: filter.value };
      case 'gte':
        return { gte: filter.value };
      case 'lt':
        return { lt: filter.value };
      case 'lte':
        return { lte: filter.value };
      case 'in':
        return { in: Array.isArray(filter.value) ? filter.value : [filter.value] };
      case 'contains':
        return { contains: filter.value, mode: 'insensitive' };
      case 'startsWith':
        return { startsWith: filter.value, mode: 'insensitive' };
      default:
        return filter.value;
    }
  }

  /**
   * Get nested value from object
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Format value based on column format
   */
  private static formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) return '';

    switch (format) {
      case 'currency':
        const num = typeof value === 'object' ? Number(value) : value;
        return new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(num);
      case 'number':
        return typeof value === 'object' ? Number(value).toString() : value.toString();
      case 'percentage':
        return `${Number(value).toFixed(2)}%`;
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString('fr-FR');
        }
        return new Date(value).toLocaleDateString('fr-FR');
      default:
        return String(value);
    }
  }

  /**
   * Generate Excel export
   */
  private static generateExcel(
    data: any[],
    columns: ExportColumn[],
    options: CustomExportOptions
  ): Buffer {
    const workbook = XLSX.utils.book_new();

    // Create header row
    const headers = columns.map((c) => c.label);

    // Create data rows
    const rows = data.map((item) =>
      columns.map((col) => {
        const value = this.getNestedValue(item, col.key);
        return this.formatValue(value, col.format);
      })
    );

    // Add title row if specified
    const sheetData: any[][] = [];
    if (options.title) {
      sheetData.push([options.title]);
      sheetData.push([]);
    }

    if (options.includeHeaders !== false) {
      sheetData.push(headers);
    }

    sheetData.push(...rows);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Set column widths
    worksheet['!cols'] = columns.map((col) => ({ wch: col.width || 15 }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Generate CSV export
   */
  private static generateCSV(
    data: any[],
    columns: ExportColumn[],
    options: CustomExportOptions
  ): Buffer {
    const lines: string[] = [];

    // Add headers
    if (options.includeHeaders !== false) {
      lines.push(columns.map((c) => this.escapeCSV(c.label)).join(','));
    }

    // Add data rows
    for (const item of data) {
      const row = columns.map((col) => {
        const value = this.getNestedValue(item, col.key);
        return this.escapeCSV(this.formatValue(value, col.format));
      });
      lines.push(row.join(','));
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  /**
   * Escape CSV value
   */
  private static escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Generate PDF export
   */
  private static async generatePDF(
    data: any[],
    columns: ExportColumn[],
    options: CustomExportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: columns.length > 6 ? 'landscape' : 'portrait',
        margins: { top: 50, bottom: 50, left: 40, right: 40 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      if (options.title) {
        doc.fontSize(16).font('Helvetica-Bold').text(options.title, { align: 'center' });
        doc.moveDown();
      }

      doc.fontSize(10).font('Helvetica');
      doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
      doc.text(`Total: ${data.length} enregistrements`, { align: 'right' });
      doc.moveDown(2);

      // Calculate column widths
      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const colWidth = pageWidth / Math.min(columns.length, 8);

      // Table header
      let y = doc.y;
      doc.font('Helvetica-Bold').fontSize(8);

      columns.slice(0, 8).forEach((col, i) => {
        doc.text(col.label, doc.page.margins.left + i * colWidth, y, {
          width: colWidth - 5,
          align: 'left',
        });
      });

      y += 20;
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).stroke();
      y += 5;

      // Table rows
      doc.font('Helvetica').fontSize(7);

      for (const item of data) {
        // Check for page break
        if (y > doc.page.height - 60) {
          doc.addPage();
          y = doc.page.margins.top;
        }

        columns.slice(0, 8).forEach((col, i) => {
          const value = this.getNestedValue(item, col.key);
          const formatted = this.formatValue(value, col.format);
          doc.text(formatted.substring(0, 30), doc.page.margins.left + i * colWidth, y, {
            width: colWidth - 5,
            align: 'left',
          });
        });

        y += 15;
      }

      // Footer
      doc.fontSize(8).text(
        `Document généré automatiquement - CDMT Djibouti`,
        doc.page.margins.left,
        doc.page.height - 30,
        { align: 'center', width: pageWidth }
      );

      doc.end();
    });
  }
}

export default CustomExportService;
