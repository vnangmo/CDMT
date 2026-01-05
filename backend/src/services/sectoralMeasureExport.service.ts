import prisma from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';
import { PDFUtils } from '../utils/pdf.utils';
import { ExcelUtils } from '../utils/excel.utils';

export class SectoralMeasureExportService {
  /**
   * Generate PDF export for a Sectoral Measure
   */
  static async generatePDF(id: string): Promise<Buffer> {
    const measure = await this.fetchMeasureData(id);

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      PDFUtils.addHeader(
        doc,
        'Mesure Sectorielle',
        measure.measureCode,
        measure.name
      );

      let currentY = doc.y + 20;

      // Section 1: General Information
      currentY = PDFUtils.addSectionHeader(doc, '1. Informations Générales', currentY);

      currentY = PDFUtils.addKeyValue(doc, 'Code', measure.measureCode, currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Nom', measure.name, currentY);

      if (measure.description) {
        currentY = PDFUtils.addKeyValue(doc, 'Description', measure.description, currentY);
      }

      currentY = PDFUtils.addKeyValue(doc, 'Type d\'entité', measure.entityType, currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Ministère', measure.ministry?.name || 'N/A', currentY);

      if (measure.program) {
        currentY = PDFUtils.addKeyValue(doc, 'Programme', measure.program.name, currentY);
      }

      if (measure.category) {
        currentY = PDFUtils.addKeyValue(doc, 'Catégorie', measure.category, currentY);
      }

      if (measure.priority) {
        currentY = PDFUtils.addKeyValue(doc, 'Priorité', measure.priority.toString(), currentY);
      }

      currentY = PDFUtils.addKeyValue(doc, 'Statut', measure.status, currentY);

      currentY += 10;

      // Section 2: Financial Summary
      currentY = PDFUtils.addPageIfNeeded(doc, currentY, 150);
      currentY = PDFUtils.addSectionHeader(doc, '2. Résumé Financier', currentY);

      const totalCost = this.formatDecimal(measure.totalCost);
      const totalY1 = this.formatDecimal(measure.totalCostY1);
      const totalY2 = this.formatDecimal(measure.totalCostY2);
      const totalY3 = this.formatDecimal(measure.totalCostY3);

      currentY = PDFUtils.addKeyValue(doc, 'Coût Total', PDFUtils.formatAmount(totalCost), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 1', PDFUtils.formatAmount(totalY1), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 2', PDFUtils.formatAmount(totalY2), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 3', PDFUtils.formatAmount(totalY3), currentY);

      currentY += 20;

      // Bar Chart - Budget Breakdown
      if (totalCost > 0) {
        currentY = PDFUtils.addPageIfNeeded(doc, currentY, 100);
        currentY = PDFUtils.addBarChart(
          doc,
          [
            { label: 'Année 1', value: totalY1 },
            { label: 'Année 2', value: totalY2 },
            { label: 'Année 3', value: totalY3 }
          ],
          currentY,
          { maxBarWidth: 350 }
        );

        currentY += 20;
      }

      // Section 3: Detailed Costing
      currentY = PDFUtils.addPageIfNeeded(doc, currentY, 200);
      currentY = PDFUtils.addSectionHeader(doc, '3. Détails des Coûts', currentY);

      const costingData = [
        ['Année', 'Quantité', 'Coût Unitaire (FDJ)', 'Coût Total (FDJ)']
      ];

      costingData.push([
        'Année 1',
        this.formatDecimal(measure.quantityY1).toString(),
        PDFUtils.formatAmount(this.formatDecimal(measure.unitCostY1)),
        PDFUtils.formatAmount(this.formatDecimal(measure.totalCostY1))
      ]);

      costingData.push([
        'Année 2',
        this.formatDecimal(measure.quantityY2).toString(),
        PDFUtils.formatAmount(this.formatDecimal(measure.unitCostY2)),
        PDFUtils.formatAmount(this.formatDecimal(measure.totalCostY2))
      ]);

      costingData.push([
        'Année 3',
        this.formatDecimal(measure.quantityY3).toString(),
        PDFUtils.formatAmount(this.formatDecimal(measure.unitCostY3)),
        PDFUtils.formatAmount(this.formatDecimal(measure.totalCostY3))
      ]);

      currentY = PDFUtils.addTable(
        doc,
        costingData[0],
        costingData.slice(1),
        currentY,
        { colWidths: [100, 100, 150, 150] }
      );

      currentY += 20;

      // Section 4: Classification & Justification
      currentY = PDFUtils.addPageIfNeeded(doc, currentY, 150);
      currentY = PDFUtils.addSectionHeader(doc, '4. Classification et Justification', currentY);

      if (measure.economicNature) {
        currentY = PDFUtils.addKeyValue(doc, 'Nature Économique', measure.economicNature.name, currentY);
      }

      if (measure.fundingSource) {
        currentY = PDFUtils.addKeyValue(doc, 'Source de Financement', measure.fundingSource.name, currentY);
      }

      if (measure.justification) {
        currentY += 10;
        doc.fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#6b7280')
          .text('Justification:', 50, currentY);

        currentY += 15;

        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(measure.justification, 50, currentY, {
            width: doc.page.width - 100,
            align: 'justify'
          });

        currentY = doc.y + 10;
      }

      if (measure.expectedImpact) {
        currentY = PDFUtils.addPageIfNeeded(doc, currentY, 60);
        currentY += 10;

        doc.fontSize(10)
          .font('Helvetica-Bold')
          .fillColor('#6b7280')
          .text('Impact Attendu:', 50, currentY);

        currentY += 15;

        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#000000')
          .text(measure.expectedImpact, 50, currentY, {
            width: doc.page.width - 100,
            align: 'justify'
          });

        currentY = doc.y + 10;
      }

      if (measure.performanceIndicator) {
        currentY = PDFUtils.addPageIfNeeded(doc, currentY, 40);
        currentY = PDFUtils.addKeyValue(doc, 'Indicateur de Performance', measure.performanceIndicator, currentY);
      }

      // Footer
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#6b7280')
        .text(
          `Document généré le ${new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}`,
          0,
          doc.page.height - 30,
          { align: 'center', width: doc.page.width }
        );

      doc.end();
    });
  }

  /**
   * Generate Excel export for a Sectoral Measure
   */
  static async generateExcel(id: string): Promise<Buffer> {
    const measure = await this.fetchMeasureData(id);

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    const workbook = ExcelUtils.createWorkbook();

    // Sheet 1: Résumé
    const summaryData: Record<string, any> = {
      'Code': measure.measureCode,
      'Nom': measure.name,
      'Description': measure.description || '',
      'Type d\'entité': measure.entityType,
      'Ministère': measure.ministry?.name || '',
      'Programme': measure.program?.name || '',
      'Catégorie': measure.category || '',
      'Priorité': measure.priority || '',
      'Statut': measure.status,
      'Coût Total (FDJ)': ExcelUtils.formatAmount(this.formatDecimal(measure.totalCost))
    };

    const summarySheet = ExcelUtils.createSummarySheet(summaryData, 'MESURE SECTORIELLE');
    ExcelUtils.addWorksheet(workbook, summarySheet, 'Résumé');

    // Sheet 2: Données Principales
    const mainHeaders = ['Code', 'Nom', 'Type', 'Ministère', 'Coût Total', 'Statut'];
    const mainRow = [
      measure.measureCode,
      measure.name,
      measure.entityType,
      measure.ministry?.name || '',
      this.formatDecimal(measure.totalCost),
      measure.status
    ];

    const mainSheet = ExcelUtils.createTable(mainHeaders, [mainRow], {
      title: 'Mesure Sectorielle',
      autoSize: true
    });
    ExcelUtils.addWorksheet(workbook, mainSheet, 'Mesure Sectorielle');

    // Sheet 3: Répartition Budgétaire
    const budgetSheet = ExcelUtils.createBudgetBreakdownSheet(
      this.formatDecimal(measure.totalCostY1),
      this.formatDecimal(measure.totalCostY2),
      this.formatDecimal(measure.totalCostY3)
    );
    ExcelUtils.addWorksheet(workbook, budgetSheet, 'Répartition Budgétaire');

    // Sheet 4: Détails des Coûts
    const costingHeaders = ['Année', 'Quantité', 'Coût Unitaire (FDJ)', 'Coût Total (FDJ)'];
    const costingRows = [
      [
        'Année 1',
        this.formatDecimal(measure.quantityY1).toString(),
        ExcelUtils.formatAmount(this.formatDecimal(measure.unitCostY1)),
        ExcelUtils.formatAmount(this.formatDecimal(measure.totalCostY1))
      ],
      [
        'Année 2',
        this.formatDecimal(measure.quantityY2).toString(),
        ExcelUtils.formatAmount(this.formatDecimal(measure.unitCostY2)),
        ExcelUtils.formatAmount(this.formatDecimal(measure.totalCostY2))
      ],
      [
        'Année 3',
        this.formatDecimal(measure.quantityY3).toString(),
        ExcelUtils.formatAmount(this.formatDecimal(measure.unitCostY3)),
        ExcelUtils.formatAmount(this.formatDecimal(measure.totalCostY3))
      ]
    ];

    const costingSheet = ExcelUtils.createTable(costingHeaders, costingRows, {
      title: 'Détails des Coûts',
      autoSize: true
    });
    ExcelUtils.addWorksheet(workbook, costingSheet, 'Détails des Coûts');

    // Sheet 5: Justification et Impact
    const justificationData: any[][] = [
      ['Justification et Impact Attendu'],
      []
    ];

    if (measure.justification) {
      justificationData.push(['Justification', measure.justification]);
      justificationData.push([]);
    }

    if (measure.expectedImpact) {
      justificationData.push(['Impact Attendu', measure.expectedImpact]);
      justificationData.push([]);
    }

    if (measure.performanceIndicator) {
      justificationData.push(['Indicateur de Performance', measure.performanceIndicator]);
    }

    if (measure.economicNature) {
      justificationData.push(['Nature Économique', measure.economicNature.name]);
    }

    if (measure.fundingSource) {
      justificationData.push(['Source de Financement', measure.fundingSource.name]);
    }

    const justificationSheet = XLSX.utils.aoa_to_sheet(justificationData);

    // Style title
    if (justificationSheet['A1']) {
      justificationSheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' }
      };
    }

    ExcelUtils.autoSizeColumns(justificationSheet);
    ExcelUtils.addWorksheet(workbook, justificationSheet, 'Justification');

    return ExcelUtils.workbookToBuffer(workbook);
  }

  /**
   * Generate CSV export for a Sectoral Measure
   */
  static async generateCSV(id: string): Promise<Buffer> {
    const measure = await this.fetchMeasureData(id);

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    const rows: string[][] = [
      ['Champ', 'Valeur'],
      ['Code', measure.measureCode],
      ['Nom', measure.name],
      ['Description', measure.description || ''],
      ['Type d\'entité', measure.entityType],
      ['Ministère', measure.ministry?.name || ''],
      ['Programme', measure.program?.name || ''],
      ['Catégorie', measure.category || ''],
      ['Priorité', measure.priority?.toString() || ''],
      ['Statut', measure.status],
      [],
      ['COÛTS'],
      ['Coût Total (FDJ)', this.formatDecimal(measure.totalCost).toString()],
      ['Coût Année 1 (FDJ)', this.formatDecimal(measure.totalCostY1).toString()],
      ['Coût Année 2 (FDJ)', this.formatDecimal(measure.totalCostY2).toString()],
      ['Coût Année 3 (FDJ)', this.formatDecimal(measure.totalCostY3).toString()],
      [],
      ['DÉTAILS ANNÉE 1'],
      ['Quantité Y1', this.formatDecimal(measure.quantityY1).toString()],
      ['Coût Unitaire Y1', this.formatDecimal(measure.unitCostY1).toString()],
      [],
      ['DÉTAILS ANNÉE 2'],
      ['Quantité Y2', this.formatDecimal(measure.quantityY2).toString()],
      ['Coût Unitaire Y2', this.formatDecimal(measure.unitCostY2).toString()],
      [],
      ['DÉTAILS ANNÉE 3'],
      ['Quantité Y3', this.formatDecimal(measure.quantityY3).toString()],
      ['Coût Unitaire Y3', this.formatDecimal(measure.unitCostY3).toString()],
      [],
      ['CLASSIFICATION'],
      ['Nature Économique', measure.economicNature?.name || ''],
      ['Source de Financement', measure.fundingSource?.name || ''],
      [],
      ['JUSTIFICATION'],
      ['Justification', measure.justification || ''],
      ['Impact Attendu', measure.expectedImpact || ''],
      ['Indicateur de Performance', measure.performanceIndicator || '']
    ];

    const csv = rows
      .map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
      .join('\n');

    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Fetch sectoral measure data with all relations
   */
  private static async fetchMeasureData(id: string) {
    return await prisma.sectoralMeasure.findUnique({
      where: { id },
      include: {
        ministry: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        program: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        economicNature: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        fundingSource: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    });
  }

  /**
   * Format Decimal value to number
   */
  private static formatDecimal(value: Decimal | null | undefined): number {
    if (!value) return 0;
    return new Decimal(value).toNumber();
  }

  /**
   * Escape CSV cell content
   */
  private static escapeCsvCell(cell: string): string {
    if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
      return `"${cell.replace(/"/g, '""')}"`;
    }
    return cell;
  }
}

export default SectoralMeasureExportService;
