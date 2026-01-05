import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';
import { NotFoundError } from '../middleware/errorHandler';

interface FiscalBalance {
  year: number;
  totalRevenue: Decimal;
  totalExpense: Decimal;
  balance: Decimal;
  balanceRatio: Decimal; // % du PIB ou des recettes
  isSurplus: boolean;
  isDeficit: boolean;
  isBalanced: boolean;
}

interface ConsistencyCheck {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
}

interface GDPRatio {
  year: number;
  nominalGDP: Decimal | null;
  revenueToGDP: string; // Ratio recettes/PIB en %
  expenseToGDP: string; // Ratio dépenses/PIB en %
  balanceToGDP: string; // Ratio solde/PIB en %
  primaryBalanceToGDP: string; // Ratio solde primaire/PIB en %
  interestToGDP: string; // Ratio intérêts/PIB en %
  taxPressure: string; // Pression fiscale (recettes fiscales/PIB)
}

export class TOFECalculationService {
  /**
   * Calculer le solde budgétaire pour chaque année d'un document TOFE
   */
  static async calculateFiscalBalance(tofeDocumentId: string): Promise<FiscalBalance[]> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    // Trouver les lignes de recettes et dépenses totales
    const revenueLine = document.lines.find(l => l.lineCode === '1');
    const expenseLine = document.lines.find(l => l.lineCode === '2');

    if (!revenueLine || !expenseLine) {
      throw new Error('Lignes de recettes ou dépenses totales introuvables');
    }

    const balances: FiscalBalance[] = [];

    // Année de base
    const baseBalance = this.calculateBalance(
      revenueLine.baseYear,
      new Decimal(revenueLine.baseAmount),
      new Decimal(expenseLine.baseAmount)
    );
    balances.push(baseBalance);

    // Année 1
    const balance1 = this.calculateBalance(
      revenueLine.projectionYear1,
      new Decimal(revenueLine.amount1),
      new Decimal(expenseLine.amount1)
    );
    balances.push(balance1);

    // Année 2
    const balance2 = this.calculateBalance(
      revenueLine.projectionYear2,
      new Decimal(revenueLine.amount2),
      new Decimal(expenseLine.amount2)
    );
    balances.push(balance2);

    // Année 3 (si disponible)
    if (revenueLine.projectionYear3 && revenueLine.amount3 && expenseLine.amount3) {
      const balance3 = this.calculateBalance(
        revenueLine.projectionYear3,
        new Decimal(revenueLine.amount3),
        new Decimal(expenseLine.amount3)
      );
      balances.push(balance3);
    }

    return balances;
  }

  /**
   * Calculer un solde budgétaire pour une année donnée
   */
  private static calculateBalance(
    year: number,
    revenue: Decimal,
    expense: Decimal
  ): FiscalBalance {
    const balance = revenue.sub(expense);
    const balanceRatio = revenue.isZero()
      ? new Decimal(0)
      : balance.div(revenue).mul(100);

    return {
      year,
      totalRevenue: revenue,
      totalExpense: expense,
      balance,
      balanceRatio,
      isSurplus: balance.greaterThan(0),
      isDeficit: balance.lessThan(0),
      isBalanced: balance.equals(0),
    };
  }

  /**
   * Vérifier la cohérence d'un document TOFE
   */
  static async checkConsistency(tofeDocumentId: string): Promise<ConsistencyCheck> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: {
          orderBy: { orderIndex: 'asc' },
        },
        macroFramework: {
          include: {
            revenueProjections: true,
            expenseProjections: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Vérifier que toutes les lignes calculées ont des montants cohérents
    for (const line of document.lines) {
      if (line.isCalculated) {
        const children = document.lines.filter(
          l => l.lineCode.startsWith(`${line.lineCode}.`) &&
               l.lineCode.split('.').length === line.lineCode.split('.').length + 1
        );

        if (children.length > 0) {
          const sumBase = children.reduce((sum, child) => sum.add(child.baseAmount), new Decimal(0));
          const sum1 = children.reduce((sum, child) => sum.add(child.amount1), new Decimal(0));
          const sum2 = children.reduce((sum, child) => sum.add(child.amount2), new Decimal(0));

          const tolerance = new Decimal(0.01); // Tolérance de 0.01 pour les arrondis

          if (!sumBase.sub(line.baseAmount).abs().lessThan(tolerance)) {
            errors.push(
              `Ligne ${line.lineCode} (${line.lineLabel}): Le total année de base (${line.baseAmount}) ne correspond pas à la somme des sous-lignes (${sumBase})`
            );
          }

          if (!sum1.sub(line.amount1).abs().lessThan(tolerance)) {
            errors.push(
              `Ligne ${line.lineCode} (${line.lineLabel}): Le total année ${line.projectionYear1} (${line.amount1}) ne correspond pas à la somme des sous-lignes (${sum1})`
            );
          }

          if (!sum2.sub(line.amount2).abs().lessThan(tolerance)) {
            errors.push(
              `Ligne ${line.lineCode} (${line.lineLabel}): Le total année ${line.projectionYear2} (${line.amount2}) ne correspond pas à la somme des sous-lignes (${sum2})`
            );
          }
        }
      }
    }

    // 2. Vérifier le solde budgétaire
    const revenueLine = document.lines.find(l => l.lineCode === '1');
    const expenseLine = document.lines.find(l => l.lineCode === '2');
    const balanceLine = document.lines.find(l => l.lineCode === '3');

    if (revenueLine && expenseLine && balanceLine) {
      const expectedBalanceBase = new Decimal(revenueLine.baseAmount).sub(expenseLine.baseAmount);
      const expectedBalance1 = new Decimal(revenueLine.amount1).sub(expenseLine.amount1);
      const expectedBalance2 = new Decimal(revenueLine.amount2).sub(expenseLine.amount2);

      const tolerance = new Decimal(0.01);

      if (!expectedBalanceBase.sub(balanceLine.baseAmount).abs().lessThan(tolerance)) {
        errors.push(
          `Solde budgétaire année de base incorrect: attendu ${expectedBalanceBase}, obtenu ${balanceLine.baseAmount}`
        );
      }

      if (!expectedBalance1.sub(balanceLine.amount1).abs().lessThan(tolerance)) {
        errors.push(
          `Solde budgétaire année ${balanceLine.projectionYear1} incorrect: attendu ${expectedBalance1}, obtenu ${balanceLine.amount1}`
        );
      }

      if (!expectedBalance2.sub(balanceLine.amount2).abs().lessThan(tolerance)) {
        errors.push(
          `Solde budgétaire année ${balanceLine.projectionYear2} incorrect: attendu ${expectedBalance2}, obtenu ${balanceLine.amount2}`
        );
      }

      // Avertissement si déficit important (> 5% des recettes)
      const deficitThreshold = new Decimal(0.05);

      [
        { year: revenueLine.baseYear, revenue: revenueLine.baseAmount, balance: balanceLine.baseAmount },
        { year: revenueLine.projectionYear1, revenue: revenueLine.amount1, balance: balanceLine.amount1 },
        { year: revenueLine.projectionYear2, revenue: revenueLine.amount2, balance: balanceLine.amount2 },
      ].forEach(({ year, revenue, balance }) => {
        const balanceDecimal = new Decimal(balance);
        const revenueDecimal = new Decimal(revenue);

        if (balanceDecimal.lessThan(0)) {
          const deficitRatio = balanceDecimal.abs().div(revenueDecimal);
          if (deficitRatio.greaterThan(deficitThreshold)) {
            warnings.push(
              `Année ${year}: Déficit important de ${deficitRatio.mul(100).toFixed(2)}% des recettes`
            );
          }
        }
      });
    }

    // 3. Vérifier la cohérence avec les projections du cadre macro
    if (document.macroFramework) {
      const macroRevenues = document.macroFramework.revenueProjections
        .filter(r => r.isActive)
        .reduce((sum, r) => sum.add(r.projectedAmount1), new Decimal(0));

      const macroExpenses = document.macroFramework.expenseProjections
        .filter(e => e.isActive)
        .reduce((sum, e) => sum.add(e.projectedAmount1), new Decimal(0));

      const tofeRevenue = revenueLine ? new Decimal(revenueLine.amount1) : new Decimal(0);
      const tofeExpense = expenseLine ? new Decimal(expenseLine.amount1) : new Decimal(0);

      const revenueDiff = macroRevenues.sub(tofeRevenue);
      const expenseDiff = macroExpenses.sub(tofeExpense);

      const tolerance = new Decimal(0.01);

      if (!revenueDiff.abs().lessThan(tolerance) && !macroRevenues.isZero()) {
        const diffPercent = revenueDiff.div(macroRevenues).mul(100).abs();
        if (diffPercent.greaterThan(1)) { // Différence > 1%
          warnings.push(
            `Écart de ${diffPercent.toFixed(2)}% entre les recettes TOFE et les projections du cadre macro`
          );
        }
      }

      if (!expenseDiff.abs().lessThan(tolerance) && !macroExpenses.isZero()) {
        const diffPercent = expenseDiff.div(macroExpenses).mul(100).abs();
        if (diffPercent.greaterThan(1)) { // Différence > 1%
          warnings.push(
            `Écart de ${diffPercent.toFixed(2)}% entre les dépenses TOFE et les projections du cadre macro`
          );
        }
      }
    }

    // 4. Vérifier que tous les codes GFS sont valides
    for (const line of document.lines) {
      if (line.gfsCode && !this.isValidGFSCode(line.gfsCode)) {
        warnings.push(
          `Ligne ${line.lineCode} (${line.lineLabel}): Code GFS potentiellement invalide: ${line.gfsCode}`
        );
      }
    }

    // 5. Vérifier l'ordre et la hiérarchie des lignes
    for (let i = 0; i < document.lines.length - 1; i++) {
      if (document.lines[i].orderIndex >= document.lines[i + 1].orderIndex) {
        errors.push(
          `Erreur d'ordre: La ligne ${document.lines[i].lineCode} a un orderIndex (${document.lines[i].orderIndex}) >= à la ligne suivante`
        );
      }
    }

    return {
      isConsistent: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valider un code GFS (simplifié)
   */
  private static isValidGFSCode(gfsCode: string): boolean {
    // Codes GFS 2014 valides (simplifié)
    const validPrefixes = ['1', '11', '111', '112', '113', '114', '115', '116',
                           '12', '121', '122',
                           '13', '131', '132', '133',
                           '14', '141', '142',
                           '2', '21', '211', '212', '213',
                           '22', '221', '222',
                           '23', '231', '232',
                           '24', '241', '242',
                           '25', '251', '252',
                           '26', '261', '262',
                           '3', '31', '32', '33',
                           'NOB', 'NLB', 'GFSM'];

    return validPrefixes.some(prefix => gfsCode.startsWith(prefix));
  }

  /**
   * Calculer les ratios budgétaires
   */
  static async calculateBudgetRatios(tofeDocumentId: string) {
    const balances = await this.calculateFiscalBalance(tofeDocumentId);

    const ratios = balances.map(balance => {
      const revenueGrowth = balances[0] && !balances[0].totalRevenue.isZero()
        ? balance.totalRevenue.sub(balances[0].totalRevenue)
            .div(balances[0].totalRevenue)
            .mul(100)
        : new Decimal(0);

      const expenseGrowth = balances[0] && !balances[0].totalExpense.isZero()
        ? balance.totalExpense.sub(balances[0].totalExpense)
            .div(balances[0].totalExpense)
            .mul(100)
        : new Decimal(0);

      const expenseToRevenue = !balance.totalRevenue.isZero()
        ? balance.totalExpense.div(balance.totalRevenue).mul(100)
        : new Decimal(0);

      return {
        year: balance.year,
        revenueGrowth: revenueGrowth.toFixed(2) + '%',
        expenseGrowth: expenseGrowth.toFixed(2) + '%',
        expenseToRevenueRatio: expenseToRevenue.toFixed(2) + '%',
        balanceToRevenueRatio: balance.balanceRatio.toFixed(2) + '%',
        isSurplus: balance.isSurplus,
        isDeficit: balance.isDeficit,
      };
    });

    return ratios;
  }

  /**
   * Calculer les ratios par rapport au PIB
   */
  static async calculateGDPRatios(tofeDocumentId: string): Promise<GDPRatio[]> {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: true,
        macroFramework: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    const ratios: GDPRatio[] = [];
    const macroFramework = document.macroFramework;

    // Récupérer les lignes clés
    const revenueLine = document.lines.find(l => l.lineCode === '1');
    const expenseLine = document.lines.find(l => l.lineCode === '2');
    const balanceLine = document.lines.find(l => l.lineCode === '3');
    const primaryBalanceLine = document.lines.find(l => l.lineCode === '4');
    const interestLine = document.lines.find(l => l.lineCode === '5' || l.gfsCode === '24');

    // Récupérer les recettes fiscales uniquement (pour la pression fiscale)
    const taxRevenueLine = document.lines.find(l => l.lineCode === '1.1' && l.gfsCode === '11');

    // Fonction helper pour calculer le ratio
    const calcRatio = (amount: Decimal | null, gdp: Decimal | null): string => {
      if (!amount || !gdp || gdp.isZero()) return 'N/A';
      return amount.div(gdp).mul(100).toFixed(2) + '%';
    };

    // Année de base
    if (revenueLine) {
      const gdpBase = macroFramework?.nominalGDP ? new Decimal(macroFramework.nominalGDP) : null;
      ratios.push({
        year: revenueLine.baseYear,
        nominalGDP: gdpBase,
        revenueToGDP: calcRatio(new Decimal(revenueLine.baseAmount), gdpBase),
        expenseToGDP: calcRatio(expenseLine ? new Decimal(expenseLine.baseAmount) : null, gdpBase),
        balanceToGDP: calcRatio(balanceLine ? new Decimal(balanceLine.baseAmount) : null, gdpBase),
        primaryBalanceToGDP: calcRatio(primaryBalanceLine ? new Decimal(primaryBalanceLine.baseAmount) : null, gdpBase),
        interestToGDP: calcRatio(interestLine ? new Decimal(interestLine.baseAmount) : null, gdpBase),
        taxPressure: calcRatio(taxRevenueLine ? new Decimal(taxRevenueLine.baseAmount) : null, gdpBase),
      });

      // Année 1 (N+1)
      const gdp1 = macroFramework?.nominalGDPYear1 ? new Decimal(macroFramework.nominalGDPYear1) : null;
      ratios.push({
        year: revenueLine.projectionYear1,
        nominalGDP: gdp1,
        revenueToGDP: calcRatio(new Decimal(revenueLine.amount1), gdp1),
        expenseToGDP: calcRatio(expenseLine ? new Decimal(expenseLine.amount1) : null, gdp1),
        balanceToGDP: calcRatio(balanceLine ? new Decimal(balanceLine.amount1) : null, gdp1),
        primaryBalanceToGDP: calcRatio(primaryBalanceLine ? new Decimal(primaryBalanceLine.amount1) : null, gdp1),
        interestToGDP: calcRatio(interestLine ? new Decimal(interestLine.amount1) : null, gdp1),
        taxPressure: calcRatio(taxRevenueLine ? new Decimal(taxRevenueLine.amount1) : null, gdp1),
      });

      // Année 2 (N+2)
      const gdp2 = macroFramework?.nominalGDPYear2 ? new Decimal(macroFramework.nominalGDPYear2) : null;
      ratios.push({
        year: revenueLine.projectionYear2,
        nominalGDP: gdp2,
        revenueToGDP: calcRatio(new Decimal(revenueLine.amount2), gdp2),
        expenseToGDP: calcRatio(expenseLine ? new Decimal(expenseLine.amount2) : null, gdp2),
        balanceToGDP: calcRatio(balanceLine ? new Decimal(balanceLine.amount2) : null, gdp2),
        primaryBalanceToGDP: calcRatio(primaryBalanceLine ? new Decimal(primaryBalanceLine.amount2) : null, gdp2),
        interestToGDP: calcRatio(interestLine ? new Decimal(interestLine.amount2) : null, gdp2),
        taxPressure: calcRatio(taxRevenueLine ? new Decimal(taxRevenueLine.amount2) : null, gdp2),
      });

      // Année 3 (N+3) si disponible
      if (revenueLine.projectionYear3 && revenueLine.amount3) {
        const gdp3 = macroFramework?.nominalGDPYear3 ? new Decimal(macroFramework.nominalGDPYear3) : null;
        ratios.push({
          year: revenueLine.projectionYear3,
          nominalGDP: gdp3,
          revenueToGDP: calcRatio(new Decimal(revenueLine.amount3), gdp3),
          expenseToGDP: calcRatio(expenseLine?.amount3 ? new Decimal(expenseLine.amount3) : null, gdp3),
          balanceToGDP: calcRatio(balanceLine?.amount3 ? new Decimal(balanceLine.amount3) : null, gdp3),
          primaryBalanceToGDP: calcRatio(primaryBalanceLine?.amount3 ? new Decimal(primaryBalanceLine.amount3) : null, gdp3),
          interestToGDP: calcRatio(interestLine?.amount3 ? new Decimal(interestLine.amount3) : null, gdp3),
          taxPressure: calcRatio(taxRevenueLine?.amount3 ? new Decimal(taxRevenueLine.amount3) : null, gdp3),
        });
      }
    }

    return ratios;
  }

  /**
   * Calculer le solde primaire
   */
  static async calculatePrimaryBalance(tofeDocumentId: string) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    // Récupérer les lignes de solde primaire
    const primaryBalanceLine = document.lines.find(l => l.lineCode === '4' || l.gfsCode === 'NPB');
    const globalBalanceLine = document.lines.find(l => l.lineCode === '3' || l.gfsCode === 'NOB');
    const interestLine = document.lines.find(l => l.lineCode === '5' || l.gfsCode === '24');

    if (!primaryBalanceLine || !globalBalanceLine) {
      return null;
    }

    return {
      baseYear: {
        year: primaryBalanceLine.baseYear,
        globalBalance: new Decimal(globalBalanceLine.baseAmount),
        primaryBalance: new Decimal(primaryBalanceLine.baseAmount),
        interest: interestLine ? new Decimal(interestLine.baseAmount) : new Decimal(0),
      },
      year1: {
        year: primaryBalanceLine.projectionYear1,
        globalBalance: new Decimal(globalBalanceLine.amount1),
        primaryBalance: new Decimal(primaryBalanceLine.amount1),
        interest: interestLine ? new Decimal(interestLine.amount1) : new Decimal(0),
      },
      year2: {
        year: primaryBalanceLine.projectionYear2,
        globalBalance: new Decimal(globalBalanceLine.amount2),
        primaryBalance: new Decimal(primaryBalanceLine.amount2),
        interest: interestLine ? new Decimal(interestLine.amount2) : new Decimal(0),
      },
      year3: primaryBalanceLine.projectionYear3 ? {
        year: primaryBalanceLine.projectionYear3,
        globalBalance: globalBalanceLine.amount3 ? new Decimal(globalBalanceLine.amount3) : new Decimal(0),
        primaryBalance: primaryBalanceLine.amount3 ? new Decimal(primaryBalanceLine.amount3) : new Decimal(0),
        interest: interestLine?.amount3 ? new Decimal(interestLine.amount3) : new Decimal(0),
      } : null,
    };
  }

  /**
   * Obtenir un résumé financier du TOFE
   */
  static async getSummary(tofeDocumentId: string) {
    const document = await prisma.tOFEDocument.findUnique({
      where: { id: tofeDocumentId },
      include: {
        lines: true,
        macroFramework: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document TOFE non trouvé');
    }

    const balances = await this.calculateFiscalBalance(tofeDocumentId);
    const ratios = await this.calculateBudgetRatios(tofeDocumentId);
    const gdpRatios = await this.calculateGDPRatios(tofeDocumentId);
    const primaryBalance = await this.calculatePrimaryBalance(tofeDocumentId);
    const consistency = await this.checkConsistency(tofeDocumentId);

    // Obtenir les détails par section
    const revenueSections = document.lines.filter(l => l.section === 'REVENUE' && l.lineLevel === 1);
    const expenseSections = document.lines.filter(l => l.section === 'EXPENSE' && l.lineLevel === 1);
    const balanceSections = document.lines.filter(l => l.section === 'BALANCE');

    const revenueBreakdown = revenueSections.map(section => ({
      code: section.lineCode,
      label: section.lineLabel,
      baseAmount: section.baseAmount.toString(),
      amount1: section.amount1.toString(),
      amount2: section.amount2.toString(),
      amount3: section.amount3?.toString(),
    }));

    const expenseBreakdown = expenseSections.map(section => ({
      code: section.lineCode,
      label: section.lineLabel,
      baseAmount: section.baseAmount.toString(),
      amount1: section.amount1.toString(),
      amount2: section.amount2.toString(),
      amount3: section.amount3?.toString(),
    }));

    const balanceBreakdown = balanceSections.map(section => ({
      code: section.lineCode,
      label: section.lineLabel,
      gfsCode: section.gfsCode,
      baseAmount: section.baseAmount.toString(),
      amount1: section.amount1.toString(),
      amount2: section.amount2.toString(),
      amount3: section.amount3?.toString(),
      formula: section.formula,
      notes: section.notes,
    }));

    // Récupérer les hypothèses macroéconomiques
    const macroHypotheses = document.macroFramework ? {
      gdpGrowthRate: document.macroFramework.gdpGrowthRate?.toString(),
      inflationRate: document.macroFramework.inflationRate?.toString(),
      exchangeRate: document.macroFramework.exchangeRate?.toString(),
      nominalGDP: document.macroFramework.nominalGDP?.toString(),
      nominalGDPYear1: document.macroFramework.nominalGDPYear1?.toString(),
      nominalGDPYear2: document.macroFramework.nominalGDPYear2?.toString(),
      nominalGDPYear3: document.macroFramework.nominalGDPYear3?.toString(),
      oilPrice: document.macroFramework.oilPrice?.toString(),
      interestRate: document.macroFramework.interestRate?.toString(),
    } : null;

    return {
      document: {
        id: document.id,
        code: document.documentCode,
        title: document.title,
        fiscalYear: document.fiscalYear,
        status: document.status,
        currency: document.currency,
        unit: document.unit,
      },
      macroHypotheses,
      balances: balances.map(b => ({
        year: b.year,
        revenue: b.totalRevenue.toString(),
        expense: b.totalExpense.toString(),
        balance: b.balance.toString(),
        balanceRatio: b.balanceRatio.toFixed(2) + '%',
        type: b.isSurplus ? 'SURPLUS' : b.isDeficit ? 'DEFICIT' : 'BALANCED',
      })),
      primaryBalance: primaryBalance ? {
        baseYear: {
          year: primaryBalance.baseYear.year,
          globalBalance: primaryBalance.baseYear.globalBalance.toString(),
          primaryBalance: primaryBalance.baseYear.primaryBalance.toString(),
          interest: primaryBalance.baseYear.interest.toString(),
        },
        year1: {
          year: primaryBalance.year1.year,
          globalBalance: primaryBalance.year1.globalBalance.toString(),
          primaryBalance: primaryBalance.year1.primaryBalance.toString(),
          interest: primaryBalance.year1.interest.toString(),
        },
        year2: {
          year: primaryBalance.year2.year,
          globalBalance: primaryBalance.year2.globalBalance.toString(),
          primaryBalance: primaryBalance.year2.primaryBalance.toString(),
          interest: primaryBalance.year2.interest.toString(),
        },
        year3: primaryBalance.year3 ? {
          year: primaryBalance.year3.year,
          globalBalance: primaryBalance.year3.globalBalance.toString(),
          primaryBalance: primaryBalance.year3.primaryBalance.toString(),
          interest: primaryBalance.year3.interest.toString(),
        } : null,
      } : null,
      ratios,
      gdpRatios: gdpRatios.map(r => ({
        year: r.year,
        nominalGDP: r.nominalGDP?.toString() || 'N/A',
        revenueToGDP: r.revenueToGDP,
        expenseToGDP: r.expenseToGDP,
        balanceToGDP: r.balanceToGDP,
        primaryBalanceToGDP: r.primaryBalanceToGDP,
        interestToGDP: r.interestToGDP,
        taxPressure: r.taxPressure,
      })),
      revenueBreakdown,
      expenseBreakdown,
      balanceBreakdown,
      consistency,
    };
  }
}

export default TOFECalculationService;
