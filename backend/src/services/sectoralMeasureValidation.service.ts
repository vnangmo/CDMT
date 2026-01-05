import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { SectoralMeasureCostingService } from './sectoralMeasureCosting.service';

const prisma = new PrismaClient();

interface CeilingExceedance {
  ministryId: string;
  ministryName: string;
  year: number;
  ceiling: number;
  projectedAmount: number;
  exceedance: number;
  exceedancePercentage: number;
  severity: 'WARNING' | 'CRITICAL';
}

interface ValidationResult {
  isValid: boolean;
  hasExceedances: boolean;
  totalExceedances: number;
  exceedances: CeilingExceedance[];
  warnings: string[];
  errors: string[];
}

export class SectoralMeasureValidationService {
  /**
   * Valider les mesures sectorielles par rapport aux plafonds ministériels
   * Formule: totalSectoralY <= MinisterialCeiling.ceiling
   */
  static async validateMinisteryCeiling(
    ministryId: string,
    fiscalYear: number
  ): Promise<ValidationResult> {
    const exceedances: CeilingExceedance[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // Récupérer le ministère
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId },
      select: { name: true },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Récupérer les coûts agrégés des mesures sectorielles
    const aggregated = await SectoralMeasureCostingService.getMinistryAggregatedCosts(
      ministryId,
      fiscalYear
    );

    // Vérifier les plafonds pour les 3 années (N+1, N+2, N+3)
    const years = [fiscalYear + 1, fiscalYear + 2, fiscalYear + 3];
    const yearFields = ['totalCostY1', 'totalCostY2', 'totalCostY3'] as const;

    for (let i = 0; i < years.length; i++) {
      const year = years[i];
      const costField = yearFields[i];
      const projectedAmount = aggregated[costField];

      // Récupérer le plafond ministériel pour cette année
      const ceiling = await prisma.ministerialCeiling.findFirst({
        where: {
          ministryId,
          year,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!ceiling) {
        warnings.push(
          `Aucun plafond ministériel défini pour ${ministry.name} en ${year}`
        );
        continue;
      }

      const ceilingAmount = parseFloat(ceiling.ceiling.toString());

      // Vérifier si le montant projeté dépasse le plafond
      if (projectedAmount > ceilingAmount) {
        const exceedance = projectedAmount - ceilingAmount;
        const exceedancePercentage = (exceedance / ceilingAmount) * 100;

        exceedances.push({
          ministryId,
          ministryName: ministry.name,
          year,
          ceiling: ceilingAmount,
          projectedAmount,
          exceedance,
          exceedancePercentage,
          severity: exceedancePercentage > 10 ? 'CRITICAL' : 'WARNING',
        });
      }
    }

    return {
      isValid: exceedances.length === 0 && errors.length === 0,
      hasExceedances: exceedances.length > 0,
      totalExceedances: exceedances.length,
      exceedances,
      warnings,
      errors,
    };
  }

  /**
   * Vérifier les dépassements pour tous les ministères
   */
  static async checkAllMinisteryCeilings(
    fiscalYear: number
  ): Promise<ValidationResult> {
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const allExceedances: CeilingExceedance[] = [];
    const allWarnings: string[] = [];
    const allErrors: string[] = [];

    for (const ministry of ministries) {
      const result = await this.validateMinisteryCeiling(ministry.id, fiscalYear);
      allExceedances.push(...result.exceedances);
      allWarnings.push(...result.warnings);
      allErrors.push(...result.errors);
    }

    return {
      isValid: allExceedances.length === 0 && allErrors.length === 0,
      hasExceedances: allExceedances.length > 0,
      totalExceedances: allExceedances.length,
      exceedances: allExceedances,
      warnings: allWarnings,
      errors: allErrors,
    };
  }

  /**
   * Calculer la marge disponible pour un ministère
   */
  static async calculateAvailableMargin(
    ministryId: string,
    fiscalYear: number
  ): Promise<{
    ministryId: string;
    fiscalYear: number;
    year1: { ceiling: number; used: number; available: number; availablePercentage: number };
    year2: { ceiling: number; used: number; available: number; availablePercentage: number };
    year3: { ceiling: number; used: number; available: number; availablePercentage: number };
  }> {
    // Récupérer les coûts agrégés
    const aggregated = await SectoralMeasureCostingService.getMinistryAggregatedCosts(
      ministryId,
      fiscalYear
    );

    // Récupérer les plafonds
    const years = [fiscalYear + 1, fiscalYear + 2, fiscalYear + 3];
    const ceilings = await Promise.all(
      years.map((year) =>
        prisma.ministerialCeiling.findFirst({
          where: { ministryId, year },
          orderBy: { createdAt: 'desc' },
        })
      )
    );

    const calculateMargin = (ceiling: number, used: number) => {
      const available = ceiling - used;
      const availablePercentage = ceiling > 0 ? (available / ceiling) * 100 : 0;
      return { ceiling, used, available, availablePercentage };
    };

    return {
      ministryId,
      fiscalYear,
      year1: calculateMargin(
        ceilings[0] ? parseFloat(ceilings[0].ceiling.toString()) : 0,
        aggregated.totalCostY1
      ),
      year2: calculateMargin(
        ceilings[1] ? parseFloat(ceilings[1].ceiling.toString()) : 0,
        aggregated.totalCostY2
      ),
      year3: calculateMargin(
        ceilings[2] ? parseFloat(ceilings[2].ceiling.toString()) : 0,
        aggregated.totalCostY3
      ),
    };
  }

  /**
   * Valider la cohérence d'une mesure sectorielle individuelle
   */
  static async validateMeasureCoherence(measureId: string): Promise<{
    isValid: boolean;
    checks: Array<{ check: string; passed: boolean; message: string; severity: string }>;
  }> {
    const measure = await prisma.sectoralMeasure.findUnique({
      where: { id: measureId },
      include: {
        ministry: true,
        action: true,
        activity: true,
      },
    });

    if (!measure) {
      throw new NotFoundError('Mesure sectorielle non trouvée');
    }

    const checks: Array<{ check: string; passed: boolean; message: string; severity: string }> = [];

    // Vérification 1: Cohérence du calcul des coûts
    const q1 = parseFloat(measure.quantityY1.toString());
    const u1 = parseFloat(measure.unitCostY1.toString());
    const calculatedY1 = q1 * u1;
    const storedY1 = parseFloat(measure.totalCostY1.toString());

    checks.push({
      check: 'COST_CALCULATION_Y1',
      passed: Math.abs(calculatedY1 - storedY1) < 0.01,
      message:
        Math.abs(calculatedY1 - storedY1) < 0.01
          ? 'Calcul Y1 cohérent'
          : `Incohérence Y1: calculé=${calculatedY1}, stocké=${storedY1}`,
      severity: 'ERROR',
    });

    const q2 = parseFloat(measure.quantityY2.toString());
    const u2 = parseFloat(measure.unitCostY2.toString());
    const calculatedY2 = q2 * u2;
    const storedY2 = parseFloat(measure.totalCostY2.toString());

    checks.push({
      check: 'COST_CALCULATION_Y2',
      passed: Math.abs(calculatedY2 - storedY2) < 0.01,
      message:
        Math.abs(calculatedY2 - storedY2) < 0.01
          ? 'Calcul Y2 cohérent'
          : `Incohérence Y2: calculé=${calculatedY2}, stocké=${storedY2}`,
      severity: 'ERROR',
    });

    const q3 = parseFloat(measure.quantityY3.toString());
    const u3 = parseFloat(measure.unitCostY3.toString());
    const calculatedY3 = q3 * u3;
    const storedY3 = parseFloat(measure.totalCostY3.toString());

    checks.push({
      check: 'COST_CALCULATION_Y3',
      passed: Math.abs(calculatedY3 - storedY3) < 0.01,
      message:
        Math.abs(calculatedY3 - storedY3) < 0.01
          ? 'Calcul Y3 cohérent'
          : `Incohérence Y3: calculé=${calculatedY3}, stocké=${storedY3}`,
      severity: 'ERROR',
    });

    // Vérification 2: Cohérence du total
    const calculatedTotal = storedY1 + storedY2 + storedY3;
    const storedTotal = parseFloat(measure.totalCost.toString());

    checks.push({
      check: 'TOTAL_CALCULATION',
      passed: Math.abs(calculatedTotal - storedTotal) < 0.01,
      message:
        Math.abs(calculatedTotal - storedTotal) < 0.01
          ? 'Calcul du total cohérent'
          : `Incohérence total: calculé=${calculatedTotal}, stocké=${storedTotal}`,
      severity: 'ERROR',
    });

    // Vérification 3: Relation polymorphique cohérente
    const polymorphicCheck =
      (measure.entityType === 'ACTION' && measure.actionId !== null && measure.activityId === null) ||
      (measure.entityType === 'ACTIVITY' && measure.activityId !== null);

    checks.push({
      check: 'POLYMORPHIC_RELATION',
      passed: polymorphicCheck,
      message: polymorphicCheck
        ? 'Relation polymorphique cohérente'
        : `Incohérence: entityType=${measure.entityType}, actionId=${measure.actionId}, activityId=${measure.activityId}`,
      severity: 'ERROR',
    });

    // Vérification 4: Justification et impact
    checks.push({
      check: 'JUSTIFICATION',
      passed: !!measure.justification && measure.justification.length > 10,
      message: measure.justification
        ? 'Justification fournie'
        : 'Justification manquante ou insuffisante',
      severity: 'WARNING',
    });

    checks.push({
      check: 'EXPECTED_IMPACT',
      passed: !!measure.expectedImpact && measure.expectedImpact.length > 10,
      message: measure.expectedImpact
        ? 'Impact attendu fourni'
        : 'Impact attendu manquant ou insuffisant',
      severity: 'WARNING',
    });

    const failedCriticalChecks = checks.filter((c) => !c.passed && c.severity === 'ERROR');

    return {
      isValid: failedCriticalChecks.length === 0,
      checks,
    };
  }

  /**
   * Valider toutes les mesures d'un ministère
   */
  static async validateAllMinistryMeasures(
    ministryId: string,
    fiscalYear: number
  ): Promise<{
    isValid: boolean;
    totalMeasures: number;
    validMeasures: number;
    invalidMeasures: number;
    issues: Array<{ measureId: string; measureCode: string; checks: any[] }>;
  }> {
    const measures = await prisma.sectoralMeasure.findMany({
      where: { ministryId, fiscalYear },
      select: { id: true, measureCode: true },
    });

    const results = await Promise.all(
      measures.map(async (m) => {
        const validation = await this.validateMeasureCoherence(m.id);
        return {
          measureId: m.id,
          measureCode: m.measureCode,
          isValid: validation.isValid,
          checks: validation.checks.filter((c) => !c.passed),
        };
      })
    );

    const invalidMeasures = results.filter((r) => !r.isValid);

    return {
      isValid: invalidMeasures.length === 0,
      totalMeasures: results.length,
      validMeasures: results.length - invalidMeasures.length,
      invalidMeasures: invalidMeasures.length,
      issues: invalidMeasures,
    };
  }

  /**
   * Générer un rapport de validation complet
   */
  static async generateValidationReport(ministryId: string, fiscalYear: number) {
    const [ceilingValidation, marginAnalysis, coherenceValidation] = await Promise.all([
      this.validateMinisteryCeiling(ministryId, fiscalYear),
      this.calculateAvailableMargin(ministryId, fiscalYear),
      this.validateAllMinistryMeasures(ministryId, fiscalYear),
    ]);

    return {
      fiscalYear,
      ministryId,
      ceilingValidation,
      marginAnalysis,
      coherenceValidation,
      overallStatus:
        ceilingValidation.isValid && coherenceValidation.isValid ? 'VALID' : 'INVALID',
      generatedAt: new Date(),
    };
  }
}
