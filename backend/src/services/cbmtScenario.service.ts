import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

type ScenarioType = 'BASE' | 'OPTIMISTIC' | 'PESSIMISTIC' | 'REALISTIC' | 'CUSTOM';

interface CreateScenarioParams {
  baseCbmtDocumentId: string; // Document CBMT de base
  scenarioType: ScenarioType;
  scenarioName: string;
  description?: string;
  gdpGrowthVariation?: number; // Variation en points de pourcentage
  inflationVariation?: number;
  revenueAdjustment?: number; // Ajustement en pourcentage
  expenseAdjustment?: number;
  createdBy?: string;
}

interface ScenarioComparisonResult {
  scenarios: ScenarioSummary[];
  comparison: ComparisonDetail[];
  analysis: ComparisonAnalysis;
}

interface ScenarioSummary {
  id: string;
  scenarioType: string;
  scenarioName: string;
  totalRevenue: { year1: number; year2: number; year3: number };
  totalExpense: { year1: number; year2: number; year3: number };
  balance: { year1: number; year2: number; year3: number };
  reserves: { year1: number; year2: number; year3: number };
}

interface ComparisonDetail {
  metric: string;
  unit: string;
  values: Record<string, { year1: number; year2: number; year3: number }>;
  variance: {
    minScenario: string;
    maxScenario: string;
    range: { year1: number; year2: number; year3: number };
  };
}

interface ComparisonAnalysis {
  summary: string;
  keyFindings: string[];
  riskAssessment: {
    pessimisticImpact: string;
    optimisticUpside: string;
    volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  recommendations: string[];
}

const SCENARIO_CONFIGS: Record<ScenarioType, { gdpVariation: number; inflationVariation: number; revenueAdj: number; expenseAdj: number }> = {
  BASE: { gdpVariation: 0, inflationVariation: 0, revenueAdj: 0, expenseAdj: 0 },
  OPTIMISTIC: { gdpVariation: 1.5, inflationVariation: -0.5, revenueAdj: 5, expenseAdj: -2 },
  PESSIMISTIC: { gdpVariation: -1.5, inflationVariation: 1.0, revenueAdj: -5, expenseAdj: 3 },
  REALISTIC: { gdpVariation: 0.5, inflationVariation: 0.3, revenueAdj: 2, expenseAdj: 1 },
  CUSTOM: { gdpVariation: 0, inflationVariation: 0, revenueAdj: 0, expenseAdj: 0 },
};

export class CBMTScenarioService {
  /**
   * Créer un nouveau scénario à partir d'un CBMT de base
   */
  static async createScenario(params: CreateScenarioParams) {
    const {
      baseCbmtDocumentId,
      scenarioType,
      scenarioName,
      description,
      gdpGrowthVariation,
      inflationVariation,
      revenueAdjustment,
      expenseAdjustment,
      createdBy,
    } = params;

    // Récupérer le document CBMT de base
    const baseDocument = await prisma.cBMTDocument.findUnique({
      where: { id: baseCbmtDocumentId },
      include: {
        aggregates: true,
        reserves: true,
        macroFramework: true,
      },
    });

    if (!baseDocument) {
      throw new NotFoundError('Document CBMT de base non trouvé');
    }

    // Vérifier si le scénario existe déjà
    const existingScenario = await prisma.cBMTDocument.findFirst({
      where: {
        macroFrameworkId: baseDocument.macroFrameworkId,
        fiscalYear: baseDocument.fiscalYear,
        scenarioType,
      },
    });

    if (existingScenario) {
      throw new ConflictError(`Un scénario ${scenarioType} existe déjà pour cette année fiscale`);
    }

    // Utiliser les valeurs par défaut ou les valeurs personnalisées
    const config = SCENARIO_CONFIGS[scenarioType];
    const gdpVar = gdpGrowthVariation ?? config.gdpVariation;
    const inflVar = inflationVariation ?? config.inflationVariation;
    const revAdj = revenueAdjustment ?? config.revenueAdj;
    const expAdj = expenseAdjustment ?? config.expenseAdj;

    // Calculer les nouveaux plafonds
    const revenueFactor = 1 + revAdj / 100;
    const expenseFactor = 1 + expAdj / 100;

    const newRevenueCeiling = new Decimal(baseDocument.totalRevenueCeiling).mul(revenueFactor);
    const newExpenseCeiling = new Decimal(baseDocument.totalExpenseCeiling).mul(expenseFactor);
    const newDeficitCeiling = newRevenueCeiling.sub(newExpenseCeiling);

    // Créer le nouveau document de scénario
    const scenarioDocument = await prisma.cBMTDocument.create({
      data: {
        macroFrameworkId: baseDocument.macroFrameworkId,
        fiscalYear: baseDocument.fiscalYear,
        documentCode: `${baseDocument.documentCode}-${scenarioType}`,
        title: scenarioName || `${baseDocument.title} - ${scenarioType}`,
        description: description || `Scénario ${scenarioType} dérivé du scénario de base`,
        scenarioName,
        scenarioType,
        parentScenarioId: baseCbmtDocumentId,
        gdpGrowthVariation: new Decimal(gdpVar),
        inflationVariation: new Decimal(inflVar),
        revenueAdjustment: new Decimal(revAdj),
        expenseAdjustment: new Decimal(expAdj),
        totalRevenueCeiling: newRevenueCeiling,
        totalExpenseCeiling: newExpenseCeiling,
        fiscalDeficitCeiling: newDeficitCeiling,
        debtCeiling: baseDocument.debtCeiling,
        currency: baseDocument.currency,
        unit: baseDocument.unit,
        status: 'DRAFT',
        createdBy,
      },
    });

    // Dupliquer et ajuster les agrégats
    for (const aggregate of baseDocument.aggregates) {
      const factor = aggregate.aggregateType === 'REVENUE' ? revenueFactor : expenseFactor;

      await prisma.cBMTAggregate.create({
        data: {
          cbmtDocumentId: scenarioDocument.id,
          aggregateType: aggregate.aggregateType,
          economicNatureId: aggregate.economicNatureId,
          categoryCode: aggregate.categoryCode,
          categoryName: aggregate.categoryName,
          baseYear: aggregate.baseYear,
          baseAmount: aggregate.baseAmount,
          year1: aggregate.year1,
          amount1: new Decimal(aggregate.amount1).mul(factor),
          ceiling1: new Decimal(aggregate.ceiling1 || 0).mul(factor),
          year2: aggregate.year2,
          amount2: new Decimal(aggregate.amount2).mul(factor),
          ceiling2: new Decimal(aggregate.ceiling2 || 0).mul(factor),
          year3: aggregate.year3,
          amount3: new Decimal(aggregate.amount3).mul(factor),
          ceiling3: new Decimal(aggregate.ceiling3 || 0).mul(factor),
          calculationMethod: 'AUTO',
          notes: `Généré automatiquement depuis le scénario de base avec ajustement de ${((factor - 1) * 100).toFixed(1)}%`,
        },
      });
    }

    // Dupliquer et ajuster les réserves
    for (const reserve of baseDocument.reserves) {
      const factor = expenseFactor; // Les réserves sont liées aux dépenses

      await prisma.cBMTReserve.create({
        data: {
          cbmtDocumentId: scenarioDocument.id,
          reserveType: reserve.reserveType,
          name: reserve.name,
          description: reserve.description,
          calculationRate: reserve.calculationRate,
          baseAmount: reserve.baseAmount,
          year1: reserve.year1,
          amount1: new Decimal(reserve.amount1).mul(factor),
          allocated1: new Decimal(0),
          available1: new Decimal(reserve.amount1).mul(factor),
          year2: reserve.year2,
          amount2: new Decimal(reserve.amount2).mul(factor),
          allocated2: new Decimal(0),
          available2: new Decimal(reserve.amount2).mul(factor),
          year3: reserve.year3,
          amount3: new Decimal(reserve.amount3).mul(factor),
          allocated3: new Decimal(0),
          available3: new Decimal(reserve.amount3).mul(factor),
          calculationBasis: reserve.calculationBasis,
          notes: `Ajusté pour le scénario ${scenarioType}`,
        },
      });
    }

    // Retourner le document complet
    return prisma.cBMTDocument.findUnique({
      where: { id: scenarioDocument.id },
      include: {
        aggregates: true,
        reserves: true,
        macroFramework: true,
      },
    });
  }

  /**
   * Créer tous les scénarios standards (optimiste, pessimiste, réaliste)
   */
  static async createAllStandardScenarios(baseCbmtDocumentId: string, createdBy?: string) {
    const scenarios: ScenarioType[] = ['OPTIMISTIC', 'PESSIMISTIC', 'REALISTIC'];
    const results = [];

    for (const scenarioType of scenarios) {
      try {
        const scenario = await this.createScenario({
          baseCbmtDocumentId,
          scenarioType,
          scenarioName: `Scénario ${scenarioType.toLowerCase()}`,
          createdBy,
        });
        results.push({ scenarioType, status: 'created', document: scenario });
      } catch (error: any) {
        results.push({ scenarioType, status: 'error', error: error.message });
      }
    }

    return {
      message: 'Création des scénarios terminée',
      results,
      created: results.filter(r => r.status === 'created').length,
      errors: results.filter(r => r.status === 'error').length,
    };
  }

  /**
   * Obtenir tous les scénarios pour une année fiscale
   */
  static async getScenariosByFiscalYear(macroFrameworkId: string, fiscalYear: number) {
    return prisma.cBMTDocument.findMany({
      where: {
        macroFrameworkId,
        fiscalYear,
      },
      include: {
        aggregates: true,
        reserves: true,
      },
      orderBy: {
        scenarioType: 'asc',
      },
    });
  }

  /**
   * Comparer plusieurs scénarios
   */
  static async compareScenarios(scenarioIds: string[]): Promise<ScenarioComparisonResult> {
    if (scenarioIds.length < 2) {
      throw new BadRequestError('Au moins 2 scénarios sont requis pour la comparaison');
    }

    const scenarios = await prisma.cBMTDocument.findMany({
      where: { id: { in: scenarioIds } },
      include: {
        aggregates: true,
        reserves: true,
      },
    });

    if (scenarios.length !== scenarioIds.length) {
      throw new NotFoundError('Un ou plusieurs scénarios non trouvés');
    }

    // Vérifier que tous les scénarios sont de la même année fiscale
    const fiscalYears = Array.from(new Set(scenarios.map(s => s.fiscalYear)));
    if (fiscalYears.length > 1) {
      throw new BadRequestError('Tous les scénarios doivent être de la même année fiscale');
    }

    // Calculer les résumés pour chaque scénario
    const scenarioSummaries: ScenarioSummary[] = scenarios.map(scenario => {
      const revenueAggregates = scenario.aggregates.filter(a => a.aggregateType === 'REVENUE');
      const expenseAggregates = scenario.aggregates.filter(a => a.aggregateType === 'EXPENSE');

      const totalRevenue = {
        year1: revenueAggregates.reduce((sum, a) => sum + Number(a.amount1), 0),
        year2: revenueAggregates.reduce((sum, a) => sum + Number(a.amount2), 0),
        year3: revenueAggregates.reduce((sum, a) => sum + Number(a.amount3), 0),
      };

      const totalExpense = {
        year1: expenseAggregates.reduce((sum, a) => sum + Number(a.amount1), 0),
        year2: expenseAggregates.reduce((sum, a) => sum + Number(a.amount2), 0),
        year3: expenseAggregates.reduce((sum, a) => sum + Number(a.amount3), 0),
      };

      const reserves = {
        year1: scenario.reserves.reduce((sum, r) => sum + Number(r.amount1), 0),
        year2: scenario.reserves.reduce((sum, r) => sum + Number(r.amount2), 0),
        year3: scenario.reserves.reduce((sum, r) => sum + Number(r.amount3), 0),
      };

      return {
        id: scenario.id,
        scenarioType: scenario.scenarioType,
        scenarioName: scenario.scenarioName,
        totalRevenue,
        totalExpense,
        balance: {
          year1: totalRevenue.year1 - totalExpense.year1,
          year2: totalRevenue.year2 - totalExpense.year2,
          year3: totalRevenue.year3 - totalExpense.year3,
        },
        reserves,
      };
    });

    // Construire les détails de comparaison
    const comparison: ComparisonDetail[] = [];

    // Comparer les recettes totales
    const revenueValues: Record<string, { year1: number; year2: number; year3: number }> = {};
    scenarioSummaries.forEach(s => {
      revenueValues[s.scenarioType] = s.totalRevenue;
    });

    comparison.push({
      metric: 'Recettes totales',
      unit: 'M DJF',
      values: revenueValues,
      variance: this.calculateVariance(scenarioSummaries, 'totalRevenue'),
    });

    // Comparer les dépenses totales
    const expenseValues: Record<string, { year1: number; year2: number; year3: number }> = {};
    scenarioSummaries.forEach(s => {
      expenseValues[s.scenarioType] = s.totalExpense;
    });

    comparison.push({
      metric: 'Dépenses totales',
      unit: 'M DJF',
      values: expenseValues,
      variance: this.calculateVariance(scenarioSummaries, 'totalExpense'),
    });

    // Comparer les soldes budgétaires
    const balanceValues: Record<string, { year1: number; year2: number; year3: number }> = {};
    scenarioSummaries.forEach(s => {
      balanceValues[s.scenarioType] = s.balance;
    });

    comparison.push({
      metric: 'Solde budgétaire',
      unit: 'M DJF',
      values: balanceValues,
      variance: this.calculateVariance(scenarioSummaries, 'balance'),
    });

    // Comparer les réserves
    const reserveValues: Record<string, { year1: number; year2: number; year3: number }> = {};
    scenarioSummaries.forEach(s => {
      reserveValues[s.scenarioType] = s.reserves;
    });

    comparison.push({
      metric: 'Réserves budgétaires',
      unit: 'M DJF',
      values: reserveValues,
      variance: this.calculateVariance(scenarioSummaries, 'reserves'),
    });

    // Générer l'analyse
    const analysis = this.generateComparisonAnalysis(scenarioSummaries, comparison);

    // Sauvegarder l'analyse de comparaison dans le scénario de base
    const baseScenario = scenarios.find(s => s.scenarioType === 'BASE') || scenarios[0];

    await prisma.cBMTAnalysis.create({
      data: {
        cbmtDocumentId: baseScenario.id,
        analysisType: 'SCENARIO_COMPARISON',
        analysisName: 'Comparaison de scénarios',
        description: `Comparaison de ${scenarios.length} scénarios pour l'année fiscale ${baseScenario.fiscalYear}`,
        parameters: { scenarioIds } as any,
        results: { scenarios: scenarioSummaries, comparison } as any,
        keyIndicators: {
          scenariosCompared: scenarios.length,
          volatilityLevel: analysis.riskAssessment.volatilityLevel,
        },
        conclusions: analysis.summary,
        recommendations: analysis.recommendations.join('; '),
        riskLevel: analysis.riskAssessment.volatilityLevel === 'HIGH' ? 'HIGH' : 'MEDIUM',
      },
    });

    return {
      scenarios: scenarioSummaries,
      comparison,
      analysis,
    };
  }

  /**
   * Calculer la variance entre les scénarios pour une métrique donnée
   */
  private static calculateVariance(
    summaries: ScenarioSummary[],
    metric: keyof ScenarioSummary
  ): {
    minScenario: string;
    maxScenario: string;
    range: { year1: number; year2: number; year3: number };
  } {
    const values = summaries.map(s => ({
      type: s.scenarioType,
      data: s[metric] as { year1: number; year2: number; year3: number },
    }));

    const year1Values = values.map(v => ({ type: v.type, value: v.data.year1 }));
    const year2Values = values.map(v => ({ type: v.type, value: v.data.year2 }));
    const year3Values = values.map(v => ({ type: v.type, value: v.data.year3 }));

    const minYear1 = year1Values.reduce((min, v) => v.value < min.value ? v : min);
    const maxYear1 = year1Values.reduce((max, v) => v.value > max.value ? v : max);

    return {
      minScenario: minYear1.type,
      maxScenario: maxYear1.type,
      range: {
        year1: maxYear1.value - minYear1.value,
        year2: Math.max(...year2Values.map(v => v.value)) - Math.min(...year2Values.map(v => v.value)),
        year3: Math.max(...year3Values.map(v => v.value)) - Math.min(...year3Values.map(v => v.value)),
      },
    };
  }

  /**
   * Générer l'analyse de comparaison
   */
  private static generateComparisonAnalysis(
    summaries: ScenarioSummary[],
    comparison: ComparisonDetail[]
  ): ComparisonAnalysis {
    const baseScenario = summaries.find(s => s.scenarioType === 'BASE');
    const optimistic = summaries.find(s => s.scenarioType === 'OPTIMISTIC');
    const pessimistic = summaries.find(s => s.scenarioType === 'PESSIMISTIC');

    const balanceComparison = comparison.find(c => c.metric === 'Solde budgétaire');
    const volatility = balanceComparison
      ? balanceComparison.variance.range.year1 / Math.abs(baseScenario?.balance.year1 || 1) * 100
      : 0;

    const volatilityLevel: 'LOW' | 'MEDIUM' | 'HIGH' =
      volatility < 10 ? 'LOW' : volatility < 25 ? 'MEDIUM' : 'HIGH';

    const keyFindings: string[] = [];

    if (optimistic && baseScenario) {
      const upside = optimistic.balance.year1 - baseScenario.balance.year1;
      keyFindings.push(`Le scénario optimiste améliore le solde de ${upside.toFixed(0)} M DJF`);
    }

    if (pessimistic && baseScenario) {
      const downside = baseScenario.balance.year1 - pessimistic.balance.year1;
      keyFindings.push(`Le scénario pessimiste dégrade le solde de ${downside.toFixed(0)} M DJF`);
    }

    if (balanceComparison) {
      keyFindings.push(`L'écart maximal entre scénarios est de ${balanceComparison.variance.range.year1.toFixed(0)} M DJF`);
    }

    const recommendations: string[] = [];

    if (volatilityLevel === 'HIGH') {
      recommendations.push('Renforcer les mécanismes de réserve budgétaire');
      recommendations.push('Diversifier les sources de recettes');
      recommendations.push('Prévoir des mesures d\'ajustement rapides');
    } else if (volatilityLevel === 'MEDIUM') {
      recommendations.push('Maintenir une surveillance régulière des indicateurs macroéconomiques');
      recommendations.push('Actualiser les projections trimestriellement');
    } else {
      recommendations.push('Poursuivre la trajectoire budgétaire actuelle');
    }

    return {
      summary: `Comparaison de ${summaries.length} scénarios avec un niveau de volatilité ${volatilityLevel}`,
      keyFindings,
      riskAssessment: {
        pessimisticImpact: pessimistic
          ? `Impact négatif de ${((baseScenario?.balance.year1 || 0) - pessimistic.balance.year1).toFixed(0)} M DJF sur le solde`
          : 'Non disponible',
        optimisticUpside: optimistic
          ? `Potentiel d'amélioration de ${(optimistic.balance.year1 - (baseScenario?.balance.year1 || 0)).toFixed(0)} M DJF`
          : 'Non disponible',
        volatilityLevel,
      },
      recommendations,
    };
  }

  /**
   * Supprimer un scénario (sauf le scénario de base)
   */
  static async deleteScenario(scenarioId: string) {
    const scenario = await prisma.cBMTDocument.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new NotFoundError('Scénario non trouvé');
    }

    if (scenario.scenarioType === 'BASE') {
      throw new BadRequestError('Le scénario de base ne peut pas être supprimé');
    }

    await prisma.cBMTDocument.delete({
      where: { id: scenarioId },
    });

    return { message: `Scénario ${scenario.scenarioType} supprimé avec succès` };
  }
}

export default CBMTScenarioService;
