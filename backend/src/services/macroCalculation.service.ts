import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { BadRequestError } from '../middleware/errorHandler';

/**
 * Service de calcul et validation pour le cadre macroéconomique
 */
export class MacroCalculationService {
  /**
   * Calculer le taux de croissance entre deux montants
   */
  static calculateGrowthRate(baseAmount: number | Decimal, projectedAmount: number | Decimal): number {
    const base = Number(baseAmount);
    const projected = Number(projectedAmount);

    if (base === 0) return 0;

    return ((projected - base) / base) * 100;
  }

  /**
   * Appliquer un taux de croissance à un montant
   */
  static applyGrowthRate(
    baseAmount: number | Decimal,
    growthRate: number | Decimal,
    adjustmentFactor: number | Decimal = 0
  ): number {
    const base = Number(baseAmount);
    const growth = Number(growthRate);
    const adjustment = Number(adjustmentFactor);

    const totalGrowthRate = growth + adjustment;

    return base * (1 + (totalGrowthRate / 100));
  }

  /**
   * Calculer les projections de recettes avec les hypothèses macro
   * Formule: montant = montant_base * (1 + (taux_croissance_PIB + facteur_ajustement) / 100)
   */
  static calculateRevenueProjection(params: {
    baseAmount: number | Decimal;
    gdpGrowthRate: number | Decimal;
    adjustmentFactor?: number | Decimal;
  }): number {
    const base = Number(params.baseAmount);
    const gdpGrowth = Number(params.gdpGrowthRate);
    const adjustment = params.adjustmentFactor ? Number(params.adjustmentFactor) : 0;

    const effectiveGrowthRate = gdpGrowth + adjustment;

    return base * (1 + (effectiveGrowthRate / 100));
  }

  /**
   * Calculer les projections de dépenses avec les hypothèses macro
   * Formule pour PERSONNEL: montant = montant_base * (1 + (taux_inflation + 2% + facteur_ajustement) / 100)
   * Formule pour autres: montant = montant_base * (1 + (taux_inflation + facteur_ajustement) / 100)
   */
  static calculateExpenseProjection(params: {
    baseAmount: number | Decimal;
    expenseType: string;
    inflationRate: number | Decimal;
    adjustmentFactor?: number | Decimal;
  }): number {
    const base = Number(params.baseAmount);
    const inflation = Number(params.inflationRate);
    const adjustment = params.adjustmentFactor ? Number(params.adjustmentFactor) : 0;

    // Pour les dépenses de personnel, ajouter 2% de croissance réelle
    const realGrowth = params.expenseType === 'PERSONNEL' ? 2.0 : 0;
    const effectiveGrowthRate = inflation + realGrowth + adjustment;

    return base * (1 + (effectiveGrowthRate / 100));
  }

  /**
   * Calculer le solde budgétaire
   */
  static calculateFiscalBalance(params: {
    totalRevenue: number | Decimal;
    totalExpense: number | Decimal;
  }) {
    const revenue = Number(params.totalRevenue);
    const expense = Number(params.totalExpense);

    const balance = revenue - expense;
    const balanceToRevenueRatio = revenue === 0 ? 0 : (balance / revenue) * 100;

    return {
      balance: new Decimal(balance),
      balanceToRevenueRatio: new Decimal(balanceToRevenueRatio),
      isSurplus: balance > 0,
      isDeficit: balance < 0,
      isBalanced: balance === 0,
      isDeficitConcerning: balance < 0 && Math.abs(balanceToRevenueRatio) > 5, // Déficit > 5%
    };
  }

  /**
   * Valider la cohérence d'un cadre macroéconomique
   */
  static async validateCoherence(macroFrameworkId: string) {
    const framework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });

    if (!framework) {
      throw new BadRequestError('Cadre macroéconomique non trouvé');
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Valider les taux de croissance
    const gdpGrowth = Number(framework.gdpGrowthRate);
    const inflation = Number(framework.inflationRate);

    if (gdpGrowth < -10 || gdpGrowth > 20) {
      warnings.push(`Taux de croissance du PIB inhabituel: ${gdpGrowth}%`);
    }

    if (inflation < -5 || inflation > 30) {
      warnings.push(`Taux d'inflation inhabituel: ${inflation}%`);
    }

    if (gdpGrowth < inflation - 5) {
      warnings.push('Croissance réelle négative importante (croissance < inflation - 5%)');
    }

    // Valider les projections de recettes
    if (framework.revenueProjections.length === 0) {
      errors.push('Aucune projection de recettes définie');
    }

    // Valider les projections de dépenses
    if (framework.expenseProjections.length === 0) {
      errors.push('Aucune projection de dépenses définie');
    }

    // Calculer et valider le solde budgétaire
    const totalRevenue = framework.revenueProjections.reduce(
      (sum, p) => sum.add(p.projectedAmount1),
      new Decimal(0)
    );

    const totalExpense = framework.expenseProjections.reduce(
      (sum, p) => sum.add(p.projectedAmount1),
      new Decimal(0)
    );

    const balance = this.calculateFiscalBalance({
      totalRevenue,
      totalExpense,
    });

    if (balance.isDeficitConcerning) {
      warnings.push(
        `Déficit budgétaire préoccupant: ${balance.balanceToRevenueRatio.toFixed(2)}% des recettes`
      );
    }

    // Valider la cohérence des années de projection
    for (const projection of framework.revenueProjections) {
      if (projection.baseYear >= projection.projectionYear1) {
        errors.push(
          `Année de base >= année de projection pour ${projection.categoryName}`
        );
      }
    }

    for (const projection of framework.expenseProjections) {
      if (projection.baseYear >= projection.projectionYear1) {
        errors.push(
          `Année de base >= année de projection pour ${projection.categoryName}`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      balance,
      stats: {
        revenueProjectionsCount: framework.revenueProjections.length,
        expenseProjectionsCount: framework.expenseProjections.length,
        totalRevenue,
        totalExpense,
      },
    };
  }

  /**
   * Calculer les statistiques globales pour un cadre macro
   */
  static async calculateGlobalStats(macroFrameworkId: string) {
    const framework = await prisma.macroFramework.findUnique({
      where: { id: macroFrameworkId },
      include: {
        revenueProjections: true,
        expenseProjections: true,
      },
    });

    if (!framework) {
      throw new BadRequestError('Cadre macroéconomique non trouvé');
    }

    // Calculer les totaux de recettes par année
    const revenuesByYear = {
      base: framework.revenueProjections.reduce(
        (sum, p) => sum.add(p.baseAmount),
        new Decimal(0)
      ),
      year1: framework.revenueProjections.reduce(
        (sum, p) => sum.add(p.projectedAmount1),
        new Decimal(0)
      ),
      year2: framework.revenueProjections.reduce(
        (sum, p) => sum.add(p.projectedAmount2),
        new Decimal(0)
      ),
      year3: framework.revenueProjections.reduce(
        (sum, p) => (p.projectedAmount3 ? sum.add(p.projectedAmount3) : sum),
        new Decimal(0)
      ),
    };

    // Calculer les totaux de dépenses par année
    const expensesByYear = {
      base: framework.expenseProjections.reduce(
        (sum, p) => sum.add(p.baseAmount),
        new Decimal(0)
      ),
      year1: framework.expenseProjections.reduce(
        (sum, p) => sum.add(p.projectedAmount1),
        new Decimal(0)
      ),
      year2: framework.expenseProjections.reduce(
        (sum, p) => sum.add(p.projectedAmount2),
        new Decimal(0)
      ),
      year3: framework.expenseProjections.reduce(
        (sum, p) => (p.projectedAmount3 ? sum.add(p.projectedAmount3) : sum),
        new Decimal(0)
      ),
    };

    // Calculer les soldes par année
    const balanceByYear = {
      base: this.calculateFiscalBalance({
        totalRevenue: revenuesByYear.base,
        totalExpense: expensesByYear.base,
      }),
      year1: this.calculateFiscalBalance({
        totalRevenue: revenuesByYear.year1,
        totalExpense: expensesByYear.year1,
      }),
      year2: this.calculateFiscalBalance({
        totalRevenue: revenuesByYear.year2,
        totalExpense: expensesByYear.year2,
      }),
      year3: this.calculateFiscalBalance({
        totalRevenue: revenuesByYear.year3,
        totalExpense: expensesByYear.year3,
      }),
    };

    // Calculer les taux de croissance annuels
    const revenueGrowthRates = {
      year1: this.calculateGrowthRate(revenuesByYear.base, revenuesByYear.year1),
      year2: this.calculateGrowthRate(revenuesByYear.year1, revenuesByYear.year2),
      year3: this.calculateGrowthRate(revenuesByYear.year2, revenuesByYear.year3),
    };

    const expenseGrowthRates = {
      year1: this.calculateGrowthRate(expensesByYear.base, expensesByYear.year1),
      year2: this.calculateGrowthRate(expensesByYear.year1, expensesByYear.year2),
      year3: this.calculateGrowthRate(expensesByYear.year2, expensesByYear.year3),
    };

    return {
      macroFramework: {
        id: framework.id,
        year: framework.year,
        budgetYear: framework.budgetYear,
        gdpGrowthRate: framework.gdpGrowthRate,
        inflationRate: framework.inflationRate,
        status: framework.status,
      },
      revenues: {
        byYear: revenuesByYear,
        growthRates: revenueGrowthRates,
        count: framework.revenueProjections.length,
      },
      expenses: {
        byYear: expensesByYear,
        growthRates: expenseGrowthRates,
        count: framework.expenseProjections.length,
      },
      balance: {
        byYear: balanceByYear,
      },
    };
  }
}
