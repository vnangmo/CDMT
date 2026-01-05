import prisma from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';
import { TOFECalculationService } from './tofeCalculation.service';

interface ExportOptions {
  format: 'excel' | 'pdf';
  includeMetadata?: boolean;
  includeCalculations?: boolean;
}

export class TOFEExportService {
  /**
   * Exporter un document TOFE en Excel
   */
  static async exportToExcel(tofeDocumentId: string): Promise<Buffer> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: {
          orderBy: { orderIndex: 'asc' },
        },
        macroFramework: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new();

    // === FEUILLE 1: TOFE Principal ===
    const tofeData = this.prepareTofeDataForExcel(document);
    const tofeSheet = XLSX.utils.aoa_to_sheet(tofeData);

    // Appliquer le formatage
    this.applyExcelFormatting(tofeSheet, document.lines.length);

    XLSX.utils.book_append_sheet(workbook, tofeSheet, 'TOFE');

    // === FEUILLE 2: Recettes détaillées ===
    const revenueLines = document.lines.filter(l => l.section === 'REVENUE');
    const baseYear = (document as any).baseYear || document.macroFramework.budgetYear - 1;
    const years = [
      (document as any).projectionYear1 || document.macroFramework.budgetYear,
      (document as any).projectionYear2 || document.macroFramework.budgetYear + 1,
      (document as any).projectionYear3 || document.macroFramework.budgetYear + 2
    ];
    const revenueData = this.prepareDetailedDataForExcel(
      revenueLines,
      'RECETTES',
      baseYear,
      years
    );
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Recettes');

    // === FEUILLE 3: Dépenses détaillées ===
    const expenseLines = document.lines.filter(l => l.section === 'EXPENSE');
    const expenseData = this.prepareDetailedDataForExcel(
      expenseLines,
      'DÉPENSES',
      baseYear,
      years
    );
    const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(workbook, expenseSheet, 'Dépenses');

    // === FEUILLE 4: Analyse et ratios ===
    const analysisData = await this.prepareAnalysisForExcel(tofeDocumentId, document);
    const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData);
    XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Analyse');

    // === FEUILLE 5: Métadonnées ===
    const metadataData = this.prepareMetadataForExcel(document);
    const metadataSheet = XLSX.utils.aoa_to_sheet(metadataData);
    XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Métadonnées');

    // Générer le buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Préparer les données TOFE pour Excel
   */
  private static prepareTofeDataForExcel(document: any): any[][] {
    const data: any[][] = [];

    // En-tête du document
    data.push([document.title]);
    data.push([`Code: ${document.documentCode}`]);
    data.push([`Année fiscale: ${document.fiscalYear}`]);
    data.push([`Unité: ${document.unit} ${document.currency}`]);
    data.push([]);

    // En-têtes des colonnes
    const baseYear = document.lines[0]?.baseYear;
    const year1 = document.lines[0]?.projectionYear1;
    const year2 = document.lines[0]?.projectionYear2;
    const year3 = document.lines[0]?.projectionYear3;

    const headers = [
      'Code',
      'Libellé',
      'Code GFS',
      `${baseYear} (Base)`,
      `${year1}`,
      `${year2}`,
    ];

    if (year3) {
      headers.push(`${year3}`);
    }

    data.push(headers);

    // Lignes TOFE
    for (const line of document.lines) {
      const indent = '  '.repeat(line.lineLevel);
      const row = [
        line.lineCode,
        indent + line.lineLabel,
        line.gfsCode || '',
        this.formatAmount(line.baseAmount),
        this.formatAmount(line.amount1),
        this.formatAmount(line.amount2),
      ];

      if (year3 && line.amount3) {
        row.push(this.formatAmount(line.amount3));
      }

      data.push(row);
    }

    return data;
  }

  /**
   * Préparer les données détaillées pour Excel
   */
  private static prepareDetailedDataForExcel(
    lines: any[],
    title: string,
    baseYear: number,
    projectionYears: number[]
  ): any[][] {
    const data: any[][] = [];

    data.push([title]);
    data.push([]);

    const headers = [
      'Code',
      'Libellé',
      'Niveau',
      'Code GFS',
      `${baseYear} (Base)`,
      `${projectionYears[0]}`,
      `${projectionYears[1]}`,
    ];

    if (projectionYears[2]) {
      headers.push(`${projectionYears[2]}`);
    }

    data.push(headers);

    for (const line of lines) {
      const row = [
        line.lineCode,
        line.lineLabel,
        line.lineLevel,
        line.gfsCode || '',
        this.formatAmount(line.baseAmount),
        this.formatAmount(line.amount1),
        this.formatAmount(line.amount2),
      ];

      if (projectionYears[2] && line.amount3) {
        row.push(this.formatAmount(line.amount3));
      }

      data.push(row);
    }

    return data;
  }

  /**
   * Préparer l'analyse et les ratios pour Excel
   */
  private static async prepareAnalysisForExcel(tofeDocumentId: string, document: any): Promise<any[][]> {
    const data: any[][] = [];

    data.push(['ANALYSE BUDGÉTAIRE']);
    data.push([]);

    // Obtenir les soldes budgétaires
    const balances = await TOFECalculationService.calculateFiscalBalance(tofeDocumentId);

    data.push(['Soldes budgétaires']);
    data.push(['Année', 'Recettes', 'Dépenses', 'Solde', 'Type', 'Ratio (% Recettes)']);

    for (const balance of balances) {
      data.push([
        balance.year,
        this.formatAmount(balance.totalRevenue),
        this.formatAmount(balance.totalExpense),
        this.formatAmount(balance.balance),
        balance.isSurplus ? 'EXCÉDENT' : balance.isDeficit ? 'DÉFICIT' : 'ÉQUILIBRÉ',
        balance.balanceRatio.toFixed(2) + '%',
      ]);
    }

    data.push([]);

    // Ratios budgétaires
    const ratios = await TOFECalculationService.calculateBudgetRatios(tofeDocumentId);

    data.push(['Ratios budgétaires']);
    data.push(['Année', 'Croissance Recettes', 'Croissance Dépenses', 'Dépenses/Recettes', 'Solde/Recettes']);

    for (const ratio of ratios) {
      data.push([
        ratio.year,
        ratio.revenueGrowth,
        ratio.expenseGrowth,
        ratio.expenseToRevenueRatio,
        ratio.balanceToRevenueRatio,
      ]);
    }

    data.push([]);

    // Vérification de cohérence
    const consistency = await TOFECalculationService.checkConsistency(tofeDocumentId);

    data.push(['Vérification de cohérence']);
    data.push(['Statut', consistency.isConsistent ? 'COHÉRENT' : 'ERREURS DÉTECTÉES']);
    data.push([]);

    if (consistency.errors.length > 0) {
      data.push(['Erreurs']);
      consistency.errors.forEach(err => data.push([err]));
      data.push([]);
    }

    if (consistency.warnings.length > 0) {
      data.push(['Avertissements']);
      consistency.warnings.forEach(warn => data.push([warn]));
    }

    return data;
  }

  /**
   * Préparer les métadonnées pour Excel
   */
  private static prepareMetadataForExcel(document: any): any[][] {
    const data: any[][] = [];

    data.push(['MÉTADONNÉES DU DOCUMENT']);
    data.push([]);

    data.push(['Champ', 'Valeur']);
    data.push(['ID', document.id]);
    data.push(['Code', document.documentCode]);
    data.push(['Titre', document.title]);
    data.push(['Description', document.description || '']);
    data.push(['Année fiscale', document.fiscalYear]);
    data.push(['Devise', document.currency]);
    data.push(['Unité', document.unit]);
    data.push(['Statut', document.status]);
    data.push(['Créé le', new Date(document.createdAt).toLocaleString('fr-FR')]);
    data.push(['Mis à jour le', new Date(document.updatedAt).toLocaleString('fr-FR')]);
    data.push(['Créé par', document.createdBy || 'N/A']);
    data.push(['Validé par', document.validatedBy || 'N/A']);
    data.push(['Approuvé par', document.approvedBy || 'N/A']);

    if (document.macroFramework) {
      data.push([]);
      data.push(['CADRE MACROÉCONOMIQUE']);
      data.push(['Année', document.macroFramework.year]);
      data.push(['Année budgétaire', document.macroFramework.budgetYear]);
      data.push(['Taux de croissance PIB', document.macroFramework.gdpGrowthRate.toString() + '%']);
      data.push(['Taux d\'inflation', document.macroFramework.inflationRate.toString() + '%']);
      data.push(['Taux de change', document.macroFramework.exchangeRate?.toString() || 'N/A']);
    }

    return data;
  }

  /**
   * Appliquer le formatage à une feuille Excel
   */
  private static applyExcelFormatting(sheet: XLSX.WorkSheet, rowCount: number) {
    // Définir les largeurs de colonnes
    sheet['!cols'] = [
      { wch: 8 },   // Code
      { wch: 40 },  // Libellé
      { wch: 10 },  // Code GFS
      { wch: 15 },  // Montants
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    // Note: Le formatage avancé (couleurs, bordures, etc.) nécessite des bibliothèques supplémentaires
    // comme xlsx-style ou ExcelJS. Pour l'instant, on garde un formatage basique.
  }

  /**
   * Exporter un document TOFE en PDF
   */
  static async exportToPDF(tofeDocumentId: string): Promise<Buffer> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: {
          orderBy: { orderIndex: 'asc' },
        },
        macroFramework: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        layout: 'landscape',
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête du document
      doc.fontSize(16).font('Helvetica-Bold').text(document.title, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`Code: ${document.documentCode}`, { align: 'center' });
      doc.text(`Année fiscale: ${document.fiscalYear}`, { align: 'center' });
      doc.text(`Unité: ${document.unit} ${document.currency}`, { align: 'center' });
      doc.moveDown(2);

      // Tableau TOFE
      const tableTop = doc.y;
      const colWidths = [50, 250, 60, 80, 80, 80, 80];
      const rowHeight = 20;

      // En-têtes
      doc.fontSize(9).font('Helvetica-Bold');
      const headers = [
        'Code',
        'Libellé',
        'GFS',
        `${document.lines[0]?.baseYear}`,
        `${document.lines[0]?.projectionYear1}`,
        `${document.lines[0]?.projectionYear2}`,
        document.lines[0]?.projectionYear3 ? `${document.lines[0].projectionYear3}` : '',
      ];

      let x = 50;
      headers.forEach((header, i) => {
        if (header) {
          doc.text(header, x, tableTop, { width: colWidths[i], align: 'center' });
        }
        x += colWidths[i];
      });

      doc.moveDown();

      // Lignes
      doc.fontSize(8).font('Helvetica');
      let y = tableTop + rowHeight;

      for (const line of document.lines) {
        // Vérifier si on doit passer à une nouvelle page
        if (y > 500) {
          doc.addPage();
          y = 50;

          // Ré-afficher les en-têtes
          doc.fontSize(9).font('Helvetica-Bold');
          x = 50;
          headers.forEach((header, i) => {
            if (header) {
              doc.text(header, x, y, { width: colWidths[i], align: 'center' });
            }
            x += colWidths[i];
          });
          y += rowHeight;
          doc.fontSize(8).font('Helvetica');
        }

        // Mettre en gras les totaux
        if (line.isBold) {
          doc.font('Helvetica-Bold');
        }

        const indent = '  '.repeat(line.lineLevel);

        x = 50;
        const values = [
          line.lineCode,
          indent + line.lineLabel,
          line.gfsCode || '',
          this.formatAmount(line.baseAmount),
          this.formatAmount(line.amount1),
          this.formatAmount(line.amount2),
          line.amount3 ? this.formatAmount(line.amount3) : '',
        ];

        values.forEach((value, i) => {
          if (value !== undefined) {
            const align = i <= 2 ? 'left' : 'right';
            doc.text(value, x, y, { width: colWidths[i], align });
          }
          x += colWidths[i];
        });

        y += rowHeight;

        if (line.isBold) {
          doc.font('Helvetica');
        }
      }

      // Pied de page
      doc.fontSize(8).text(
        `Document généré le ${new Date().toLocaleString('fr-FR')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }

  /**
   * Formater un montant pour l'affichage
   */
  private static formatAmount(amount: Decimal | null | undefined): string {
    if (!amount) return '0.00';

    const value = new Decimal(amount);
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  /**
   * Exporter un document TOFE (méthode générique)
   */
  static async export(tofeDocumentId: string, format: 'excel' | 'pdf'): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      select: { documentCode: true, fiscalYear: true },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    if (format === 'excel') {
      buffer = await this.exportToExcel(tofeDocumentId);
      filename = `${document.documentCode}_${document.fiscalYear}.xlsx`;
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      buffer = await this.exportToPDF(tofeDocumentId);
      filename = `${document.documentCode}_${document.fiscalYear}.pdf`;
      mimeType = 'application/pdf';
    }

    return { buffer, filename, mimeType };
  }
}

export default TOFEExportService;
