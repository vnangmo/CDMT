import prisma from '../config/database';
import { NotFoundError } from '../middleware/errorHandler';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';
import { PDFUtils } from '../utils/pdf.utils';
import { ExcelUtils } from '../utils/excel.utils';

export class ActionPlanExportService {
  /**
   * Generate PDF export for an Action Plan
   */
  static async generatePDF(id: string): Promise<Buffer> {
    const plan = await this.fetchActionPlanData(id);

    if (!plan) {
      throw new NotFoundError('Plan d\'action non trouvé');
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
        'Plan d\'Action',
        plan.planCode,
        plan.name
      );

      let currentY = doc.y + 20;

      // Section 1: General Information
      currentY = PDFUtils.addSectionHeader(doc, '1. Informations Générales', currentY);

      currentY = PDFUtils.addKeyValue(doc, 'Code', plan.planCode, currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Nom', plan.name, currentY);

      if (plan.description) {
        currentY = PDFUtils.addKeyValue(doc, 'Description', plan.description, currentY);
      }

      currentY = PDFUtils.addKeyValue(doc, 'Mesure Sectorielle', plan.sectoralMeasure?.name || 'N/A', currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Ministère', plan.ministry?.name || 'N/A', currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année Fiscale', plan.fiscalYear.toString(), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Statut', plan.status, currentY);

      if (plan.responsibleEntity) {
        currentY = PDFUtils.addKeyValue(doc, 'Entité Responsable', plan.responsibleEntity, currentY);
      }

      if (plan.coordinator) {
        currentY = PDFUtils.addKeyValue(doc, 'Coordinateur', plan.coordinator, currentY);
      }

      currentY += 10;

      // Section 2: Financial Summary
      currentY = PDFUtils.addPageIfNeeded(doc, currentY, 150);
      currentY = PDFUtils.addSectionHeader(doc, '2. Résumé Financier', currentY);

      const totalCost = this.formatDecimal(plan.totalCost);
      const totalY1 = this.formatDecimal(plan.totalCostY1);
      const totalY2 = this.formatDecimal(plan.totalCostY2);
      const totalY3 = this.formatDecimal(plan.totalCostY3);

      currentY = PDFUtils.addKeyValue(doc, 'Coût Total', PDFUtils.formatAmount(totalCost), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 1', PDFUtils.formatAmount(totalY1), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 2', PDFUtils.formatAmount(totalY2), currentY);
      currentY = PDFUtils.addKeyValue(doc, 'Année 3', PDFUtils.formatAmount(totalY3), currentY);

      if (plan.activities && plan.activities.length > 0) {
        currentY = PDFUtils.addKeyValue(doc, 'Nombre d\'Activités', plan.activities.length.toString(), currentY);
      }

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

      // Section 3: Timeline
      currentY = PDFUtils.addPageIfNeeded(doc, currentY, 100);
      currentY = PDFUtils.addSectionHeader(doc, '3. Calendrier', currentY);

      if (plan.startDate) {
        currentY = PDFUtils.addKeyValue(doc, 'Date de Début', PDFUtils.formatDate(plan.startDate), currentY);
      }

      if (plan.endDate) {
        currentY = PDFUtils.addKeyValue(doc, 'Date de Fin', PDFUtils.formatDate(plan.endDate), currentY);
      }

      if (plan.duration) {
        currentY = PDFUtils.addKeyValue(doc, 'Durée', `${plan.duration} mois`, currentY);
      }

      if (plan.progress) {
        currentY = PDFUtils.addKeyValue(doc, 'Progression', PDFUtils.formatPercentage(this.formatDecimal(plan.progress)), currentY);
      }

      currentY += 10;

      // Section 4: Objectives and Expected Results
      if (plan.objectives || plan.expectedResults) {
        currentY = PDFUtils.addPageIfNeeded(doc, currentY, 150);
        currentY = PDFUtils.addSectionHeader(doc, '4. Objectifs et Résultats Attendus', currentY);

        if (plan.objectives) {
          currentY += 10;

          doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#6b7280')
            .text('Objectifs:', 50, currentY);

          currentY += 15;

          doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(plan.objectives, 50, currentY, {
              width: doc.page.width - 100,
              align: 'justify'
            });

          currentY = doc.y + 10;
        }

        if (plan.expectedResults) {
          currentY = PDFUtils.addPageIfNeeded(doc, currentY, 60);
          currentY += 10;

          doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#6b7280')
            .text('Résultats Attendus:', 50, currentY);

          currentY += 15;

          doc.fontSize(9)
            .font('Helvetica')
            .fillColor('#000000')
            .text(plan.expectedResults, 50, currentY, {
              width: doc.page.width - 100,
              align: 'justify'
            });

          currentY = doc.y + 10;
        }
      }

      // Section 5: Activities Table
      if (plan.activities && plan.activities.length > 0) {
        currentY = PDFUtils.addPageIfNeeded(doc, currentY, 200);
        currentY = PDFUtils.addSectionHeader(doc, '5. Activités', currentY);

        const activityHeaders = ['Code', 'Nom', 'Coût (FDJ)', 'Début', 'Fin', 'Statut'];
        const activityRows: string[][] = [];

        plan.activities.forEach((activity: any) => {
          activityRows.push([
            activity.activityCode,
            activity.name.substring(0, 30) + (activity.name.length > 30 ? '...' : ''),
            PDFUtils.formatAmount(this.formatDecimal(activity.totalCost)),
            activity.plannedStartDate ? PDFUtils.formatDate(activity.plannedStartDate) : '',
            activity.plannedEndDate ? PDFUtils.formatDate(activity.plannedEndDate) : '',
            activity.status
          ]);
        });

        currentY = PDFUtils.addTable(
          doc,
          activityHeaders,
          activityRows,
          currentY,
          {
            colWidths: [60, 150, 100, 80, 80, 70],
            fontSize: 8,
            rowHeight: 18
          }
        );

        currentY += 20;
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
   * Generate Excel export for an Action Plan
   */
  static async generateExcel(id: string): Promise<Buffer> {
    const plan = await this.fetchActionPlanData(id);

    if (!plan) {
      throw new NotFoundError('Plan d\'action non trouvé');
    }

    const workbook = ExcelUtils.createWorkbook();

    // Sheet 1: Résumé
    const summaryData: Record<string, any> = {
      'Code': plan.planCode,
      'Nom': plan.name,
      'Description': plan.description || '',
      'Mesure Sectorielle': plan.sectoralMeasure?.name || '',
      'Ministère': plan.ministry?.name || '',
      'Année Fiscale': plan.fiscalYear,
      'Statut': plan.status,
      'Coût Total (FDJ)': ExcelUtils.formatAmount(this.formatDecimal(plan.totalCost)),
      'Date de Début': plan.startDate ? ExcelUtils.formatDate(plan.startDate) : '',
      'Date de Fin': plan.endDate ? ExcelUtils.formatDate(plan.endDate) : '',
      'Nombre d\'Activités': plan.activities?.length || 0
    };

    const summarySheet = ExcelUtils.createSummarySheet(summaryData, 'PLAN D\'ACTION');
    ExcelUtils.addWorksheet(workbook, summarySheet, 'Résumé');

    // Sheet 2: Plan d'Action (main data)
    const mainHeaders = ['Code', 'Nom', 'Mesure Sectorielle', 'Ministère', 'Coût Total', 'Date Début', 'Date Fin', 'Statut'];
    const mainRow = [
      plan.planCode,
      plan.name,
      plan.sectoralMeasure?.measureCode || '',
      plan.ministry?.name || '',
      this.formatDecimal(plan.totalCost),
      plan.startDate || '',
      plan.endDate || '',
      plan.status
    ];

    const mainSheet = ExcelUtils.createTable(mainHeaders, [mainRow], {
      title: 'Plan d\'Action',
      autoSize: true
    });
    ExcelUtils.addWorksheet(workbook, mainSheet, 'Plan d\'Action');

    // Sheet 3: Activités
    if (plan.activities && plan.activities.length > 0) {
      const activityHeaders = ['Code', 'Nom', 'Description', 'Coût (FDJ)', 'Début Prévu', 'Fin Prévue', 'Statut'];
      const activityRows = plan.activities.map((activity: any) => [
        activity.activityCode,
        activity.name,
        activity.description || '',
        this.formatDecimal(activity.totalCost),
        activity.plannedStartDate || '',
        activity.plannedEndDate || '',
        activity.status
      ]);

      const activitySheet = ExcelUtils.createTable(activityHeaders, activityRows, {
        title: 'Activités du Plan d\'Action',
        autoSize: true
      });
      ExcelUtils.addWorksheet(workbook, activitySheet, 'Activités');
    }

    // Sheet 4: Répartition Budgétaire
    const budgetSheet = ExcelUtils.createBudgetBreakdownSheet(
      this.formatDecimal(plan.totalCostY1),
      this.formatDecimal(plan.totalCostY2),
      this.formatDecimal(plan.totalCostY3)
    );
    ExcelUtils.addWorksheet(workbook, budgetSheet, 'Répartition Budgétaire');

    // Sheet 5: Chronogramme
    if (plan.activities && plan.activities.length > 0) {
      const activitiesWithDates = plan.activities
        .filter((a: any) => a.plannedStartDate && a.plannedEndDate)
        .map((activity: any) => ({
          code: activity.activityCode,
          title: activity.name,
          startDate: new Date(activity.plannedStartDate),
          endDate: new Date(activity.plannedEndDate)
        }));

      if (activitiesWithDates.length > 0) {
        const timelineSheet = ExcelUtils.createTimelineSheet(activitiesWithDates, plan.fiscalYear);
        ExcelUtils.addWorksheet(workbook, timelineSheet, 'Chronogramme');
      }
    }

    // Sheet 6: Objectifs et Résultats
    const objectivesData: any[][] = [
      ['Objectifs et Résultats Attendus'],
      []
    ];

    if (plan.objectives) {
      objectivesData.push(['Objectifs', plan.objectives]);
      objectivesData.push([]);
    }

    if (plan.expectedResults) {
      objectivesData.push(['Résultats Attendus', plan.expectedResults]);
      objectivesData.push([]);
    }

    if (plan.performanceIndicators) {
      objectivesData.push(['Indicateurs de Performance', JSON.stringify(plan.performanceIndicators)]);
      objectivesData.push([]);
    }

    if (plan.humanResources) {
      objectivesData.push(['Ressources Humaines', plan.humanResources]);
    }

    if (plan.technicalResources) {
      objectivesData.push(['Ressources Techniques', plan.technicalResources]);
    }

    if (plan.institutionalSupport) {
      objectivesData.push(['Appui Institutionnel', plan.institutionalSupport]);
    }

    const objectivesSheet = XLSX.utils.aoa_to_sheet(objectivesData);

    // Style title
    if (objectivesSheet['A1']) {
      objectivesSheet['A1'].s = {
        font: { bold: true, sz: 14 },
        alignment: { horizontal: 'left' }
      };
    }

    ExcelUtils.autoSizeColumns(objectivesSheet);
    ExcelUtils.addWorksheet(workbook, objectivesSheet, 'Objectifs');

    return ExcelUtils.workbookToBuffer(workbook);
  }

  /**
   * Generate CSV export for an Action Plan
   */
  static async generateCSV(id: string): Promise<Buffer> {
    const plan = await this.fetchActionPlanData(id);

    if (!plan) {
      throw new NotFoundError('Plan d\'action non trouvé');
    }

    const rows: string[][] = [
      ['Champ', 'Valeur'],
      ['Code', plan.planCode],
      ['Nom', plan.name],
      ['Description', plan.description || ''],
      ['Mesure Sectorielle', plan.sectoralMeasure?.name || ''],
      ['Ministère', plan.ministry?.name || ''],
      ['Année Fiscale', plan.fiscalYear.toString()],
      ['Statut', plan.status],
      ['Entité Responsable', plan.responsibleEntity || ''],
      ['Coordinateur', plan.coordinator || ''],
      [],
      ['CALENDRIER'],
      ['Date de Début', plan.startDate ? ExcelUtils.formatDate(plan.startDate) : ''],
      ['Date de Fin', plan.endDate ? ExcelUtils.formatDate(plan.endDate) : ''],
      ['Durée (mois)', plan.duration?.toString() || ''],
      ['Progression (%)', plan.progress ? this.formatDecimal(plan.progress).toString() : ''],
      [],
      ['COÛTS'],
      ['Coût Total (FDJ)', this.formatDecimal(plan.totalCost).toString()],
      ['Coût Année 1 (FDJ)', this.formatDecimal(plan.totalCostY1).toString()],
      ['Coût Année 2 (FDJ)', this.formatDecimal(plan.totalCostY2).toString()],
      ['Coût Année 3 (FDJ)', this.formatDecimal(plan.totalCostY3).toString()],
      [],
      ['OBJECTIFS'],
      ['Objectifs', plan.objectives || ''],
      ['Résultats Attendus', plan.expectedResults || ''],
      [],
      ['RESSOURCES'],
      ['Ressources Humaines', plan.humanResources || ''],
      ['Ressources Techniques', plan.technicalResources || ''],
      ['Appui Institutionnel', plan.institutionalSupport || ''],
      []
    ];

    // Add activities
    if (plan.activities && plan.activities.length > 0) {
      rows.push(['ACTIVITÉS']);
      rows.push(['Code', 'Nom', 'Description', 'Coût (FDJ)', 'Début', 'Fin', 'Statut']);

      plan.activities.forEach((activity: any) => {
        rows.push([
          activity.activityCode,
          activity.name,
          activity.description || '',
          this.formatDecimal(activity.totalCost).toString(),
          activity.plannedStartDate ? ExcelUtils.formatDate(activity.plannedStartDate) : '',
          activity.plannedEndDate ? ExcelUtils.formatDate(activity.plannedEndDate) : '',
          activity.status
        ]);
      });
    }

    const csv = rows
      .map(row => row.map(cell => this.escapeCsvCell(cell)).join(','))
      .join('\n');

    return Buffer.from(csv, 'utf-8');
  }

  /**
   * Fetch action plan data with all relations
   */
  private static async fetchActionPlanData(id: string) {
    return await prisma.actionPlan.findUnique({
      where: { id },
      include: {
        sectoralMeasure: {
          select: {
            id: true,
            measureCode: true,
            name: true
          }
        },
        ministry: {
          select: {
            id: true,
            code: true,
            name: true
          }
        },
        activities: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            activityCode: true,
            name: true,
            description: true,
            plannedStartDate: true,
            plannedEndDate: true,
            actualStartDate: true,
            actualEndDate: true,
            totalCostY1: true,
            totalCostY2: true,
            totalCostY3: true,
            totalCost: true,
            status: true,
            progress: true,
            assignedTo: true
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

export default ActionPlanExportService;
