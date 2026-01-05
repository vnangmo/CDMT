import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { NotFoundError } from '../middleware/errorHandler';
import { TrendCalculationService } from './trendCalculation.service';

const prisma = new PrismaClient();

export class TrendExportService {
  /**
   * Exporter toutes les données vers Excel
   */
  static async exportToExcel(trendConfigId: string): Promise<Buffer> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    // Récupérer toutes les données
    const [historicals, projections] = await Promise.all([
      prisma.historicalBudget.findMany({
        where: { trendConfigId },
        include: {
          ministry: { select: { code: true, name: true } },
          program: { select: { code: true, name: true } },
          economicNature: { select: { code: true, name: true } },
          fundingSource: { select: { code: true, name: true } },
        },
        orderBy: [{ ministryId: 'asc' }, { fiscalYear: 'asc' }],
      }),
      prisma.trendProjection.findMany({
        where: { trendConfigId },
        include: {
          ministry: { select: { code: true, name: true, isPriority: true } },
          program: { select: { code: true, name: true } },
          economicNature: { select: { code: true, name: true } },
          fundingSource: { select: { code: true, name: true } },
        },
        orderBy: [{ ministryId: 'asc' }],
      }),
    ]);

    const summaries = await TrendCalculationService.getSummaryByMinistry(trendConfigId);

    // Créer le workbook
    const wb = XLSX.utils.book_new();

    // Feuille 1: Configuration
    const configData = [
      ['Configuration du Budget Tendanciel'],
      [],
      ['Code', config.configCode],
      ['Nom', config.name],
      ['Description', config.description || ''],
      ['Année fiscale', config.fiscalYear],
      ['Période de référence', `${config.baselineStartYear} - ${config.baselineEndYear}`],
      ['Taux de croissance global', `${config.globalGrowthRate}%`],
      ['Années de projection', config.projectionYears],
      ['Exclure dépenses temporaires', config.excludeTemporary ? 'Oui' : 'Non'],
      ['Statut', config.status],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(configData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Configuration');

    // Feuille 2: Budgets Historiques
    const historicalData = [
      [
        'Ministère Code',
        'Ministère',
        'Programme Code',
        'Programme',
        'Nature Économique Code',
        'Nature Économique',
        'Source de Financement Code',
        'Source de Financement',
        'Année Fiscale',
        'Montant Budgété',
        'Montant Exécuté',
        'Temporaire',
        'Notes',
      ],
      ...historicals.map((h) => [
        h.ministry.code,
        h.ministry.name,
        h.program?.code || '',
        h.program?.name || '',
        h.economicNature?.code || '',
        h.economicNature?.name || '',
        h.fundingSource?.code || '',
        h.fundingSource?.name || '',
        h.fiscalYear,
        parseFloat(h.budgetAmount.toString()),
        h.executedAmount ? parseFloat(h.executedAmount.toString()) : '',
        h.isTemporary ? 'Oui' : 'Non',
        h.notes || '',
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(historicalData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Historiques');

    // Feuille 3: Projections
    const projectionData = [
      [
        'Ministère Code',
        'Ministère',
        'Prioritaire',
        'Programme Code',
        'Programme',
        'Nature Économique Code',
        'Nature Économique',
        'Source de Financement Code',
        'Source de Financement',
        'Montant de Base',
        'Années Utilisées',
        `N+1 (${config.fiscalYear + 1})`,
        'Taux N+1',
        `N+2 (${config.fiscalYear + 2})`,
        'Taux N+2',
        `N+3 (${config.fiscalYear + 3})`,
        'Taux N+3',
        'Méthode de Calcul',
        'Dernière Màj',
      ],
      ...projections.map((p) => [
        p.ministry.code,
        p.ministry.name,
        p.isPriorityMinistry ? 'Oui' : 'Non',
        p.program?.code || '',
        p.program?.name || '',
        p.economicNature?.code || '',
        p.economicNature?.name || '',
        p.fundingSource?.code || '',
        p.fundingSource?.name || '',
        parseFloat(p.baseAmount.toString()),
        p.historicalYearsUsed.join(', '),
        parseFloat(p.projectedAmount1.toString()),
        parseFloat(p.growthRate1.toString()) + '%',
        parseFloat(p.projectedAmount2.toString()),
        parseFloat(p.growthRate2.toString()) + '%',
        parseFloat(p.projectedAmount3.toString()),
        parseFloat(p.growthRate3.toString()) + '%',
        p.calculationMethod,
        p.lastCalculatedAt ? new Date(p.lastCalculatedAt).toLocaleString('fr-FR') : '',
      ]),
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(projectionData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Projections');

    // Feuille 4: Résumé par Ministère
    const summaryData = [
      [
        'Ministère',
        'Prioritaire',
        'Montant de Base',
        `N+1 (${config.fiscalYear + 1})`,
        `N+2 (${config.fiscalYear + 2})`,
        `N+3 (${config.fiscalYear + 3})`,
        'Nombre de Projections',
      ],
      ...summaries.map((s: any) => [
        s.ministryName,
        s.isPriority ? 'Oui' : 'Non',
        parseFloat(s.totalBase),
        parseFloat(s.totalN1),
        parseFloat(s.totalN2),
        parseFloat(s.totalN3),
        parseInt(s.projectionCount),
      ]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Résumé par Ministère');

    // Générer le buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Exporter toutes les données vers CSV
   */
  static async exportToCSV(trendConfigId: string): Promise<string> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    const projections = await prisma.trendProjection.findMany({
      where: { trendConfigId },
      include: {
        ministry: { select: { code: true, name: true, isPriority: true } },
        program: { select: { code: true, name: true } },
        economicNature: { select: { code: true, name: true } },
        fundingSource: { select: { code: true, name: true } },
      },
      orderBy: [{ ministryId: 'asc' }],
    });

    // En-tête CSV
    let csv = [
      'Ministère Code',
      'Ministère',
      'Prioritaire',
      'Programme Code',
      'Programme',
      'Nature Économique Code',
      'Nature Économique',
      'Source de Financement Code',
      'Source de Financement',
      'Montant de Base',
      `N+1 (${config.fiscalYear + 1})`,
      'Taux N+1',
      `N+2 (${config.fiscalYear + 2})`,
      'Taux N+2',
      `N+3 (${config.fiscalYear + 3})`,
      'Taux N+3',
      'Méthode',
    ].join(',') + '\n';

    // Données
    for (const p of projections) {
      csv += [
        this.escapeCsv(p.ministry.code),
        this.escapeCsv(p.ministry.name),
        p.isPriorityMinistry ? 'Oui' : 'Non',
        this.escapeCsv(p.program?.code || ''),
        this.escapeCsv(p.program?.name || ''),
        this.escapeCsv(p.economicNature?.code || ''),
        this.escapeCsv(p.economicNature?.name || ''),
        this.escapeCsv(p.fundingSource?.code || ''),
        this.escapeCsv(p.fundingSource?.name || ''),
        parseFloat(p.baseAmount.toString()),
        parseFloat(p.projectedAmount1.toString()),
        parseFloat(p.growthRate1.toString()),
        parseFloat(p.projectedAmount2.toString()),
        parseFloat(p.growthRate2.toString()),
        parseFloat(p.projectedAmount3.toString()),
        parseFloat(p.growthRate3.toString()),
        p.calculationMethod,
      ].join(',') + '\n';
    }

    return csv;
  }

  /**
   * Générer un PDF de résumé
   */
  static async exportSummaryPDF(trendConfigId: string): Promise<Buffer> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    const [summaryByMinistry, summaryByPriority] = await Promise.all([
      TrendCalculationService.getSummaryByMinistry(trendConfigId),
      TrendCalculationService.getSummaryByPriority(trendConfigId),
    ]);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text('Budget Tendanciel - Résumé', { align: 'center' });
        doc.moveDown();

        // Configuration
        doc.fontSize(14).text('Configuration', { underline: true });
        doc.fontSize(10);
        doc.text(`Code: ${config.configCode}`);
        doc.text(`Nom: ${config.name}`);
        doc.text(`Année fiscale: ${config.fiscalYear}`);
        doc.text(`Période de référence: ${config.baselineStartYear} - ${config.baselineEndYear}`);
        doc.text(`Taux de croissance global: ${config.globalGrowthRate}%`);
        doc.text(`Statut: ${config.status}`);
        doc.moveDown();

        // Résumé par priorité
        doc.fontSize(14).text('Résumé par Priorité', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);

        for (const s of summaryByPriority) {
          const label = s.isPriority ? 'Ministères Prioritaires' : 'Ministères Non-Prioritaires';
          doc.text(`${label}:`, { continued: false });
          doc.text(`  Nombre de ministères: ${s.ministryCount}`);
          doc.text(`  Montant de base total: ${this.formatNumber(parseFloat(s.totalBase))}`);
          doc.text(`  N+1: ${this.formatNumber(parseFloat(s.totalN1))}`);
          doc.text(`  N+2: ${this.formatNumber(parseFloat(s.totalN2))}`);
          doc.text(`  N+3: ${this.formatNumber(parseFloat(s.totalN3))}`);
          doc.moveDown();
        }

        // Résumé par ministère
        doc.addPage();
        doc.fontSize(14).text('Résumé par Ministère', { underline: true });
        doc.fontSize(10);
        doc.moveDown(0.5);

        // Tableau
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 200;
        const col3 = 280;
        const col4 = 360;
        const col5 = 440;

        // En-têtes
        doc.font('Helvetica-Bold');
        doc.text('Ministère', col1, tableTop, { width: 140 });
        doc.text('Base', col2, tableTop, { width: 70, align: 'right' });
        doc.text('N+1', col3, tableTop, { width: 70, align: 'right' });
        doc.text('N+2', col4, tableTop, { width: 70, align: 'right' });
        doc.text('N+3', col5, tableTop, { width: 70, align: 'right' });
        doc.moveDown();

        // Lignes
        doc.font('Helvetica');
        for (const s of summaryByMinistry) {
          const y = doc.y;
          const ministryName =
            s.ministryName.length > 25 ? s.ministryName.substring(0, 22) + '...' : s.ministryName;

          doc.text(ministryName, col1, y, { width: 140 });
          doc.text(this.formatNumberShort(parseFloat(s.totalBase)), col2, y, {
            width: 70,
            align: 'right',
          });
          doc.text(this.formatNumberShort(parseFloat(s.totalN1)), col3, y, {
            width: 70,
            align: 'right',
          });
          doc.text(this.formatNumberShort(parseFloat(s.totalN2)), col4, y, {
            width: 70,
            align: 'right',
          });
          doc.text(this.formatNumberShort(parseFloat(s.totalN3)), col5, y, {
            width: 70,
            align: 'right',
          });
          doc.moveDown(0.5);

          // Nouvelle page si nécessaire
          if (doc.y > 700) {
            doc.addPage();
            doc.fontSize(10);
          }
        }

        // Pied de page
        doc.fontSize(8).text(
          `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
          50,
          750,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Générer un rapport comparatif
   */
  static async generateComparisonReport(trendConfigId: string): Promise<any> {
    const config = await prisma.trendBudgetConfig.findUnique({
      where: { id: trendConfigId },
    });

    if (!config) {
      throw new NotFoundError('Configuration non trouvée');
    }

    const [summaryByMinistry, summaryByPriority, coherence] = await Promise.all([
      TrendCalculationService.getSummaryByMinistry(trendConfigId),
      TrendCalculationService.getSummaryByPriority(trendConfigId),
      TrendCalculationService.validateCoherence(trendConfigId),
    ]);

    // Calculer totaux et variations
    const totals = summaryByMinistry.reduce(
      (acc: any, s: any) => ({
        base: acc.base + parseFloat(s.totalBase),
        n1: acc.n1 + parseFloat(s.totalN1),
        n2: acc.n2 + parseFloat(s.totalN2),
        n3: acc.n3 + parseFloat(s.totalN3),
      }),
      { base: 0, n1: 0, n2: 0, n3: 0 }
    );

    const variations = {
      n1: ((totals.n1 - totals.base) / totals.base) * 100,
      n2: ((totals.n2 - totals.base) / totals.base) * 100,
      n3: ((totals.n3 - totals.base) / totals.base) * 100,
    };

    return {
      config: {
        code: config.configCode,
        name: config.name,
        fiscalYear: config.fiscalYear,
        globalGrowthRate: parseFloat(config.globalGrowthRate.toString()),
        status: config.status,
      },
      totals,
      variations,
      summaryByMinistry,
      summaryByPriority,
      coherence,
      generatedAt: new Date(),
    };
  }

  // ============================================================================
  // Utilitaires
  // ============================================================================

  private static escapeCsv(value: string): string {
    if (!value) return '';
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private static formatNumber(num: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  }

  private static formatNumberShort(num: number): string {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }
}
