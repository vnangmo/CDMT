import prisma from '../config/database';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface SensitivityAnalysisParams {
  gdpGrowthVariation?: number; // Variation en points de pourcentage
  inflationVariation?: number;
}

interface ShockSimulationParams {
  shockType: string; // REVENUE_SHOCK, EXPENSE_SHOCK, COMBINED_SHOCK
  magnitude: number; // Ampleur du choc en pourcentage
  duration: number; // Nombre d'années
}

interface SensitivityResult {
  scenario: string;
  gdpGrowthRate: number;
  inflationRate: number;
  years: Array<{
    year: number;
    totalRevenue: number;
    totalExpense: number;
    fiscalBalance: number;
    revenueChange: number;
    expenseChange: number;
    balanceChange: number;
  }>;
  averageImpact: {
    revenueChange: number;
    expenseChange: number;
    balanceChange: number;
  };
  riskLevel: string;
}

interface ShockSimulationResult {
  shockType: string;
  magnitude: number;
  duration: number;
  years: Array<{
    year: number;
    baselineRevenue: number;
    shockedRevenue: number;
    baselineExpense: number;
    shockedExpense: number;
    baselineBalance: number;
    shockedBalance: number;
    revenueImpact: number;
    expenseImpact: number;
    balanceImpact: number;
  }>;
  recoveryTime: number | null; // Nombre d'années pour revenir à l'équilibre
  cumulativeImpact: number;
  riskLevel: string;
}

interface SustainabilityRatios {
  year: number;
  debtToGDPRatio: number;
  fiscalBalanceToGDPRatio: number;
  revenueToGDPRatio: number;
  expenseToGDPRatio: number;
  debtServiceToRevenueRatio: number;
  primaryBalanceToGDPRatio: number;
  sustainabilityScore: number; // 0-100
  isSustainable: boolean;
  warnings: string[];
}

export class CBMTAnalysisService {
  /**
   * Analyse de sensibilité aux hypothèses macroéconomiques
   */
  static async runSensitivityAnalysis(
    cbmtDocumentId: string,
    params: SensitivityAnalysisParams,
    userId?: string
  ): Promise<SensitivityResult[]> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        macroFramework: true,
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const { gdpGrowthVariation = 0, inflationVariation = 0 } = params;

    // Scénario de base
    const baseGdpGrowth = document.macroFramework.gdpGrowthRate.toNumber();
    const baseInflation = document.macroFramework.inflationRate.toNumber();

    // Générer 3 scénarios: pessimiste, base, optimiste
    const scenarios = [
      {
        name: 'Pessimiste',
        gdpVariation: -gdpGrowthVariation,
        inflationVariation: inflationVariation,
      },
      {
        name: 'Base',
        gdpVariation: 0,
        inflationVariation: 0,
      },
      {
        name: 'Optimiste',
        gdpVariation: gdpGrowthVariation,
        inflationVariation: -inflationVariation,
      },
    ];

    const results: SensitivityResult[] = [];

    for (const scenario of scenarios) {
      const adjustedGdpGrowth = baseGdpGrowth + scenario.gdpVariation;
      const adjustedInflation = baseInflation + scenario.inflationVariation;

      const years = [];

      for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
        // Calculer l'impact sur les recettes (liées à la croissance du PIB)
        const baseRevenue = document.aggregates
          .filter((a) => a.aggregateType === 'REVENUE')
          .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

        const revenueGrowthFactor = 1 + (adjustedGdpGrowth / baseGdpGrowth - 1);
        const adjustedRevenue = baseRevenue * revenueGrowthFactor;

        // Calculer l'impact sur les dépenses (liées à l'inflation)
        const baseExpense = document.aggregates
          .filter((a) => a.aggregateType === 'EXPENSE')
          .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

        const expenseGrowthFactor = 1 + (adjustedInflation / baseInflation - 1);
        const adjustedExpense = baseExpense * expenseGrowthFactor;

        const baseBalance = baseRevenue - baseExpense;
        const adjustedBalance = adjustedRevenue - adjustedExpense;

        const year = document.aggregates[0][`year${yearIndex}` as keyof typeof document.aggregates[0]];

        years.push({
          year: year as number,
          totalRevenue: adjustedRevenue,
          totalExpense: adjustedExpense,
          fiscalBalance: adjustedBalance,
          revenueChange: adjustedRevenue - baseRevenue,
          expenseChange: adjustedExpense - baseExpense,
          balanceChange: adjustedBalance - baseBalance,
        });
      }

      const averageRevenueChange =
        years.reduce((sum, y) => sum + y.revenueChange, 0) / years.length;
      const averageExpenseChange =
        years.reduce((sum, y) => sum + y.expenseChange, 0) / years.length;
      const averageBalanceChange =
        years.reduce((sum, y) => sum + y.balanceChange, 0) / years.length;

      const riskLevel = this.assessSensitivityRisk(averageBalanceChange, years[0].totalRevenue);

      results.push({
        scenario: scenario.name,
        gdpGrowthRate: adjustedGdpGrowth,
        inflationRate: adjustedInflation,
        years,
        averageImpact: {
          revenueChange: averageRevenueChange,
          expenseChange: averageExpenseChange,
          balanceChange: averageBalanceChange,
        },
        riskLevel,
      });
    }

    // Sauvegarder l'analyse
    await prisma.cBMTAnalysis.create({
      data: {
        cbmtDocumentId,
        analysisType: 'SENSITIVITY',
        analysisName: 'Analyse de sensibilité aux hypothèses macro',
        description: `Variation PIB: ±${gdpGrowthVariation}%, Variation Inflation: ±${inflationVariation}%`,
        parameters: {
          gdpGrowthVariation,
          inflationVariation,
        } as any,
        results: results as any,
        keyIndicators: {
          pessimisticImpact: results[0].averageImpact,
          optimisticImpact: results[2].averageImpact,
          volatility:
            Math.abs(results[0].averageImpact.balanceChange) +
            Math.abs(results[2].averageImpact.balanceChange),
        },
        conclusions: this.generateSensitivityConclusions(results),
        recommendations: this.generateSensitivityRecommendations(results),
        riskLevel: results[0].riskLevel,
        calculatedBy: userId,
      },
    });

    return results;
  }

  /**
   * Simulation de chocs budgétaires
   */
  static async runShockSimulation(
    cbmtDocumentId: string,
    params: ShockSimulationParams,
    userId?: string
  ): Promise<ShockSimulationResult> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    const { shockType, magnitude, duration } = params;

    const years = [];
    let cumulativeImpact = 0;
    let recoveryTime: number | null = null;

    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const baseRevenue = document.aggregates
        .filter((a) => a.aggregateType === 'REVENUE')
        .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

      const baseExpense = document.aggregates
        .filter((a) => a.aggregateType === 'EXPENSE')
        .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

      const baseBalance = baseRevenue - baseExpense;

      let shockedRevenue = baseRevenue;
      let shockedExpense = baseExpense;

      // Appliquer le choc selon le type et la durée
      if (yearIndex <= duration) {
        switch (shockType) {
          case 'REVENUE_SHOCK':
            shockedRevenue = baseRevenue * (1 - magnitude / 100);
            break;
          case 'EXPENSE_SHOCK':
            shockedExpense = baseExpense * (1 + magnitude / 100);
            break;
          case 'COMBINED_SHOCK':
            shockedRevenue = baseRevenue * (1 - magnitude / 100);
            shockedExpense = baseExpense * (1 + magnitude / 100);
            break;
        }
      }

      const shockedBalance = shockedRevenue - shockedExpense;
      const balanceImpact = shockedBalance - baseBalance;
      cumulativeImpact += balanceImpact;

      const year = document.aggregates[0][`year${yearIndex}` as keyof typeof document.aggregates[0]];

      years.push({
        year: year as number,
        baselineRevenue: baseRevenue,
        shockedRevenue,
        baselineExpense: baseExpense,
        shockedExpense,
        baselineBalance: baseBalance,
        shockedBalance,
        revenueImpact: shockedRevenue - baseRevenue,
        expenseImpact: shockedExpense - baseExpense,
        balanceImpact,
      });

      // Déterminer le temps de récupération
      if (recoveryTime === null && Math.abs(balanceImpact) < 0.01 * baseRevenue && yearIndex > duration) {
        recoveryTime = yearIndex - duration;
      }
    }

    const riskLevel = this.assessShockRisk(cumulativeImpact, years[0].baselineRevenue);

    const result: ShockSimulationResult = {
      shockType,
      magnitude,
      duration,
      years,
      recoveryTime,
      cumulativeImpact,
      riskLevel,
    };

    // Sauvegarder l'analyse
    await prisma.cBMTAnalysis.create({
      data: {
        cbmtDocumentId,
        analysisType: 'SHOCK',
        analysisName: `Simulation de choc ${shockType}`,
        description: `Choc de ${magnitude}% sur ${duration} année(s)`,
        parameters: params as any,
        results: result as any,
        keyIndicators: {
          cumulativeImpact,
          recoveryTime,
          maxImpact: Math.min(...years.map((y) => y.balanceImpact)),
        },
        conclusions: this.generateShockConclusions(result),
        recommendations: this.generateShockRecommendations(result),
        riskLevel,
        calculatedBy: userId,
      },
    });

    return result;
  }

  /**
   * Calcul des ratios de soutenabilité budgétaire
   */
  static async calculateSustainabilityRatios(
    cbmtDocumentId: string,
    gdpProjections: number[], // PIB pour chaque année
    userId?: string
  ): Promise<SustainabilityRatios[]> {
    const document = await prisma.cBMTDocument.findUnique({
      where: { id: cbmtDocumentId },
      include: {
        aggregates: true,
      },
    });

    if (!document) {
      throw new NotFoundError('Document CBMT non trouvé');
    }

    if (gdpProjections.length !== 3) {
      throw new BadRequestError('Veuillez fournir les projections du PIB pour 3 années');
    }

    const ratios: SustainabilityRatios[] = [];

    for (let yearIndex = 1; yearIndex <= 3; yearIndex++) {
      const gdp = gdpProjections[yearIndex - 1];

      const revenue = document.aggregates
        .filter((a) => a.aggregateType === 'REVENUE')
        .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

      const expense = document.aggregates
        .filter((a) => a.aggregateType === 'EXPENSE')
        .reduce((sum, a) => sum + Number(a[`amount${yearIndex}` as keyof typeof a] || 0), 0);

      const fiscalBalance = revenue - expense;

      // Ratios de soutenabilité
      const debtToGDPRatio = (Number(document.debtCeiling || 0)) / gdp * 100;
      const fiscalBalanceToGDPRatio = fiscalBalance / gdp * 100;
      const revenueToGDPRatio = revenue / gdp * 100;
      const expenseToGDPRatio = expense / gdp * 100;
      const debtServiceToRevenueRatio = 0; // À calculer si données disponibles
      const primaryBalanceToGDPRatio = fiscalBalanceToGDPRatio; // Simplifié

      // Score de soutenabilité (0-100)
      const warnings: string[] = [];
      let score = 100;

      if (debtToGDPRatio > 60) {
        score -= 30;
        warnings.push('Dette publique excessive (>60% du PIB)');
      } else if (debtToGDPRatio > 40) {
        score -= 15;
        warnings.push('Dette publique élevée (>40% du PIB)');
      }

      if (fiscalBalanceToGDPRatio < -3) {
        score -= 25;
        warnings.push('Déficit budgétaire important (>3% du PIB)');
      } else if (fiscalBalanceToGDPRatio < 0) {
        score -= 10;
        warnings.push('Déficit budgétaire');
      }

      if (revenueToGDPRatio < 15) {
        score -= 20;
        warnings.push('Mobilisation des recettes insuffisante (<15% du PIB)');
      }

      if (expenseToGDPRatio > 25) {
        score -= 15;
        warnings.push('Dépenses publiques élevées (>25% du PIB)');
      }

      const year = document.aggregates[0][`year${yearIndex}` as keyof typeof document.aggregates[0]];

      ratios.push({
        year: year as number,
        debtToGDPRatio,
        fiscalBalanceToGDPRatio,
        revenueToGDPRatio,
        expenseToGDPRatio,
        debtServiceToRevenueRatio,
        primaryBalanceToGDPRatio,
        sustainabilityScore: Math.max(0, score),
        isSustainable: score >= 60,
        warnings,
      });
    }

    // Sauvegarder l'analyse
    await prisma.cBMTAnalysis.create({
      data: {
        cbmtDocumentId,
        analysisType: 'SUSTAINABILITY',
        analysisName: 'Analyse de soutenabilité budgétaire',
        description: 'Ratios clés de soutenabilité budgétaire',
        parameters: { gdpProjections } as any,
        results: ratios as any,
        keyIndicators: {
          averageScore: ratios.reduce((sum, r) => sum + r.sustainabilityScore, 0) / ratios.length,
          isSustainable: ratios.every((r) => r.isSustainable),
          criticalRatios: ratios.flatMap((r) => r.warnings),
        },
        conclusions: this.generateSustainabilityConclusions(ratios),
        recommendations: this.generateSustainabilityRecommendations(ratios),
        riskLevel: this.assessSustainabilityRisk(ratios),
        calculatedBy: userId,
      },
    });

    return ratios;
  }

  /**
   * Obtenir toutes les analyses d'un document CBMT
   */
  static async getAnalyses(cbmtDocumentId: string, analysisType?: string) {
    const where: any = { cbmtDocumentId };

    if (analysisType) {
      where.analysisType = analysisType;
    }

    return prisma.cBMTAnalysis.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtenir une analyse par ID
   */
  static async getAnalysisById(id: string) {
    const analysis = await prisma.cBMTAnalysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      throw new NotFoundError('Analyse non trouvée');
    }

    return analysis;
  }

  /**
   * Supprimer une analyse
   */
  static async deleteAnalysis(id: string) {
    await this.getAnalysisById(id);

    await prisma.cBMTAnalysis.delete({
      where: { id },
    });

    return { message: 'Analyse supprimée avec succès' };
  }

  // Fonctions utilitaires privées

  private static assessSensitivityRisk(balanceChange: number, totalRevenue: number): string {
    const impactPercentage = Math.abs(balanceChange / totalRevenue) * 100;

    if (impactPercentage < 2) return 'LOW';
    if (impactPercentage < 5) return 'MEDIUM';
    if (impactPercentage < 10) return 'HIGH';
    return 'CRITICAL';
  }

  private static assessShockRisk(cumulativeImpact: number, baseRevenue: number): string {
    const impactPercentage = Math.abs(cumulativeImpact / baseRevenue) * 100;

    if (impactPercentage < 5) return 'LOW';
    if (impactPercentage < 10) return 'MEDIUM';
    if (impactPercentage < 20) return 'HIGH';
    return 'CRITICAL';
  }

  private static assessSustainabilityRisk(ratios: SustainabilityRatios[]): string {
    const averageScore = ratios.reduce((sum, r) => sum + r.sustainabilityScore, 0) / ratios.length;

    if (averageScore >= 80) return 'LOW';
    if (averageScore >= 60) return 'MEDIUM';
    if (averageScore >= 40) return 'HIGH';
    return 'CRITICAL';
  }

  private static generateSensitivityConclusions(results: SensitivityResult[]): string {
    const pessimistic = results[0];
    const optimistic = results[2];

    return `L'analyse de sensibilité montre une volatilité budgétaire avec un impact moyen de ${pessimistic.averageImpact.balanceChange.toFixed(2)} M DJF dans le scénario pessimiste et ${optimistic.averageImpact.balanceChange.toFixed(2)} M DJF dans le scénario optimiste.`;
  }

  private static generateSensitivityRecommendations(results: SensitivityResult[]): string {
    const pessimistic = results[0];

    if (pessimistic.riskLevel === 'HIGH' || pessimistic.riskLevel === 'CRITICAL') {
      return 'Recommandations: (1) Renforcer la mobilisation des recettes internes, (2) Diversifier les sources de financement, (3) Constituer des réserves budgétaires suffisantes.';
    }

    return 'Recommandations: Maintenir la vigilance sur les hypothèses macroéconomiques et réviser régulièrement les projections.';
  }

  private static generateShockConclusions(result: ShockSimulationResult): string {
    return `La simulation de choc ${result.shockType} de ${result.magnitude}% sur ${result.duration} année(s) entraîne un impact cumulatif de ${result.cumulativeImpact.toFixed(2)} M DJF. Temps de récupération estimé: ${result.recoveryTime || 'indéterminé'} année(s).`;
  }

  private static generateShockRecommendations(result: ShockSimulationResult): string {
    if (result.riskLevel === 'CRITICAL') {
      return 'Recommandations urgentes: (1) Activer les mécanismes de réponse aux crises, (2) Mobiliser les réserves budgétaires, (3) Réviser les priorités de dépenses, (4) Rechercher un soutien budgétaire d\'urgence.';
    }

    return 'Recommandations: Renforcer les mécanismes de protection budgétaire et constituer des coussins de sécurité.';
  }

  private static generateSustainabilityConclusions(ratios: SustainabilityRatios[]): string {
    const isSustainable = ratios.every((r) => r.isSustainable);
    const averageScore = ratios.reduce((sum, r) => sum + r.sustainabilityScore, 0) / ratios.length;

    return `La trajectoire budgétaire est ${isSustainable ? 'soutenable' : 'non soutenable'} avec un score moyen de ${averageScore.toFixed(1)}/100.`;
  }

  private static generateSustainabilityRecommendations(ratios: SustainabilityRatios[]): string {
    const criticalWarnings = ratios.flatMap((r) => r.warnings);

    if (criticalWarnings.length > 0) {
      return `Recommandations prioritaires: (1) Réduire le déficit budgétaire, (2) Améliorer la mobilisation des recettes, (3) Maîtriser la croissance des dépenses, (4) Gérer activement la dette publique.`;
    }

    return 'Recommandations: Maintenir la discipline budgétaire et poursuivre les réformes structurelles.';
  }
}

export default CBMTAnalysisService;
