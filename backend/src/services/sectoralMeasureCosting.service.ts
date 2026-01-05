import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class SectoralMeasureCostingService {
  /**
   * Recalculer les coûts d'une mesure sectorielle
   * Formule: totalCostY = quantityY × unitCostY
   */
  static async recalculateMeasureCosts(measureId: string) {
    const measure = await prisma.sectoralMeasure.findUnique({
      where: { id: measureId },
    });

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    const q1 = parseFloat(measure.quantityY1.toString());
    const u1 = parseFloat(measure.unitCostY1.toString());
    const q2 = parseFloat(measure.quantityY2.toString());
    const u2 = parseFloat(measure.unitCostY2.toString());
    const q3 = parseFloat(measure.quantityY3.toString());
    const u3 = parseFloat(measure.unitCostY3.toString());

    const totalCostY1 = q1 * u1;
    const totalCostY2 = q2 * u2;
    const totalCostY3 = q3 * u3;
    const totalCost = totalCostY1 + totalCostY2 + totalCostY3;

    return await prisma.sectoralMeasure.update({
      where: { id: measureId },
      data: {
        totalCostY1,
        totalCostY2,
        totalCostY3,
        totalCost,
      },
    });
  }

  /**
   * Recalculer les coûts de toutes les mesures d'un ministère
   */
  static async recalculateMinistryMeasures(ministryId: string) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: { ministryId },
    });

    const results = await Promise.all(
      measures.map((m) => this.recalculateMeasureCosts(m.id))
    );

    return {
      ministryId,
      measuresRecalculated: results.length,
    };
  }

  /**
   * Obtenir le coût total agrégé par ministère
   */
  static async getMinistryAggregatedCosts(ministryId: string, fiscalYear: number) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
    });

    const aggregated = measures.reduce(
      (acc, m) => {
        acc.totalCostY1 += parseFloat(m.totalCostY1.toString());
        acc.totalCostY2 += parseFloat(m.totalCostY2.toString());
        acc.totalCostY3 += parseFloat(m.totalCostY3.toString());
        acc.totalCost += parseFloat(m.totalCost.toString());
        acc.measureCount++;
        return acc;
      },
      {
        ministryId,
        fiscalYear,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        measureCount: 0,
      }
    );

    return aggregated;
  }

  /**
   * Obtenir le coût total agrégé par programme
   */
  static async getProgramAggregatedCosts(programId: string, fiscalYear: number) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        programId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
    });

    const aggregated = measures.reduce(
      (acc, m) => {
        acc.totalCostY1 += parseFloat(m.totalCostY1.toString());
        acc.totalCostY2 += parseFloat(m.totalCostY2.toString());
        acc.totalCostY3 += parseFloat(m.totalCostY3.toString());
        acc.totalCost += parseFloat(m.totalCost.toString());
        acc.measureCount++;
        return acc;
      },
      {
        programId,
        fiscalYear,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        measureCount: 0,
      }
    );

    return aggregated;
  }

  /**
   * Obtenir le coût total agrégé par action
   */
  static async getActionAggregatedCosts(actionId: string, fiscalYear: number) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        actionId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
    });

    const aggregated = measures.reduce(
      (acc, m) => {
        acc.totalCostY1 += parseFloat(m.totalCostY1.toString());
        acc.totalCostY2 += parseFloat(m.totalCostY2.toString());
        acc.totalCostY3 += parseFloat(m.totalCostY3.toString());
        acc.totalCost += parseFloat(m.totalCost.toString());
        acc.measureCount++;
        return acc;
      },
      {
        actionId,
        fiscalYear,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        measureCount: 0,
      }
    );

    return aggregated;
  }

  /**
   * Obtenir le coût total agrégé par activité
   */
  static async getActivityAggregatedCosts(activityId: string, fiscalYear: number) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        activityId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
    });

    const aggregated = measures.reduce(
      (acc, m) => {
        acc.totalCostY1 += parseFloat(m.totalCostY1.toString());
        acc.totalCostY2 += parseFloat(m.totalCostY2.toString());
        acc.totalCostY3 += parseFloat(m.totalCostY3.toString());
        acc.totalCost += parseFloat(m.totalCost.toString());
        acc.measureCount++;
        return acc;
      },
      {
        activityId,
        fiscalYear,
        totalCostY1: 0,
        totalCostY2: 0,
        totalCostY3: 0,
        totalCost: 0,
        measureCount: 0,
      }
    );

    return aggregated;
  }

  /**
   * Obtenir une ventilation détaillée des coûts par nature économique
   */
  static async getCostBreakdownByEconomicNature(
    ministryId: string,
    fiscalYear: number
  ) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
      include: {
        economicNature: { select: { code: true, name: true } },
      },
    });

    // Grouper par nature économique
    const breakdown = measures.reduce((acc: any, m) => {
      const key = m.economicNatureId || 'NON_CLASSE';
      const name = m.economicNature?.name || 'Non classé';
      const code = m.economicNature?.code || '-';

      if (!acc[key]) {
        acc[key] = {
          economicNatureId: key,
          economicNatureCode: code,
          economicNatureName: name,
          totalCostY1: 0,
          totalCostY2: 0,
          totalCostY3: 0,
          totalCost: 0,
          measureCount: 0,
        };
      }

      acc[key].totalCostY1 += parseFloat(m.totalCostY1.toString());
      acc[key].totalCostY2 += parseFloat(m.totalCostY2.toString());
      acc[key].totalCostY3 += parseFloat(m.totalCostY3.toString());
      acc[key].totalCost += parseFloat(m.totalCost.toString());
      acc[key].measureCount++;

      return acc;
    }, {});

    return Object.values(breakdown);
  }

  /**
   * Obtenir une ventilation détaillée des coûts par source de financement
   */
  static async getCostBreakdownByFundingSource(
    ministryId: string,
    fiscalYear: number
  ) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
      include: {
        fundingSource: { select: { code: true, name: true } },
      },
    });

    // Grouper par source de financement
    const breakdown = measures.reduce((acc: any, m) => {
      const key = m.fundingSourceId || 'NON_CLASSE';
      const name = m.fundingSource?.name || 'Non classé';
      const code = m.fundingSource?.code || '-';

      if (!acc[key]) {
        acc[key] = {
          fundingSourceId: key,
          fundingSourceCode: code,
          fundingSourceName: name,
          totalCostY1: 0,
          totalCostY2: 0,
          totalCostY3: 0,
          totalCost: 0,
          measureCount: 0,
        };
      }

      acc[key].totalCostY1 += parseFloat(m.totalCostY1.toString());
      acc[key].totalCostY2 += parseFloat(m.totalCostY2.toString());
      acc[key].totalCostY3 += parseFloat(m.totalCostY3.toString());
      acc[key].totalCost += parseFloat(m.totalCost.toString());
      acc[key].measureCount++;

      return acc;
    }, {});

    return Object.values(breakdown);
  }

  /**
   * Obtenir une ventilation détaillée des coûts par catégorie
   */
  static async getCostBreakdownByCategory(
    ministryId: string,
    fiscalYear: number
  ) {
    const measures = await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED'] },
      },
    });

    // Grouper par catégorie
    const breakdown = measures.reduce((acc: any, m) => {
      const key = m.category || 'NON_CATEGORISE';

      if (!acc[key]) {
        acc[key] = {
          category: key,
          totalCostY1: 0,
          totalCostY2: 0,
          totalCostY3: 0,
          totalCost: 0,
          measureCount: 0,
        };
      }

      acc[key].totalCostY1 += parseFloat(m.totalCostY1.toString());
      acc[key].totalCostY2 += parseFloat(m.totalCostY2.toString());
      acc[key].totalCostY3 += parseFloat(m.totalCostY3.toString());
      acc[key].totalCost += parseFloat(m.totalCost.toString());
      acc[key].measureCount++;

      return acc;
    }, {});

    return Object.values(breakdown);
  }

  /**
   * Calculer l'évolution des coûts année par année
   */
  static async calculateYearOverYearGrowth(ministryId: string, fiscalYear: number) {
    const aggregated = await this.getMinistryAggregatedCosts(ministryId, fiscalYear);

    const y1 = aggregated.totalCostY1;
    const y2 = aggregated.totalCostY2;
    const y3 = aggregated.totalCostY3;

    const growthY1ToY2 = y1 > 0 ? ((y2 - y1) / y1) * 100 : 0;
    const growthY2ToY3 = y2 > 0 ? ((y3 - y2) / y2) * 100 : 0;
    const averageGrowth = (growthY1ToY2 + growthY2ToY3) / 2;

    return {
      ministryId,
      fiscalYear,
      year1: y1,
      year2: y2,
      year3: y3,
      growthY1ToY2: Math.round(growthY1ToY2 * 100) / 100,
      growthY2ToY3: Math.round(growthY2ToY3 * 100) / 100,
      averageGrowth: Math.round(averageGrowth * 100) / 100,
    };
  }

  /**
   * Obtenir un rapport de synthèse complet des coûts
   */
  static async getComprehensiveCostReport(ministryId: string, fiscalYear: number) {
    const [
      aggregated,
      byEconomicNature,
      byFundingSource,
      byCategory,
      yearOverYear,
    ] = await Promise.all([
      this.getMinistryAggregatedCosts(ministryId, fiscalYear),
      this.getCostBreakdownByEconomicNature(ministryId, fiscalYear),
      this.getCostBreakdownByFundingSource(ministryId, fiscalYear),
      this.getCostBreakdownByCategory(ministryId, fiscalYear),
      this.calculateYearOverYearGrowth(ministryId, fiscalYear),
    ]);

    return {
      summary: aggregated,
      breakdownByEconomicNature: byEconomicNature,
      breakdownByFundingSource: byFundingSource,
      breakdownByCategory: byCategory,
      yearOverYearGrowth: yearOverYear,
    };
  }
}
