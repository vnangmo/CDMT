import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import prisma from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';

export class CBMTExportService {
  /**
   * Export CBMT to Excel (multi-sheet workbook)
   */
  static async exportToExcel(cbmtDocumentId: string): Promise<Buffer> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        macroFramework: true,
        aggregates: {
          orderBy: {
            categoryCode: 'asc',
          },
        },
        reserves: true,
        analyses: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const workbook = XLSX.utils.book_new();

    // Feuille 1: Informations générales
    this.addSummarySheet(workbook, document);

    // Feuille 2: Agrégats de recettes
    this.addRevenueAggregatesSheet(workbook, document);

    // Feuille 3: Agrégats de dépenses
    this.addExpenseAggregatesSheet(workbook, document);

    // Feuille 4: Réserves budgétaires
    this.addReservesSheet(workbook, document);

    // Feuille 5: Analyse des écarts
    this.addGapAnalysisSheet(workbook, document);

    // Feuille 6: Résumé des analyses
    if (document.analyses.length > 0) {
      this.addAnalysesSheet(workbook, document);
    }

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });

    return excelBuffer;
  }

  /**
   * Export CBMT to PDF
   */
  static async exportToPDF(cbmtDocumentId: string): Promise<Buffer> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        macroFramework: true,
        aggregates: {
          orderBy: {
            categoryCode: 'asc',
          },
        },
        reserves: true,
        analyses: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: document.title,
          Author: 'Système CDMT - Djibouti',
          Subject: `CBMT ${document.fiscalYear}`,
        },
      });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Page de garde
      this.addCoverPage(doc, document);

      // Section 1: Informations générales
      doc.addPage();
      this.addGeneralInfoSection(doc, document);

      // Section 2: Plafonds budgétaires globaux
      doc.addPage();
      this.addCeilingsSection(doc, document);

      // Section 3: Agrégats de recettes
      doc.addPage();
      this.addRevenueAggregatesSection(doc, document);

      // Section 4: Agrégats de dépenses
      doc.addPage();
      this.addExpenseAggregatesSection(doc, document);

      // Section 5: Réserves budgétaires
      doc.addPage();
      this.addReservesSection(doc, document);

      // Section 6: Analyses (si disponibles)
      if (document.analyses.length > 0) {
        doc.addPage();
        this.addAnalysesSection(doc, document);
      }

      doc.end();
    });
  }

  // Méthodes privées pour Excel

  private static addSummarySheet(workbook: XLSX.WorkBook, document: any) {
    const data = [
      ['CADRE BUDGÉTAIRE À MOYEN TERME'],
      [],
      ['Code', document.documentCode],
      ['Titre', document.title],
      ['Année fiscale', document.fiscalYear],
      ['Scénario', document.scenarioName],
      ['Statut', document.status],
      [],
      ['PLAFONDS GLOBAUX (' + document.unit + ' ' + document.currency + ')'],
      [],
      ['Plafond de recettes totales', document.totalRevenueCeiling.toNumber()],
      ['Plafond de dépenses totales', document.totalExpenseCeiling.toNumber()],
      ['Plafond de déficit budgétaire', document.fiscalDeficitCeiling?.toNumber() || 0],
      ['Plafond d\'endettement', document.debtCeiling?.toNumber() || 0],
      [],
      ['HYPOTHÈSES MACROÉCONOMIQUES'],
      [],
      ['Taux de croissance du PIB (%)', document.macroFramework.gdpGrowthRate.toNumber()],
      ['Taux d\'inflation (%)', document.macroFramework.inflationRate.toNumber()],
      ['Taux de change', document.macroFramework.exchangeRate?.toNumber() || '-'],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Résumé');
  }

  private static addRevenueAggregatesSheet(workbook: XLSX.WorkBook, document: any) {
    const revenueAggregates = document.aggregates.filter(
      (a: any) => a.aggregateType === 'REVENUE'
    );

    const data = [
      [
        'Code',
        'Catégorie',
        'Année de base',
        'Montant de base',
        `Année ${document.aggregates[0].year1}`,
        'Montant N+1',
        'Plafond N+1',
        'Écart N+1',
        `Année ${document.aggregates[0].year2}`,
        'Montant N+2',
        'Plafond N+2',
        'Écart N+2',
        `Année ${document.aggregates[0].year3}`,
        'Montant N+3',
        'Plafond N+3',
        'Écart N+3',
      ],
    ];

    for (const aggregate of revenueAggregates) {
      data.push([
        aggregate.categoryCode,
        aggregate.categoryName,
        aggregate.baseYear,
        aggregate.baseAmount.toNumber(),
        aggregate.year1,
        aggregate.amount1.toNumber(),
        aggregate.ceiling1?.toNumber() || 0,
        aggregate.gap1?.toNumber() || 0,
        aggregate.year2,
        aggregate.amount2.toNumber(),
        aggregate.ceiling2?.toNumber() || 0,
        aggregate.gap2?.toNumber() || 0,
        aggregate.year3,
        aggregate.amount3.toNumber(),
        aggregate.ceiling3?.toNumber() || 0,
        aggregate.gap3?.toNumber() || 0,
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Recettes');
  }

  private static addExpenseAggregatesSheet(workbook: XLSX.WorkBook, document: any) {
    const expenseAggregates = document.aggregates.filter(
      (a: any) => a.aggregateType === 'EXPENSE'
    );

    const data = [
      [
        'Code',
        'Catégorie',
        'Année de base',
        'Montant de base',
        `Année ${document.aggregates[0].year1}`,
        'Montant N+1',
        'Plafond N+1',
        'Écart N+1',
        `Année ${document.aggregates[0].year2}`,
        'Montant N+2',
        'Plafond N+2',
        'Écart N+2',
        `Année ${document.aggregates[0].year3}`,
        'Montant N+3',
        'Plafond N+3',
        'Écart N+3',
      ],
    ];

    for (const aggregate of expenseAggregates) {
      data.push([
        aggregate.categoryCode,
        aggregate.categoryName,
        aggregate.baseYear,
        aggregate.baseAmount.toNumber(),
        aggregate.year1,
        aggregate.amount1.toNumber(),
        aggregate.ceiling1?.toNumber() || 0,
        aggregate.gap1?.toNumber() || 0,
        aggregate.year2,
        aggregate.amount2.toNumber(),
        aggregate.ceiling2?.toNumber() || 0,
        aggregate.gap2?.toNumber() || 0,
        aggregate.year3,
        aggregate.amount3.toNumber(),
        aggregate.ceiling3?.toNumber() || 0,
        aggregate.gap3?.toNumber() || 0,
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dépenses');
  }

  private static addReservesSheet(workbook: XLSX.WorkBook, document: any) {
    const data = [
      [
        'Type',
        'Nom',
        'Description',
        `Année ${document.aggregates[0].year1}`,
        'Montant N+1',
        'Alloué N+1',
        'Disponible N+1',
        `Année ${document.aggregates[0].year2}`,
        'Montant N+2',
        'Alloué N+2',
        'Disponible N+2',
        `Année ${document.aggregates[0].year3}`,
        'Montant N+3',
        'Alloué N+3',
        'Disponible N+3',
      ],
    ];

    for (const reserve of document.reserves) {
      data.push([
        reserve.reserveType,
        reserve.name,
        reserve.description || '',
        reserve.year1,
        reserve.amount1.toNumber(),
        reserve.allocated1.toNumber(),
        reserve.available1.toNumber(),
        reserve.year2,
        reserve.amount2.toNumber(),
        reserve.allocated2.toNumber(),
        reserve.available2.toNumber(),
        reserve.year3,
        reserve.amount3.toNumber(),
        reserve.allocated3.toNumber(),
        reserve.available3.toNumber(),
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Réserves');
  }

  private static addGapAnalysisSheet(workbook: XLSX.WorkBook, document: any) {
    const data = [['ANALYSE DES ÉCARTS BUDGÉTAIRES'], []];

    // Résumé par année
    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const year = document.aggregates[0][`year${yearIndex}`];

      const revenueAggregates = document.aggregates.filter(
        (a: any) => a.aggregateType === 'REVENUE'
      );
      const expenseAggregates = document.aggregates.filter(
        (a: any) => a.aggregateType === 'EXPENSE'
      );

      const totalRevenue = revenueAggregates.reduce(
        (sum: number, a: any) => sum + a[`amount${yearIndex}`].toNumber(),
        0
      );
      const totalRevenueCeiling = revenueAggregates.reduce(
        (sum: number, a: any) => sum + (a[`ceiling${yearIndex}`]?.toNumber() || 0),
        0
      );
      const revenueGap = totalRevenue - totalRevenueCeiling;

      const totalExpense = expenseAggregates.reduce(
        (sum: number, a: any) => sum + a[`amount${yearIndex}`].toNumber(),
        0
      );
      const totalExpenseCeiling = expenseAggregates.reduce(
        (sum: number, a: any) => sum + (a[`ceiling${yearIndex}`]?.toNumber() || 0),
        0
      );
      const expenseGap = totalExpense - totalExpenseCeiling;

      data.push([`ANNÉE ${year}`]);
      data.push(['Recettes totales', String(totalRevenue)]);
      data.push(['Plafond de recettes', String(totalRevenueCeiling)]);
      data.push(['Écart de recettes', String(revenueGap)]);
      data.push(['Dépenses totales', String(totalExpense)]);
      data.push(['Plafond de dépenses', String(totalExpenseCeiling)]);
      data.push(['Écart de dépenses', String(expenseGap)]);
      data.push(['Solde budgétaire', String(totalRevenue - totalExpense)]);
      data.push([]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyse Écarts');
  }

  private static addAnalysesSheet(workbook: XLSX.WorkBook, document: any) {
    const data = [
      ['Type', 'Nom', 'Description', 'Niveau de risque', 'Conclusions', 'Recommandations'],
    ];

    for (const analysis of document.analyses) {
      data.push([
        analysis.analysisType,
        analysis.analysisName,
        analysis.description || '',
        analysis.riskLevel || '',
        analysis.conclusions || '',
        analysis.recommendations || '',
      ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Analyses');
  }

  // Méthodes privées pour PDF

  private static addCoverPage(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(24).text('RÉPUBLIQUE DE DJIBOUTI', { align: 'center' });
    doc.moveDown();
    doc.fontSize(18).text('Ministère des Finances', { align: 'center' });
    doc.moveDown(3);
    doc
      .fontSize(22)
      .text('CADRE BUDGÉTAIRE À MOYEN TERME', { align: 'center', underline: true });
    doc.moveDown();
    doc.fontSize(20).text(document.title, { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(14).text(`Document: ${document.documentCode}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Année fiscale: ${document.fiscalYear}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Statut: ${document.status}`, { align: 'center' });
    doc.moveDown(3);
    doc
      .fontSize(12)
      .text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
  }

  private static addGeneralInfoSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('1. INFORMATIONS GÉNÉRALES', { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Code du document: ${document.documentCode}`);
    doc.text(`Titre: ${document.title}`);
    doc.text(`Année fiscale: ${document.fiscalYear}`);
    doc.text(`Scénario: ${document.scenarioName}`);
    doc.text(`Statut: ${document.status}`);
    doc.text(`Unité: ${document.unit} ${document.currency}`);
    doc.moveDown();

    doc.fontSize(14).text('Hypothèses macroéconomiques:', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Taux de croissance du PIB: ${document.macroFramework.gdpGrowthRate}%`);
    doc.text(`Taux d'inflation: ${document.macroFramework.inflationRate}%`);
    doc.text(`Taux de change: ${document.macroFramework.exchangeRate || 'N/A'}`);
  }

  private static addCeilingsSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('2. PLAFONDS BUDGÉTAIRES GLOBAUX', { underline: true });
    doc.moveDown();

    const formatAmount = (amount: any) => {
      return amount.toNumber().toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    doc.fontSize(12);
    doc.text(
      `Plafond de recettes totales: ${formatAmount(document.totalRevenueCeiling)} ${document.unit} ${document.currency}`
    );
    doc.text(
      `Plafond de dépenses totales: ${formatAmount(document.totalExpenseCeiling)} ${document.unit} ${document.currency}`
    );
    doc.text(
      `Plafond de déficit budgétaire: ${formatAmount(document.fiscalDeficitCeiling || 0)} ${document.unit} ${document.currency}`
    );
    doc.text(
      `Plafond d'endettement: ${formatAmount(document.debtCeiling || 0)} ${document.unit} ${document.currency}`
    );
  }

  private static addRevenueAggregatesSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('3. AGRÉGATS DE RECETTES', { underline: true });
    doc.moveDown();

    const revenueAggregates = document.aggregates.filter(
      (a: any) => a.aggregateType === 'REVENUE'
    );

    for (const aggregate of revenueAggregates) {
      doc.fontSize(12).text(`${aggregate.categoryCode} - ${aggregate.categoryName}`, {
        continued: false,
      });
      doc.fontSize(10);
      doc.text(`  N+1: ${aggregate.amount1.toNumber()} (Plafond: ${aggregate.ceiling1?.toNumber() || 0})`);
      doc.text(`  N+2: ${aggregate.amount2.toNumber()} (Plafond: ${aggregate.ceiling2?.toNumber() || 0})`);
      doc.text(`  N+3: ${aggregate.amount3.toNumber()} (Plafond: ${aggregate.ceiling3?.toNumber() || 0})`);
      doc.moveDown(0.5);
    }
  }

  private static addExpenseAggregatesSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('4. AGRÉGATS DE DÉPENSES', { underline: true });
    doc.moveDown();

    const expenseAggregates = document.aggregates.filter(
      (a: any) => a.aggregateType === 'EXPENSE'
    );

    for (const aggregate of expenseAggregates) {
      doc.fontSize(12).text(`${aggregate.categoryCode} - ${aggregate.categoryName}`, {
        continued: false,
      });
      doc.fontSize(10);
      doc.text(`  N+1: ${aggregate.amount1.toNumber()} (Plafond: ${aggregate.ceiling1?.toNumber() || 0})`);
      doc.text(`  N+2: ${aggregate.amount2.toNumber()} (Plafond: ${aggregate.ceiling2?.toNumber() || 0})`);
      doc.text(`  N+3: ${aggregate.amount3.toNumber()} (Plafond: ${aggregate.ceiling3?.toNumber() || 0})`);
      doc.moveDown(0.5);
    }
  }

  private static addReservesSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('5. RÉSERVES BUDGÉTAIRES', { underline: true });
    doc.moveDown();

    for (const reserve of document.reserves) {
      doc.fontSize(12).text(`${reserve.name} (${reserve.reserveType})`);
      doc.fontSize(10);
      doc.text(`Description: ${reserve.description || 'N/A'}`);
      doc.text(
        `N+1: Montant ${reserve.amount1.toNumber()}, Alloué ${reserve.allocated1.toNumber()}, Disponible ${reserve.available1.toNumber()}`
      );
      doc.text(
        `N+2: Montant ${reserve.amount2.toNumber()}, Alloué ${reserve.allocated2.toNumber()}, Disponible ${reserve.available2.toNumber()}`
      );
      doc.text(
        `N+3: Montant ${reserve.amount3.toNumber()}, Alloué ${reserve.allocated3.toNumber()}, Disponible ${reserve.available3.toNumber()}`
      );
      doc.moveDown(0.5);
    }
  }

  private static addAnalysesSection(doc: PDFKit.PDFDocument, document: any) {
    doc.fontSize(16).text('6. ANALYSES ET RECOMMANDATIONS', { underline: true });
    doc.moveDown();

    for (const analysis of document.analyses) {
      doc.fontSize(14).text(`${analysis.analysisName} (${analysis.analysisType})`);
      doc.fontSize(10);
      doc.text(`Niveau de risque: ${analysis.riskLevel || 'N/A'}`);
      doc.text(`Conclusions: ${analysis.conclusions || 'N/A'}`);
      doc.text(`Recommandations: ${analysis.recommendations || 'N/A'}`);
      doc.moveDown(0.5);
    }
  }
}

export default CBMTExportService;
