import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface DashboardStats {
  sectoralMeasures: {
    total: number;
    byStatus: Record<string, number>;
    changeFromLastMonth: number;
  };
  actionPlans: {
    total: number;
    byStatus: Record<string, number>;
    changeFromLastMonth: number;
  };
  pendingValidations: {
    total: number;
    byDocumentType: Record<string, number>;
    oldestPendingDays: number;
  };
  budget: {
    totalAllocated: number;
    totalExecuted: number;
    executionRate: number;
    byMinistry: Array<{
      ministryId: string;
      ministryName: string;
      allocated: number;
      executed: number;
      rate: number;
    }>;
  };
}

interface DashboardAlert {
  id: string;
  type: 'BUDGET_OVERRUN' | 'DEADLINE_APPROACHING' | 'VALIDATION_PENDING' | 'INCONSISTENCY' | 'TARGET_DEVIATION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  value?: number;
  threshold?: number;
  createdAt: Date;
}

interface RecentActivity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityCode?: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: Date;
  status?: string;
}

interface BudgetTrend {
  period: string;
  year: number;
  month: number;
  allocated: number;
  executed: number;
  rate: number;
}

interface MinistryComparison {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  ceilingY1: number;
  ceilingY2: number;
  ceilingY3: number;
  measuresCount: number;
  totalMeasuresAmount: number;
  executionRate: number;
}

export class DashboardService {
  /**
   * Get main dashboard statistics
   */
  static async getStats(fiscalYear?: number): Promise<DashboardStats> {
    const currentYear = fiscalYear || new Date().getFullYear();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get sectoral measures stats
    const [
      sectoralMeasuresTotal,
      sectoralMeasuresByStatus,
      sectoralMeasuresLastMonth,
      actionPlansTotal,
      actionPlansByStatus,
      actionPlansLastMonth,
    ] = await Promise.all([
      prisma.sectoralMeasure.count(),
      prisma.sectoralMeasure.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.sectoralMeasure.count({
        where: { createdAt: { lt: lastMonth } },
      }),
      prisma.actionPlan.count(),
      prisma.actionPlan.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.actionPlan.count({
        where: { createdAt: { lt: lastMonth } },
      }),
    ]);

    // Get pending validations
    const pendingDocs = await this.getPendingValidations();

    // Get budget stats
    const budgetStats = await this.getBudgetStats(currentYear);

    // Convert status arrays to records
    const sectoralStatusRecord: Record<string, number> = {};
    sectoralMeasuresByStatus.forEach((s) => {
      sectoralStatusRecord[s.status] = s._count.status;
    });

    const actionPlanStatusRecord: Record<string, number> = {};
    actionPlansByStatus.forEach((s) => {
      actionPlanStatusRecord[s.status] = s._count.status;
    });

    return {
      sectoralMeasures: {
        total: sectoralMeasuresTotal,
        byStatus: sectoralStatusRecord,
        changeFromLastMonth: sectoralMeasuresTotal - sectoralMeasuresLastMonth,
      },
      actionPlans: {
        total: actionPlansTotal,
        byStatus: actionPlanStatusRecord,
        changeFromLastMonth: actionPlansTotal - actionPlansLastMonth,
      },
      pendingValidations: pendingDocs,
      budget: budgetStats,
    };
  }

  /**
   * Get pending validations across all document types
   */
  static async getPendingValidations(): Promise<{
    total: number;
    byDocumentType: Record<string, number>;
    oldestPendingDays: number;
  }> {
    const pendingStatuses = ['SUBMITTED', 'UNDER_REVIEW'];

    const [
      sectoralMeasures,
      actionPlans,
      macroFrameworks,
      cbmtDocuments,
      cdmtScenarios,
    ] = await Promise.all([
      prisma.sectoralMeasure.findMany({
        where: { status: { in: pendingStatuses } },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.actionPlan.findMany({
        where: { status: { in: pendingStatuses } },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.macroFramework.findMany({
        where: { status: { in: pendingStatuses } },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.cBMTDocument.findMany({
        where: { status: { in: pendingStatuses } },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
      prisma.cDMTGlobalScenario.findMany({
        where: { status: { in: pendingStatuses } },
        select: { submittedAt: true },
        orderBy: { submittedAt: 'asc' },
      }),
    ]);

    const byDocumentType: Record<string, number> = {
      SectoralMeasure: sectoralMeasures.length,
      ActionPlan: actionPlans.length,
      MacroFramework: macroFrameworks.length,
      CBMTDocument: cbmtDocuments.length,
      CDMTGlobalScenario: cdmtScenarios.length,
    };

    const total = Object.values(byDocumentType).reduce((a, b) => a + b, 0);

    // Find oldest pending document
    const allSubmittedDates = [
      ...sectoralMeasures.map((d) => d.submittedAt),
      ...actionPlans.map((d) => d.submittedAt),
      ...macroFrameworks.map((d) => d.submittedAt),
      ...cbmtDocuments.map((d) => d.submittedAt),
      ...cdmtScenarios.map((d) => d.submittedAt),
    ].filter((d): d is Date => d !== null);

    let oldestPendingDays = 0;
    if (allSubmittedDates.length > 0) {
      const oldest = new Date(Math.min(...allSubmittedDates.map((d) => d.getTime())));
      oldestPendingDays = Math.floor((Date.now() - oldest.getTime()) / (1000 * 60 * 60 * 24));
    }

    return { total, byDocumentType, oldestPendingDays };
  }

  /**
   * Get budget statistics
   */
  static async getBudgetStats(fiscalYear: number): Promise<DashboardStats['budget']> {
    // Get ministerial ceilings for the fiscal year
    const ceilings = await prisma.ministerialCeiling.findMany({
      where: { year: fiscalYear },
      include: {
        ministry: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Get historical executions for the fiscal year
    const executions = await prisma.historicalBudget.findMany({
      where: {
        fiscalYear: fiscalYear,
      },
      include: {
        ministry: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate totals
    let totalAllocated = 0;
    let totalExecuted = 0;

    const byMinistryMap = new Map<string, {
      ministryId: string;
      ministryName: string;
      allocated: number;
      executed: number;
    }>();

    // Aggregate ceilings by ministry
    for (const ceiling of ceilings) {
      const allocated = Number(ceiling.ceiling);
      totalAllocated += allocated;

      const existing = byMinistryMap.get(ceiling.ministryId);
      if (existing) {
        existing.allocated += allocated;
      } else {
        byMinistryMap.set(ceiling.ministryId, {
          ministryId: ceiling.ministryId,
          ministryName: ceiling.ministry.name,
          allocated,
          executed: 0,
        });
      }
    }

    // Aggregate executions by ministry
    for (const execution of executions) {
      const executed = Number(execution.executedAmount || 0);
      totalExecuted += executed;

      const existing = byMinistryMap.get(execution.ministryId);
      if (existing) {
        existing.executed += executed;
      }
    }

    // Convert to array with rates
    const byMinistry = Array.from(byMinistryMap.values()).map((m) => ({
      ...m,
      rate: m.allocated > 0 ? (m.executed / m.allocated) * 100 : 0,
    }));

    return {
      totalAllocated,
      totalExecuted,
      executionRate: totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0,
      byMinistry: byMinistry.sort((a, b) => b.allocated - a.allocated).slice(0, 10),
    };
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(limit: number = 20): Promise<RecentActivity[]> {
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: { in: ['CREATE', 'UPDATE', 'SUBMIT', 'VALIDATE', 'APPROVE', 'REJECT'] },
        entity: {
          in: [
            'SectoralMeasure',
            'ActionPlan',
            'MacroFramework',
            'CBMTDocument',
            'CDMTGlobalScenario',
            'MinisterialCeiling',
          ],
        },
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity,
      entityId: log.entityId || '',
      entityCode: (log.newValue as any)?.code || (log.newValue as any)?.measureCode || '',
      description: this.formatActivityDescription(log.action, log.entity, log.newValue),
      userId: log.userId,
      userName: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système',
      timestamp: log.createdAt,
      status: (log.newValue as any)?.status,
    }));
  }

  /**
   * Format activity description
   */
  private static formatActivityDescription(action: string, entity: string, newValue: any): string {
    const entityNames: Record<string, string> = {
      SectoralMeasure: 'Mesure sectorielle',
      ActionPlan: 'Plan d\'action',
      MacroFramework: 'Cadre macroéconomique',
      CBMTDocument: 'Document CBMT',
      CDMTGlobalScenario: 'Scénario CDMT Global',
      MinisterialCeiling: 'Plafond ministériel',
    };

    const actionNames: Record<string, string> = {
      CREATE: 'créé',
      UPDATE: 'modifié',
      SUBMIT: 'soumis',
      VALIDATE: 'validé',
      APPROVE: 'approuvé',
      REJECT: 'rejeté',
    };

    const entityName = entityNames[entity] || entity;
    const actionName = actionNames[action] || action;
    const code = newValue?.code || newValue?.measureCode || newValue?.documentCode || '';

    return `${entityName} ${code} ${actionName}`;
  }

  /**
   * Get budget trends over time
   */
  static async getBudgetTrends(
    fiscalYear: number,
    months: number = 12
  ): Promise<BudgetTrend[]> {
    const trends: BudgetTrend[] = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Get allocations up to this month
      const allocations = await prisma.ministerialCeiling.aggregate({
        where: {
          year: fiscalYear,
          createdAt: { lte: new Date(year, month, 0) },
        },
        _sum: { ceiling: true },
      });

      // Get executions up to this month
      const executions = await prisma.historicalBudget.aggregate({
        where: {
          fiscalYear: fiscalYear,
          createdAt: { lte: new Date(year, month, 0) },
        },
        _sum: { executedAmount: true },
      });

      const allocated = Number(allocations._sum.ceiling || 0);
      const executed = Number(executions._sum?.executedAmount || 0);

      trends.push({
        period: `${year}-${month.toString().padStart(2, '0')}`,
        year,
        month,
        allocated,
        executed,
        rate: allocated > 0 ? (executed / allocated) * 100 : 0,
      });
    }

    return trends;
  }

  /**
   * Get ministry comparison data
   */
  static async getMinistryComparison(fiscalYear: number): Promise<MinistryComparison[]> {
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      include: {
        ministerialCeilings: {
          where: {
            year: { in: [fiscalYear, fiscalYear + 1, fiscalYear + 2] },
          },
        },
        sectoralMeasures: {
          where: {
            status: { not: 'REJECTED' },
          },
          select: {
            totalCost: true,
          },
        },
        historicalBudgets: {
          where: {
            fiscalYear: fiscalYear,
          },
        },
      },
    });

    return ministries.map((ministry) => {
      const ceilingY1 = ministry.ministerialCeilings.find((c: any) => c.year === fiscalYear);
      const ceilingY2 = ministry.ministerialCeilings.find((c: any) => c.year === fiscalYear + 1);
      const ceilingY3 = ministry.ministerialCeilings.find((c: any) => c.year === fiscalYear + 2);

      const totalMeasuresAmount = ministry.sectoralMeasures.reduce(
        (sum: number, m: any) => sum + Number(m.totalCost || 0),
        0
      );

      const totalAllocated = Number(ceilingY1?.ceiling || 0);
      const totalExecuted = ministry.historicalBudgets.reduce(
        (sum: number, h: any) => sum + Number(h.executedAmount || 0),
        0
      );

      return {
        ministryId: ministry.id,
        ministryCode: ministry.code,
        ministryName: ministry.name,
        ceilingY1: Number(ceilingY1?.ceiling || 0),
        ceilingY2: Number(ceilingY2?.ceiling || 0),
        ceilingY3: Number(ceilingY3?.ceiling || 0),
        measuresCount: ministry.sectoralMeasures.length,
        totalMeasuresAmount,
        executionRate: totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0,
      };
    }).sort((a, b) => b.ceilingY1 - a.ceilingY1);
  }

  /**
   * Get workflow statistics
   */
  static async getWorkflowStats(): Promise<{
    byStatus: Record<string, number>;
    averageProcessingDays: number;
    validationRate: number;
    rejectionRate: number;
  }> {
    const [byStatus, workflowHistory] = await Promise.all([
      prisma.workflowHistory.groupBy({
        by: ['toStatus'],
        _count: { toStatus: true },
      }),
      prisma.workflowHistory.findMany({
        where: {
          toStatus: { in: ['APPROVED', 'REJECTED'] },
        },
        select: {
          documentId: true,
          toStatus: true,
          actionAt: true,
        },
      }),
    ]);

    const statusRecord: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusRecord[s.toStatus] = s._count.toStatus;
    });

    const approved = statusRecord['APPROVED'] || 0;
    const rejected = statusRecord['REJECTED'] || 0;
    const total = approved + rejected;

    return {
      byStatus: statusRecord,
      averageProcessingDays: 0, // Would need more complex calculation
      validationRate: total > 0 ? (approved / total) * 100 : 0,
      rejectionRate: total > 0 ? (rejected / total) * 100 : 0,
    };
  }
}

export default DashboardService;
