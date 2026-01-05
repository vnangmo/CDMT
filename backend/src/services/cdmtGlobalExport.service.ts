import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class CDMTGlobalExportService {
  /**
   * Exporter un scénario vers Excel
   */
  static async exportToExcel(scenarioId: string): Promise<Buffer> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        macroFramework: true,
        trendConfig: true,
        policyMeasures: {
          include: { ministry: true },
          orderBy: { ministry: { name: 'asc' } },
        },
        marginAllocations: {
          include: { ministry: true },
          orderBy: { ministry: { name: 'asc' } },
        },
        ministerialCeilings: {
          include: { ministry: true },
          orderBy: [{ ministry: { name: 'asc' } }, { year: 'asc' }],
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    const wb = XLSX.utils.book_new();

    // Feuille 1: Vue d'ensemble du scénario
    const overviewData = [
      ['CDMT GLOBAL - VUE D\'ENSEMBLE'],
      [],
      ['Code Scénario', scenario.scenarioCode],
      ['Nom', scenario.name],
      ['Description', scenario.description || ''],
      ['Année Fiscale', scenario.fiscalYear],
      ['Statut', scenario.status],
      ['Actif', scenario.isActive ? 'Oui' : 'Non'],
      [],
      ['MARGE FISCALE DISPONIBLE'],
      ['Année ' + (scenario.fiscalYear + 1), parseFloat(scenario.fiscalMarginY1.toString())],
      ['Année ' + (scenario.fiscalYear + 2), parseFloat(scenario.fiscalMarginY2.toString())],
      ['Année ' + (scenario.fiscalYear + 3), parseFloat(scenario.fiscalMarginY3.toString())],
      [],
      ['TOTAUX CALCULÉS'],
      ['', 'Année ' + (scenario.fiscalYear + 1), 'Année ' + (scenario.fiscalYear + 2), 'Année ' + (scenario.fiscalYear + 3)],
      ['Total Baseline', parseFloat(scenario.totalBaselineY1.toString()), parseFloat(scenario.totalBaselineY2.toString()), parseFloat(scenario.totalBaselineY3.toString())],
      ['Total Mesures Nouvelles', parseFloat(scenario.totalMeasuresY1.toString()), parseFloat(scenario.totalMeasuresY2.toString()), parseFloat(scenario.totalMeasuresY3.toString())],
      ['Total Marge Allouée', parseFloat(scenario.totalAllocatedY1.toString()), parseFloat(scenario.totalAllocatedY2.toString()), parseFloat(scenario.totalAllocatedY3.toString())],
      ['Total Plafonds', parseFloat(scenario.totalCeilingY1.toString()), parseFloat(scenario.totalCeilingY2.toString()), parseFloat(scenario.totalCeilingY3.toString())],
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Vue d\'ensemble');

    // Feuille 2: Plafonds ministériels
    const ceilingsData = [
      [
        'Ministère Code',
        'Ministère',
        'Année',
        'Baseline',
        'Mesures Nouvelles',
        'Marge Allouée',
        'Plafond Total',
        'Date de Calcul',
        'Notes',
      ],
    ];

    for (const ceiling of scenario.ministerialCeilings) {
      ceilingsData.push([
        ceiling.ministry.code,
        ceiling.ministry.name,
        String(ceiling.year),
        String(parseFloat(ceiling.baseline.toString())),
        String(parseFloat(ceiling.newMeasures.toString())),
        String(parseFloat(ceiling.allocatedSpace.toString())),
        String(parseFloat(ceiling.ceiling.toString())),
        ceiling.calculatedAt ? ceiling.calculatedAt.toISOString() : '',
        ceiling.notes || '',
      ]);
    }

    const ws2 = XLSX.utils.aoa_to_sheet(ceilingsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Plafonds Ministériels');

    // Feuille 3: Mesures nouvelles
    const measuresData = [
      [
        'Ministère Code',
        'Ministère',
        'Code Mesure',
        'Nom Mesure',
        'Catégorie',
        'Description',
        'Montant Y1',
        'Montant Y2',
        'Montant Y3',
        'Justification',
        'Source',
      ],
    ];

    for (const measure of scenario.policyMeasures) {
      measuresData.push([
        measure.ministry.code,
        measure.ministry.name,
        measure.measureCode || '',
        measure.measureName,
        measure.category || '',
        measure.description || '',
        String(parseFloat(measure.amountY1.toString())),
        String(parseFloat(measure.amountY2.toString())),
        String(parseFloat(measure.amountY3.toString())),
        measure.justification || '',
        measure.source || '',
      ]);
    }

    const ws3 = XLSX.utils.aoa_to_sheet(measuresData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Mesures Nouvelles');

    // Feuille 4: Allocation de la marge
    const allocationsData = [
      [
        'Ministère Code',
        'Ministère',
        'Allocation Y1',
        'Allocation Y2',
        'Allocation Y3',
        'Méthode',
        'Notes',
      ],
    ];

    for (const allocation of scenario.marginAllocations) {
      allocationsData.push([
        allocation.ministry.code,
        allocation.ministry.name,
        String(parseFloat(allocation.allocatedY1.toString())),
        String(parseFloat(allocation.allocatedY2.toString())),
        String(parseFloat(allocation.allocatedY3.toString())),
        allocation.allocationMethod || '',
        allocation.notes || '',
      ]);
    }

    const ws4 = XLSX.utils.aoa_to_sheet(allocationsData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Allocation Marge');

    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Exporter un scénario vers CSV
   */
  static async exportToCSV(scenarioId: string): Promise<string> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: {
          include: { ministry: true },
          orderBy: [{ ministry: { name: 'asc' } }, { year: 'asc' }],
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    const headers = [
      'Ministère Code',
      'Ministère',
      'Année',
      'Baseline',
      'Mesures Nouvelles',
      'Marge Allouée',
      'Plafond Total',
    ].join(',');

    const rows = scenario.ministerialCeilings.map((ceiling) =>
      [
        ceiling.ministry.code,
        `"${ceiling.ministry.name}"`,
        ceiling.year,
        parseFloat(ceiling.baseline.toString()),
        parseFloat(ceiling.newMeasures.toString()),
        parseFloat(ceiling.allocatedSpace.toString()),
        parseFloat(ceiling.ceiling.toString()),
      ].join(',')
    );

    return [headers, ...rows].join('\n');
  }

  /**
   * Exporter un résumé PDF
   */
  static async exportSummaryPDF(scenarioId: string): Promise<Buffer> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        macroFramework: true,
        ministerialCeilings: {
          include: { ministry: true },
          orderBy: [{ ministry: { name: 'asc' } }, { year: 'asc' }],
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Page de garde
      doc.fontSize(24).text('CDMT GLOBAL', { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text('Résumé Exécutif', { align: 'center' });
      doc.moveDown(2);

      // Informations du scénario
      doc.fontSize(14).text(`Scénario: ${scenario.name}`, { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Code: ${scenario.scenarioCode}`);
      doc.text(`Année Fiscale: ${scenario.fiscalYear}`);
      doc.text(`Statut: ${scenario.status}`);
      doc.text(`Description: ${scenario.description || 'N/A'}`);
      doc.moveDown(2);

      // Marge fiscale
      doc.fontSize(14).text('Marge Fiscale Disponible', { underline: true });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Année ${scenario.fiscalYear + 1}: ${parseFloat(scenario.fiscalMarginY1.toString()).toLocaleString()} FCFA`);
      doc.text(`Année ${scenario.fiscalYear + 2}: ${parseFloat(scenario.fiscalMarginY2.toString()).toLocaleString()} FCFA`);
      doc.text(`Année ${scenario.fiscalYear + 3}: ${parseFloat(scenario.fiscalMarginY3.toString()).toLocaleString()} FCFA`);
      doc.moveDown(2);

      // Totaux
      doc.fontSize(14).text('Totaux Calculés', { underline: true });
      doc.moveDown();
      doc.fontSize(10);

      const totalsTable = [
        ['', `Y${scenario.fiscalYear + 1}`, `Y${scenario.fiscalYear + 2}`, `Y${scenario.fiscalYear + 3}`],
        ['Baseline', parseFloat(scenario.totalBaselineY1.toString()).toLocaleString(), parseFloat(scenario.totalBaselineY2.toString()).toLocaleString(), parseFloat(scenario.totalBaselineY3.toString()).toLocaleString()],
        ['Mesures', parseFloat(scenario.totalMeasuresY1.toString()).toLocaleString(), parseFloat(scenario.totalMeasuresY2.toString()).toLocaleString(), parseFloat(scenario.totalMeasuresY3.toString()).toLocaleString()],
        ['Marge Allouée', parseFloat(scenario.totalAllocatedY1.toString()).toLocaleString(), parseFloat(scenario.totalAllocatedY2.toString()).toLocaleString(), parseFloat(scenario.totalAllocatedY3.toString()).toLocaleString()],
        ['Plafonds', parseFloat(scenario.totalCeilingY1.toString()).toLocaleString(), parseFloat(scenario.totalCeilingY2.toString()).toLocaleString(), parseFloat(scenario.totalCeilingY3.toString()).toLocaleString()],
      ];

      totalsTable.forEach((row) => {
        doc.text(row.join('   |   '));
      });

      doc.addPage();

      // Plafonds ministériels
      doc.fontSize(14).text('Plafonds Ministériels', { underline: true });
      doc.moveDown();
      doc.fontSize(9);

      const ministries = Array.from(new Set(scenario.ministerialCeilings.map((c) => c.ministryId)));

      for (const ministryId of ministries) {
        const ministryCeilings = scenario.ministerialCeilings.filter((c) => c.ministryId === ministryId);
        const ministry = ministryCeilings[0]?.ministry;

        if (ministry) {
          doc.fontSize(11).text(`${ministry.name}`, { underline: true });
          doc.fontSize(9);

          ministryCeilings.forEach((ceiling) => {
            doc.text(`  Année ${ceiling.year}: ${parseFloat(ceiling.ceiling.toString()).toLocaleString()} FCFA`);
          });

          doc.moveDown();
        }
      }

      // Pied de page
      doc.fontSize(8).text(
        `Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();
    });
  }

  /**
   * Générer un rapport comparatif (Excel)
   */
  static async generateComparisonReport(scenarioId: string): Promise<any> {
    const scenario = await prisma.cDMTGlobalScenario.findUnique({
      where: { id: scenarioId },
      include: {
        ministerialCeilings: {
          include: { ministry: true },
        },
        policyMeasures: {
          include: { ministry: true },
        },
        marginAllocations: {
          include: { ministry: true },
        },
      },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario CDMT Global non trouvé');
    }

    // Grouper par ministère
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    const report: any = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      fiscalYear: scenario.fiscalYear,
      ministries: [],
    };

    for (const ministry of ministries) {
      const ceilings = scenario.ministerialCeilings.filter((c) => c.ministryId === ministry.id);
      const measures = scenario.policyMeasures.filter((m) => m.ministryId === ministry.id);
      const allocation = scenario.marginAllocations.find((a) => a.ministryId === ministry.id);

      if (ceilings.length > 0) {
        report.ministries.push({
          ministryCode: ministry.code,
          ministryName: ministry.name,
          ceilings: ceilings.map((c) => ({
            year: c.year,
            baseline: parseFloat(c.baseline.toString()),
            newMeasures: parseFloat(c.newMeasures.toString()),
            allocatedSpace: parseFloat(c.allocatedSpace.toString()),
            ceiling: parseFloat(c.ceiling.toString()),
          })),
          totalMeasures: measures.length,
          allocation: allocation
            ? {
                y1: parseFloat(allocation.allocatedY1.toString()),
                y2: parseFloat(allocation.allocatedY2.toString()),
                y3: parseFloat(allocation.allocatedY3.toString()),
              }
            : null,
        });
      }
    }

    return report;
  }
}
