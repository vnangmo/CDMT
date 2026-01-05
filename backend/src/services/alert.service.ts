import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export type AlertType =
  | 'BUDGET_OVERRUN'
  | 'CEILING_EXCEEDED'
  | 'DEADLINE_APPROACHING'
  | 'VALIDATION_PENDING'
  | 'INCONSISTENCY'
  | 'TARGET_DEVIATION'
  | 'EXECUTION_LOW'
  | 'EXECUTION_HIGH'
  | 'MISSING_DATA'
  | 'CALCULATION_ERROR';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  ministryId?: string;
  ministryName?: string;
  value?: number;
  threshold?: number;
  deviation?: number;
  fiscalYear?: number;
  createdAt: Date;
  isRead: boolean;
  isResolved: boolean;
}

export interface AlertConfig {
  budgetOverrunThreshold: number; // Percentage (e.g., 100 = 100%)
  executionLowThreshold: number; // Percentage (e.g., 50 = 50%)
  executionHighThreshold: number; // Percentage (e.g., 110 = 110%)
  pendingDaysWarning: number; // Days
  pendingDaysCritical: number; // Days
  targetDeviationThreshold: number; // Percentage
}

const DEFAULT_CONFIG: AlertConfig = {
  budgetOverrunThreshold: 100,
  executionLowThreshold: 50,
  executionHighThreshold: 110,
  pendingDaysWarning: 5,
  pendingDaysCritical: 10,
  targetDeviationThreshold: 20,
};

export class AlertService {
  private static config: AlertConfig = DEFAULT_CONFIG;

  /**
   * Set alert configuration
   */
  static setConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get all active alerts
   */
  static async getAllAlerts(fiscalYear?: number): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const year = fiscalYear || new Date().getFullYear();

    // Run all alert checks in parallel
    const [
      budgetAlerts,
      pendingAlerts,
      inconsistencyAlerts,
      executionAlerts,
      ceilingAlerts,
    ] = await Promise.all([
      this.checkBudgetOverruns(year),
      this.checkPendingValidations(),
      this.checkInconsistencies(year),
      this.checkExecutionRates(year),
      this.checkCeilingExceeded(year),
    ]);

    alerts.push(
      ...budgetAlerts,
      ...pendingAlerts,
      ...inconsistencyAlerts,
      ...executionAlerts,
      ...ceilingAlerts
    );

    // Sort by severity and date
    const severityOrder: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };

    return alerts.sort((a, b) => {
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Get alerts summary
   */
  static async getAlertsSummary(fiscalYear?: number): Promise<{
    total: number;
    bySeverity: Record<AlertSeverity, number>;
    byType: Record<string, number>;
    criticalCount: number;
  }> {
    const alerts = await this.getAllAlerts(fiscalYear);

    const bySeverity: Record<AlertSeverity, number> = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    };

    const byType: Record<string, number> = {};

    alerts.forEach((alert) => {
      bySeverity[alert.severity]++;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    });

    return {
      total: alerts.length,
      bySeverity,
      byType,
      criticalCount: bySeverity.CRITICAL,
    };
  }

  /**
   * Check for budget overruns (measures exceeding allocated ceilings)
   */
  static async checkBudgetOverruns(fiscalYear: number): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get ministries with their ceilings and total measures
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      include: {
        ministerialCeilings: {
          where: { year: fiscalYear },
        },
        sectoralMeasures: {
          where: {
            status: { notIn: ['REJECTED', 'DRAFT'] },
          },
        },
      },
    });

    for (const ministry of ministries) {
      const ceiling = ministry.ministerialCeilings[0];
      if (!ceiling) continue;

      const totalMeasures = ministry.sectoralMeasures.reduce(
        (sum, m) => sum + Number(m.totalCostY1 || 0),
        0
      );

      const ceilingValue = Number(ceiling.ceiling);
      const percentage = ceilingValue > 0 ? (totalMeasures / ceilingValue) * 100 : 0;

      if (percentage > this.config.budgetOverrunThreshold) {
        const severity: AlertSeverity =
          percentage > 150 ? 'CRITICAL' : percentage > 120 ? 'HIGH' : 'MEDIUM';

        alerts.push({
          id: `budget-overrun-${ministry.id}-${fiscalYear}`,
          type: 'BUDGET_OVERRUN',
          severity,
          title: `Dépassement budgétaire - ${ministry.code}`,
          message: `Le total des mesures (${this.formatAmount(totalMeasures)}) dépasse le plafond alloué (${this.formatAmount(ceilingValue)}) de ${(percentage - 100).toFixed(1)}%`,
          entityType: 'Ministry',
          entityId: ministry.id,
          entityCode: ministry.code,
          ministryId: ministry.id,
          ministryName: ministry.name,
          value: totalMeasures,
          threshold: ceilingValue,
          deviation: percentage - 100,
          fiscalYear,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check for pending validations exceeding time thresholds
   */
  static async checkPendingValidations(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    const now = new Date();

    // Check sectoral measures
    const pendingMeasures = await prisma.sectoralMeasure.findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        submittedAt: { not: null },
      },
      include: {
        ministry: { select: { id: true, name: true, code: true } },
      },
    });

    for (const measure of pendingMeasures) {
      if (!measure.submittedAt) continue;

      const daysPending = Math.floor(
        (now.getTime() - measure.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPending >= this.config.pendingDaysWarning) {
        const severity: AlertSeverity =
          daysPending >= this.config.pendingDaysCritical ? 'HIGH' : 'MEDIUM';

        alerts.push({
          id: `pending-measure-${measure.id}`,
          type: 'VALIDATION_PENDING',
          severity,
          title: `Validation en attente - ${measure.measureCode}`,
          message: `La mesure sectorielle "${measure.name}" est en attente de validation depuis ${daysPending} jours`,
          entityType: 'SectoralMeasure',
          entityId: measure.id,
          entityCode: measure.measureCode,
          ministryId: measure.ministry?.id,
          ministryName: measure.ministry?.name,
          value: daysPending,
          threshold: this.config.pendingDaysWarning,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    // Check action plans
    const pendingPlans = await prisma.actionPlan.findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        submittedAt: { not: null },
      },
      include: {
        ministry: { select: { id: true, name: true, code: true } },
      },
    });

    for (const plan of pendingPlans) {
      if (!plan.submittedAt) continue;

      const daysPending = Math.floor(
        (now.getTime() - plan.submittedAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysPending >= this.config.pendingDaysWarning) {
        const severity: AlertSeverity =
          daysPending >= this.config.pendingDaysCritical ? 'HIGH' : 'MEDIUM';

        alerts.push({
          id: `pending-plan-${plan.id}`,
          type: 'VALIDATION_PENDING',
          severity,
          title: `Validation en attente - ${plan.planCode}`,
          message: `Le plan d'action "${plan.name}" est en attente de validation depuis ${daysPending} jours`,
          entityType: 'ActionPlan',
          entityId: plan.id,
          entityCode: plan.planCode,
          ministryId: plan.ministry?.id,
          ministryName: plan.ministry?.name,
          value: daysPending,
          threshold: this.config.pendingDaysWarning,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check for data inconsistencies
   */
  static async checkInconsistencies(fiscalYear: number): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check CDMT Global vs ministerial ceilings sum
    const scenarios = await prisma.cDMTGlobalScenario.findMany({
      where: {
        fiscalYear,
        status: { notIn: ['DRAFT', 'REJECTED'] },
      },
      include: {
        ministerialCeilings: true,
      },
    });

    for (const scenario of scenarios) {
      const ceilingsSum = scenario.ministerialCeilings.reduce(
        (sum, c) => sum + Number(c.ceiling),
        0
      );

      const declaredTotal = Number(scenario.totalCeilingY1);
      const difference = Math.abs(ceilingsSum - declaredTotal);
      const percentageDiff = declaredTotal > 0 ? (difference / declaredTotal) * 100 : 0;

      if (percentageDiff > 1) {
        // More than 1% difference
        alerts.push({
          id: `inconsistency-cdmt-${scenario.id}`,
          type: 'INCONSISTENCY',
          severity: percentageDiff > 5 ? 'HIGH' : 'MEDIUM',
          title: `Incohérence CDMT - ${scenario.scenarioCode}`,
          message: `La somme des plafonds ministériels (${this.formatAmount(ceilingsSum)}) diffère du total déclaré (${this.formatAmount(declaredTotal)}) de ${percentageDiff.toFixed(2)}%`,
          entityType: 'CDMTGlobalScenario',
          entityId: scenario.id,
          entityCode: scenario.scenarioCode,
          value: ceilingsSum,
          threshold: declaredTotal,
          deviation: percentageDiff,
          fiscalYear,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    // Check CBMT recettes vs dépenses balance
    const cbmtDocs = await prisma.cBMTDocument.findMany({
      where: {
        fiscalYear,
        status: { notIn: ['DRAFT', 'REJECTED'] },
      },
    });

    for (const doc of cbmtDocs) {
      const revenue = Number(doc.totalRevenueCeiling);
      const expense = Number(doc.totalExpenseCeiling);
      const deficit = Number(doc.fiscalDeficitCeiling || 0);

      const calculatedDeficit = revenue - expense;
      const deficitDiff = Math.abs(calculatedDeficit - deficit);

      if (deficitDiff > 1000000) {
        // More than 1M difference
        alerts.push({
          id: `inconsistency-cbmt-${doc.id}`,
          type: 'INCONSISTENCY',
          severity: 'MEDIUM',
          title: `Incohérence CBMT - ${doc.documentCode}`,
          message: `Le déficit déclaré (${this.formatAmount(deficit)}) ne correspond pas au calcul Recettes - Dépenses (${this.formatAmount(calculatedDeficit)})`,
          entityType: 'CBMTDocument',
          entityId: doc.id,
          entityCode: doc.documentCode,
          value: deficit,
          threshold: calculatedDeficit,
          fiscalYear,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check execution rates
   */
  static async checkExecutionRates(fiscalYear: number): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Get ministries with ceilings and executions
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      include: {
        ministerialCeilings: {
          where: { year: fiscalYear },
        },
        historicalBudgets: {
          where: {
            fiscalYear: fiscalYear,
          },
        },
      },
    });

    const currentMonth = new Date().getMonth() + 1;
    const expectedRate = (currentMonth / 12) * 100; // Linear expectation

    for (const ministry of ministries) {
      const ceiling = ministry.ministerialCeilings[0];
      if (!ceiling) continue;

      const totalExecution = ministry.historicalBudgets.reduce(
        (sum: number, h: any) => sum + Number(h.executedAmount || 0),
        0
      );

      const ceilingValue = Number(ceiling.ceiling);
      const actualRate = ceilingValue > 0 ? (totalExecution / ceilingValue) * 100 : 0;

      // Check for low execution
      if (actualRate < this.config.executionLowThreshold && currentMonth > 6) {
        alerts.push({
          id: `execution-low-${ministry.id}-${fiscalYear}`,
          type: 'EXECUTION_LOW',
          severity: actualRate < 30 ? 'HIGH' : 'MEDIUM',
          title: `Sous-exécution budgétaire - ${ministry.code}`,
          message: `Le taux d'exécution (${actualRate.toFixed(1)}%) est inférieur au seuil attendu (${expectedRate.toFixed(1)}%)`,
          entityType: 'Ministry',
          entityId: ministry.id,
          entityCode: ministry.code,
          ministryId: ministry.id,
          ministryName: ministry.name,
          value: actualRate,
          threshold: expectedRate,
          deviation: expectedRate - actualRate,
          fiscalYear,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }

      // Check for over-execution
      if (actualRate > this.config.executionHighThreshold) {
        alerts.push({
          id: `execution-high-${ministry.id}-${fiscalYear}`,
          type: 'EXECUTION_HIGH',
          severity: actualRate > 130 ? 'CRITICAL' : 'HIGH',
          title: `Sur-exécution budgétaire - ${ministry.code}`,
          message: `Le taux d'exécution (${actualRate.toFixed(1)}%) dépasse le plafond autorisé (${this.config.executionHighThreshold}%)`,
          entityType: 'Ministry',
          entityId: ministry.id,
          entityCode: ministry.code,
          ministryId: ministry.id,
          ministryName: ministry.name,
          value: actualRate,
          threshold: this.config.executionHighThreshold,
          deviation: actualRate - this.config.executionHighThreshold,
          fiscalYear,
          createdAt: new Date(),
          isRead: false,
          isResolved: false,
        });
      }
    }

    return alerts;
  }

  /**
   * Check if ceilings are exceeded
   */
  static async checkCeilingExceeded(fiscalYear: number): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Check CDMT Global scenarios against CBMT constraints
    const scenarios = await prisma.cDMTGlobalScenario.findMany({
      where: {
        fiscalYear,
        isActive: true,
      },
    });

    const cbmtDoc = await prisma.cBMTDocument.findFirst({
      where: {
        fiscalYear,
        scenarioType: 'BASE',
        status: { in: ['VALIDATED', 'APPROVED'] },
      },
    });

    if (cbmtDoc) {
      const cbmtExpenseCeiling = Number(cbmtDoc.totalExpenseCeiling);

      for (const scenario of scenarios) {
        const scenarioTotal = Number(scenario.totalCeilingY1);

        if (scenarioTotal > cbmtExpenseCeiling) {
          const excess = scenarioTotal - cbmtExpenseCeiling;
          const excessPercentage = (excess / cbmtExpenseCeiling) * 100;

          alerts.push({
            id: `ceiling-exceeded-${scenario.id}`,
            type: 'CEILING_EXCEEDED',
            severity: excessPercentage > 10 ? 'CRITICAL' : 'HIGH',
            title: `Plafond CBMT dépassé - ${scenario.scenarioCode}`,
            message: `Le total CDMT (${this.formatAmount(scenarioTotal)}) dépasse le plafond CBMT (${this.formatAmount(cbmtExpenseCeiling)}) de ${this.formatAmount(excess)} (${excessPercentage.toFixed(1)}%)`,
            entityType: 'CDMTGlobalScenario',
            entityId: scenario.id,
            entityCode: scenario.scenarioCode,
            value: scenarioTotal,
            threshold: cbmtExpenseCeiling,
            deviation: excessPercentage,
            fiscalYear,
            createdAt: new Date(),
            isRead: false,
            isResolved: false,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Format amount for display
   */
  private static formatAmount(amount: number): string {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(2)} Mrd DJF`;
    } else if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)} M DJF`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(2)} K DJF`;
    }
    return `${amount.toFixed(0)} DJF`;
  }

  /**
   * Get alerts for a specific ministry
   */
  static async getMinistryAlerts(ministryId: string, fiscalYear?: number): Promise<Alert[]> {
    const allAlerts = await this.getAllAlerts(fiscalYear);
    return allAlerts.filter((alert) => alert.ministryId === ministryId);
  }

  /**
   * Get alerts by type
   */
  static async getAlertsByType(type: AlertType, fiscalYear?: number): Promise<Alert[]> {
    const allAlerts = await this.getAllAlerts(fiscalYear);
    return allAlerts.filter((alert) => alert.type === type);
  }

  /**
   * Get critical alerts only
   */
  static async getCriticalAlerts(fiscalYear?: number): Promise<Alert[]> {
    const allAlerts = await this.getAllAlerts(fiscalYear);
    return allAlerts.filter((alert) => alert.severity === 'CRITICAL');
  }
}

export default AlertService;
