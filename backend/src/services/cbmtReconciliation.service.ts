import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface ReconciliationResult {
  isReconciled: boolean;
  totalDiscrepancies: number;
  discrepancyPercentage: number;
  details: ReconciliationDetail[];
  alerts: ReconciliationAlert[];
  summary: ReconciliationSummary;
}

interface ReconciliationDetail {
  category: string;
  section: 'REVENUE' | 'EXPENSE' | 'BALANCE';
  year: number;
  tofeAmount: number;
  cbmtAmount: number;
  discrepancy: number;
  discrepancyPercentage: number;
  isReconciled: boolean;
}

interface ReconciliationAlert {
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  code: string;
  message: string;
  category?: string;
  year?: number;
  discrepancy?: number;
}

interface ReconciliationSummary {
  tofe: {
    totalRevenue: { year1: number; year2: number; year3: number };
    totalExpense: { year1: number; year2: number; year3: number };
    balance: { year1: number; year2: number; year3: number };
  };
  cbmt: {
    totalRevenue: { year1: number; year2: number; year3: number };
    totalExpense: { year1: number; year2: number; year3: number };
    balance: { year1: number; year2: number; year3: number };
  };
  discrepancies: {
    revenue: { year1: number; year2: number; year3: number };
    expense: { year1: number; year2: number; year3: number };
    balance: { year1: number; year2: number; year3: number };
  };
}

export class CBMTReconciliationService {
  // Seuil de tolérance pour les écarts (en pourcentage)
  private static readonly TOLERANCE_THRESHOLD = 0.5; // 0.5%
  private static readonly WARNING_THRESHOLD = 2.0; // 2%
  private static readonly ERROR_THRESHOLD = 5.0; // 5%

  /**
   * Réconcilier un document CBMT avec le TOFE correspondant
   */
  static async reconcile(cbmtDocumentId: string): Promise<ReconciliationResult> {
    // Récupérer le document CBMT
    const cbmtDocument = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
        macroFramework: true,
      },
    });

    if (!cbmtDocument) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    // Récupérer le document TOFE correspondant
    const tofeDocument = await prisma.tOFEDocument.findFirst({
      where: {
        macroFrameworkId: cbmtDocument.macroFrameworkId,
        fiscalYear: cbmtDocument.fiscalYear,
      },
      include: {
        lines: true,
      },
    });

    if (!tofeDocument) {
      throw new NotFoundError('Document TOFE correspondant non trouvé');
    }

    const details: ReconciliationDetail[] = [];
    const alerts: ReconciliationAlert[] = [];

    // Extraire les totaux du TOFE
    const tofeRevenueLine = tofeDocument.lines.find(l => l.lineCode === '1' && l.section === 'REVENUE');
    const tofeExpenseLine = tofeDocument.lines.find(l => l.lineCode === '2' && l.section === 'EXPENSE');
    const tofeBalanceLine = tofeDocument.lines.find(l => l.lineCode === '3' && l.section === 'BALANCE');

    // Calculer les totaux du CBMT
    const cbmtRevenueAggregates = cbmtDocument.aggregates.filter(a => a.aggregateType === 'REVENUE');
    const cbmtExpenseAggregates = cbmtDocument.aggregates.filter(a => a.aggregateType === 'EXPENSE');

    const cbmtRevenue = {
      year1: cbmtRevenueAggregates.reduce((sum, a) => sum + Number(a.amount1), 0),
      year2: cbmtRevenueAggregates.reduce((sum, a) => sum + Number(a.amount2), 0),
      year3: cbmtRevenueAggregates.reduce((sum, a) => sum + Number(a.amount3), 0),
    };

    const cbmtExpense = {
      year1: cbmtExpenseAggregates.reduce((sum, a) => sum + Number(a.amount1), 0),
      year2: cbmtExpenseAggregates.reduce((sum, a) => sum + Number(a.amount2), 0),
      year3: cbmtExpenseAggregates.reduce((sum, a) => sum + Number(a.amount3), 0),
    };

    const tofeRevenue = {
      year1: tofeRevenueLine ? Number(tofeRevenueLine.amount1) : 0,
      year2: tofeRevenueLine ? Number(tofeRevenueLine.amount2) : 0,
      year3: tofeRevenueLine?.amount3 ? Number(tofeRevenueLine.amount3) : 0,
    };

    const tofeExpense = {
      year1: tofeExpenseLine ? Number(tofeExpenseLine.amount1) : 0,
      year2: tofeExpenseLine ? Number(tofeExpenseLine.amount2) : 0,
      year3: tofeExpenseLine?.amount3 ? Number(tofeExpenseLine.amount3) : 0,
    };

    // Réconcilier les recettes
    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const tofeAmount = tofeRevenue[`year${yearIndex}` as keyof typeof tofeRevenue];
      const cbmtAmount = cbmtRevenue[`year${yearIndex}` as keyof typeof cbmtRevenue];
      const discrepancy = cbmtAmount - tofeAmount;
      const discrepancyPct = tofeAmount !== 0 ? Math.abs(discrepancy / tofeAmount) * 100 : 0;

      const year = yearIndex === 1
        ? cbmtDocument.aggregates[0]?.year1
        : yearIndex === 2
          ? cbmtDocument.aggregates[0]?.year2
          : cbmtDocument.aggregates[0]?.year3;

      details.push({
        category: 'Total Recettes',
        section: 'REVENUE',
        year: year || cbmtDocument.fiscalYear + yearIndex - 1,
        tofeAmount,
        cbmtAmount,
        discrepancy,
        discrepancyPercentage: discrepancyPct,
        isReconciled: discrepancyPct <= this.TOLERANCE_THRESHOLD,
      });

      // Générer des alertes si nécessaire
      if (discrepancyPct > this.ERROR_THRESHOLD) {
        alerts.push({
          severity: 'CRITICAL',
          code: 'REVENUE_DISCREPANCY_CRITICAL',
          message: `Écart critique de ${discrepancyPct.toFixed(2)}% sur les recettes totales pour l'année ${year}`,
          category: 'Total Recettes',
          year: year || 0,
          discrepancy,
        });
      } else if (discrepancyPct > this.WARNING_THRESHOLD) {
        alerts.push({
          severity: 'ERROR',
          code: 'REVENUE_DISCREPANCY_HIGH',
          message: `Écart important de ${discrepancyPct.toFixed(2)}% sur les recettes totales pour l'année ${year}`,
          category: 'Total Recettes',
          year: year || 0,
          discrepancy,
        });
      } else if (discrepancyPct > this.TOLERANCE_THRESHOLD) {
        alerts.push({
          severity: 'WARNING',
          code: 'REVENUE_DISCREPANCY',
          message: `Écart de ${discrepancyPct.toFixed(2)}% sur les recettes totales pour l'année ${year}`,
          category: 'Total Recettes',
          year: year || 0,
          discrepancy,
        });
      }
    }

    // Réconcilier les dépenses
    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const tofeAmount = tofeExpense[`year${yearIndex}` as keyof typeof tofeExpense];
      const cbmtAmount = cbmtExpense[`year${yearIndex}` as keyof typeof cbmtExpense];
      const discrepancy = cbmtAmount - tofeAmount;
      const discrepancyPct = tofeAmount !== 0 ? Math.abs(discrepancy / tofeAmount) * 100 : 0;

      const year = yearIndex === 1
        ? cbmtDocument.aggregates[0]?.year1
        : yearIndex === 2
          ? cbmtDocument.aggregates[0]?.year2
          : cbmtDocument.aggregates[0]?.year3;

      details.push({
        category: 'Total Dépenses',
        section: 'EXPENSE',
        year: year || cbmtDocument.fiscalYear + yearIndex - 1,
        tofeAmount,
        cbmtAmount,
        discrepancy,
        discrepancyPercentage: discrepancyPct,
        isReconciled: discrepancyPct <= this.TOLERANCE_THRESHOLD,
      });

      if (discrepancyPct > this.ERROR_THRESHOLD) {
        alerts.push({
          severity: 'CRITICAL',
          code: 'EXPENSE_DISCREPANCY_CRITICAL',
          message: `Écart critique de ${discrepancyPct.toFixed(2)}% sur les dépenses totales pour l'année ${year}`,
          category: 'Total Dépenses',
          year: year || 0,
          discrepancy,
        });
      } else if (discrepancyPct > this.WARNING_THRESHOLD) {
        alerts.push({
          severity: 'ERROR',
          code: 'EXPENSE_DISCREPANCY_HIGH',
          message: `Écart important de ${discrepancyPct.toFixed(2)}% sur les dépenses totales pour l'année ${year}`,
          category: 'Total Dépenses',
          year: year || 0,
          discrepancy,
        });
      } else if (discrepancyPct > this.TOLERANCE_THRESHOLD) {
        alerts.push({
          severity: 'WARNING',
          code: 'EXPENSE_DISCREPANCY',
          message: `Écart de ${discrepancyPct.toFixed(2)}% sur les dépenses totales pour l'année ${year}`,
          category: 'Total Dépenses',
          year: year || 0,
          discrepancy,
        });
      }
    }

    // Réconcilier les soldes
    const tofeBalance = {
      year1: tofeRevenue.year1 - tofeExpense.year1,
      year2: tofeRevenue.year2 - tofeExpense.year2,
      year3: tofeRevenue.year3 - tofeExpense.year3,
    };

    const cbmtBalance = {
      year1: cbmtRevenue.year1 - cbmtExpense.year1,
      year2: cbmtRevenue.year2 - cbmtExpense.year2,
      year3: cbmtRevenue.year3 - cbmtExpense.year3,
    };

    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const tofeAmount = tofeBalance[`year${yearIndex}` as keyof typeof tofeBalance];
      const cbmtAmount = cbmtBalance[`year${yearIndex}` as keyof typeof cbmtBalance];
      const discrepancy = cbmtAmount - tofeAmount;
      const baseForPct = Math.max(Math.abs(tofeAmount), Math.abs(cbmtAmount));
      const discrepancyPct = baseForPct !== 0 ? Math.abs(discrepancy / baseForPct) * 100 : 0;

      const year = yearIndex === 1
        ? cbmtDocument.aggregates[0]?.year1
        : yearIndex === 2
          ? cbmtDocument.aggregates[0]?.year2
          : cbmtDocument.aggregates[0]?.year3;

      details.push({
        category: 'Solde Budgétaire',
        section: 'BALANCE',
        year: year || cbmtDocument.fiscalYear + yearIndex - 1,
        tofeAmount,
        cbmtAmount,
        discrepancy,
        discrepancyPercentage: discrepancyPct,
        isReconciled: discrepancyPct <= this.TOLERANCE_THRESHOLD,
      });

      if (discrepancyPct > this.TOLERANCE_THRESHOLD) {
        alerts.push({
          severity: 'WARNING',
          code: 'BALANCE_DISCREPANCY',
          message: `Écart de ${discrepancyPct.toFixed(2)}% sur le solde budgétaire pour l'année ${year}`,
          category: 'Solde Budgétaire',
          year: year || 0,
          discrepancy,
        });
      }
    }

    // Calculer le résumé
    const summary: ReconciliationSummary = {
      tofe: {
        totalRevenue: tofeRevenue,
        totalExpense: tofeExpense,
        balance: tofeBalance,
      },
      cbmt: {
        totalRevenue: cbmtRevenue,
        totalExpense: cbmtExpense,
        balance: cbmtBalance,
      },
      discrepancies: {
        revenue: {
          year1: cbmtRevenue.year1 - tofeRevenue.year1,
          year2: cbmtRevenue.year2 - tofeRevenue.year2,
          year3: cbmtRevenue.year3 - tofeRevenue.year3,
        },
        expense: {
          year1: cbmtExpense.year1 - tofeExpense.year1,
          year2: cbmtExpense.year2 - tofeExpense.year2,
          year3: cbmtExpense.year3 - tofeExpense.year3,
        },
        balance: {
          year1: cbmtBalance.year1 - tofeBalance.year1,
          year2: cbmtBalance.year2 - tofeBalance.year2,
          year3: cbmtBalance.year3 - tofeBalance.year3,
        },
      },
    };

    const isReconciled = details.every(d => d.isReconciled);
    const totalDiscrepancies = details.filter(d => !d.isReconciled).length;
    const avgDiscrepancy = details.reduce((sum, d) => sum + d.discrepancyPercentage, 0) / details.length;

    // Sauvegarder le résultat de la réconciliation
    await prisma.cBMTAnalysis.create({
      data: {
        cbmtDocumentId,
        analysisType: 'RECONCILIATION',
        analysisName: 'Réconciliation CBMT-TOFE',
        description: `Réconciliation automatique du CBMT avec le TOFE pour l'année fiscale ${cbmtDocument.fiscalYear}`,
        parameters: {
          tofeDocumentId: tofeDocument.id,
          toleranceThreshold: this.TOLERANCE_THRESHOLD,
        } as any,
        results: {
          isReconciled,
          totalDiscrepancies,
          details,
          summary,
        } as any,
        keyIndicators: {
          isReconciled,
          totalDiscrepancies,
          averageDiscrepancy: avgDiscrepancy,
          criticalAlerts: alerts.filter(a => a.severity === 'CRITICAL').length,
        },
        conclusions: isReconciled
          ? 'Le CBMT est parfaitement réconcilié avec le TOFE.'
          : `Le CBMT présente ${totalDiscrepancies} écart(s) avec le TOFE nécessitant une révision.`,
        recommendations: isReconciled
          ? 'Aucune action requise.'
          : 'Recommandations: (1) Vérifier les projections de recettes, (2) Revoir les agrégats de dépenses, (3) Régénérer le CBMT depuis le TOFE si nécessaire.',
        riskLevel: isReconciled ? 'LOW' : alerts.some(a => a.severity === 'CRITICAL') ? 'CRITICAL' : 'MEDIUM',
      },
    });

    return {
      isReconciled,
      totalDiscrepancies,
      discrepancyPercentage: avgDiscrepancy,
      details,
      alerts,
      summary,
    };
  }

  /**
   * Synchroniser le CBMT avec le TOFE (mettre à jour les montants)
   */
  static async synchronizeWithTOFE(cbmtDocumentId: string, overwrite: boolean = false) {
    const cbmtDocument = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!cbmtDocument) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    if (cbmtDocument.status !== 'DRAFT' && !overwrite) {
      throw new BadRequestError('Seuls les documents CBMT en statut DRAFT peuvent être synchronisés');
    }

    const tofeDocument = await prisma.tOFEDocument.findFirst({
      where: {
        macroFrameworkId: cbmtDocument.macroFrameworkId,
        fiscalYear: cbmtDocument.fiscalYear,
      },
      include: {
        lines: true,
      },
    });

    if (!tofeDocument) {
      throw new NotFoundError('Document TOFE correspondant non trouvé');
    }

    // Mettre à jour les plafonds globaux
    const totalRevenueLine = tofeDocument.lines.find(l => l.lineCode === '1');
    const totalExpenseLine = tofeDocument.lines.find(l => l.lineCode === '2');
    const balanceLine = tofeDocument.lines.find(l => l.lineCode === '3');

    await prisma.cBMTDocument.update({
      where: { id: cbmtDocumentId },
      data: {
        totalRevenueCeiling: totalRevenueLine?.amount1 || new Decimal(0),
        totalExpenseCeiling: totalExpenseLine?.amount1 || new Decimal(0),
        fiscalDeficitCeiling: balanceLine?.amount1 || new Decimal(0),
      },
    });

    // Mettre à jour les agrégats de recettes
    const revenueLines = tofeDocument.lines.filter(l => l.section === 'REVENUE' && l.lineLevel === 1);
    for (const line of revenueLines) {
      const aggregate = cbmtDocument.aggregates.find(
        a => a.aggregateType === 'REVENUE' && a.categoryCode === line.lineCode
      );

      if (aggregate) {
        await prisma.cBMTAggregate.update({
          where: { id: aggregate.id },
          data: {
            amount1: line.amount1,
            ceiling1: line.amount1,
            amount2: line.amount2,
            ceiling2: line.amount2,
            amount3: line.amount3 || line.amount2,
            ceiling3: line.amount3 || line.amount2,
            gap1: new Decimal(0),
            gap2: new Decimal(0),
            gap3: new Decimal(0),
            isAlertTriggered: false,
            alertMessage: null,
          },
        });
      }
    }

    // Mettre à jour les agrégats de dépenses
    const expenseLines = tofeDocument.lines.filter(l => l.section === 'EXPENSE' && l.lineLevel === 1);
    for (const line of expenseLines) {
      const aggregate = cbmtDocument.aggregates.find(
        a => a.aggregateType === 'EXPENSE' && a.categoryCode === line.lineCode
      );

      if (aggregate) {
        await prisma.cBMTAggregate.update({
          where: { id: aggregate.id },
          data: {
            amount1: line.amount1,
            ceiling1: line.amount1,
            amount2: line.amount2,
            ceiling2: line.amount2,
            amount3: line.amount3 || line.amount2,
            ceiling3: line.amount3 || line.amount2,
            gap1: new Decimal(0),
            gap2: new Decimal(0),
            gap3: new Decimal(0),
            isAlertTriggered: false,
            alertMessage: null,
          },
        });
      }
    }

    return {
      message: 'CBMT synchronisé avec le TOFE avec succès',
      updatedAggregates: cbmtDocument.aggregates.length,
    };
  }

  /**
   * Vérifier la cohérence avant validation
   */
  static async checkBeforeValidation(cbmtDocumentId: string): Promise<{
    canValidate: boolean;
    issues: string[];
    warnings: string[];
  }> {
    const result = await this.reconcile(cbmtDocumentId);

    const issues: string[] = [];
    const warnings: string[] = [];

    // Vérifier les alertes critiques
    const criticalAlerts = result.alerts.filter(a => a.severity === 'CRITICAL');
    if (criticalAlerts.length > 0) {
      issues.push(...criticalAlerts.map(a => a.message));
    }

    // Vérifier les alertes d'erreur
    const errorAlerts = result.alerts.filter(a => a.severity === 'ERROR');
    if (errorAlerts.length > 0) {
      issues.push(...errorAlerts.map(a => a.message));
    }

    // Vérifier les avertissements
    const warningAlerts = result.alerts.filter(a => a.severity === 'WARNING');
    if (warningAlerts.length > 0) {
      warnings.push(...warningAlerts.map(a => a.message));
    }

    return {
      canValidate: issues.length === 0,
      issues,
      warnings,
    };
  }
}

export default CBMTReconciliationService;
