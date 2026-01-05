import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

/**
 * CDSMT Synthesis Service
 *
 * Ce service implémente la Maquette CDSMT conforme au Guide Méthodologique CDMT
 * de la République de Djibouti (Figure 10, page 38).
 *
 * Structure de la Maquette CDSMT:
 * - Par Programme → Action → Activité
 * - Colonnes: Tendanciel, Mesures Nouvelles, Prévisions (pour chaque année N+1, N+2, N+3)
 * - Catégories économiques: Personnel, Biens et services, Transferts, Investissements internes, Investissements externes
 */

// Types pour les catégories économiques selon le guide
export enum EconomicCategoryType {
  PERSONNEL = 'PERSONNEL',                    // Dépenses de personnel
  GOODS_SERVICES = 'GOODS_SERVICES',          // Biens et services
  TRANSFERS = 'TRANSFERS',                    // Transferts
  INTERNAL_INVESTMENT = 'INTERNAL_INVESTMENT', // Investissements internes (financement national)
  EXTERNAL_INVESTMENT = 'EXTERNAL_INVESTMENT', // Investissements externes (financement extérieur)
}

// Types de mesures nouvelles selon le guide (page 18)
export enum NewMeasureType {
  TYPE_1 = 'TYPE_1', // Mesures centrales (niveau gouvernemental)
  TYPE_2 = 'TYPE_2', // Mesures sectorielles (niveau ministériel)
}

// Interface pour une ligne CDSMT
export interface CDSMTLine {
  code: string;
  label: string;
  level: 'PROGRAM' | 'ACTION' | 'ACTIVITY' | 'ECONOMIC_CATEGORY';
  economicCategory?: EconomicCategoryType;

  // Année N+1
  tendancielY1: number;
  mesuresNouvellesY1: number;
  previsionsY1: number;

  // Année N+2
  tendancielY2: number;
  mesuresNouvellesY2: number;
  previsionsY2: number;

  // Année N+3
  tendancielY3: number;
  mesuresNouvellesY3: number;
  previsionsY3: number;

  // Total sur 3 ans
  totalTendanciel: number;
  totalMesuresNouvelles: number;
  totalPrevisions: number;

  // Enfants (pour structure hiérarchique)
  children?: CDSMTLine[];
}

// Interface pour le résumé ministériel
export interface MinistrySDMTSummary {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  fiscalYear: number;

  // Plafond CDMT Global
  ceilingY1: number;
  ceilingY2: number;
  ceilingY3: number;

  // Totaux calculés
  totalTendancielY1: number;
  totalTendancielY2: number;
  totalTendancielY3: number;

  totalMesuresNouvellesY1: number;
  totalMesuresNouvellesY2: number;
  totalMesuresNouvellesY3: number;

  totalPrevisionsY1: number;
  totalPrevisionsY2: number;
  totalPrevisionsY3: number;

  // Écart par rapport au plafond
  gapY1: number;
  gapY2: number;
  gapY3: number;

  // Respect du plafond
  respectsCeilingY1: boolean;
  respectsCeilingY2: boolean;
  respectsCeilingY3: boolean;

  // Détail par programme
  programs: CDSMTLine[];

  // Détail par catégorie économique
  byEconomicCategory: {
    personnel: { tendanciel: number[]; mesuresNouvelles: number[]; previsions: number[] };
    goodsServices: { tendanciel: number[]; mesuresNouvelles: number[]; previsions: number[] };
    transfers: { tendanciel: number[]; mesuresNouvelles: number[]; previsions: number[] };
    internalInvestment: { tendanciel: number[]; mesuresNouvelles: number[]; previsions: number[] };
    externalInvestment: { tendanciel: number[]; mesuresNouvelles: number[]; previsions: number[] };
  };
}

export class CDSMTSynthesisService {
  /**
   * Générer la synthèse CDSMT complète pour un ministère
   * Format conforme à la Maquette CDSMT (Figure 10 du guide)
   */
  static async generateMinistrySDMT(
    ministryId: string,
    fiscalYear: number
  ): Promise<MinistrySDMTSummary> {
    // Récupérer le ministère
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId },
    });

    if (!ministry) {
      throw new NotFoundError('Ministère non trouvé');
    }

    // Récupérer les plafonds CDMT Global
    const ceilings = await this.getCDMTGlobalCeilings(ministryId, fiscalYear);

    // Récupérer les projections tendancielles
    const tendancielData = await this.getTendancielByMinistry(ministryId, fiscalYear);

    // Récupérer les mesures nouvelles sectorielles (Type 2)
    const sectoralMeasures = await this.getSectoralMeasures(ministryId, fiscalYear);

    // Récupérer les mesures nouvelles centrales (Type 1) qui affectent ce ministère
    const centralMeasures = await this.getCentralMeasures(ministryId, fiscalYear);

    // Construire la structure programmatique
    const programs = await this.buildProgrammaticStructure(
      ministryId,
      fiscalYear,
      tendancielData,
      [...sectoralMeasures, ...centralMeasures]
    );

    // Calculer les totaux par catégorie économique
    const byEconomicCategory = await this.calculateByEconomicCategory(
      ministryId,
      fiscalYear,
      tendancielData,
      sectoralMeasures
    );

    // Calculer les totaux
    const totals = this.calculateTotals(programs);

    // Calculer les écarts avec les plafonds
    const gapY1 = ceilings.ceilingY1 - totals.previsionsY1;
    const gapY2 = ceilings.ceilingY2 - totals.previsionsY2;
    const gapY3 = ceilings.ceilingY3 - totals.previsionsY3;

    return {
      ministryId,
      ministryCode: ministry.code,
      ministryName: ministry.name,
      fiscalYear,

      ceilingY1: ceilings.ceilingY1,
      ceilingY2: ceilings.ceilingY2,
      ceilingY3: ceilings.ceilingY3,

      totalTendancielY1: totals.tendancielY1,
      totalTendancielY2: totals.tendancielY2,
      totalTendancielY3: totals.tendancielY3,

      totalMesuresNouvellesY1: totals.mesuresNouvellesY1,
      totalMesuresNouvellesY2: totals.mesuresNouvellesY2,
      totalMesuresNouvellesY3: totals.mesuresNouvellesY3,

      totalPrevisionsY1: totals.previsionsY1,
      totalPrevisionsY2: totals.previsionsY2,
      totalPrevisionsY3: totals.previsionsY3,

      gapY1,
      gapY2,
      gapY3,

      respectsCeilingY1: totals.previsionsY1 <= ceilings.ceilingY1,
      respectsCeilingY2: totals.previsionsY2 <= ceilings.ceilingY2,
      respectsCeilingY3: totals.previsionsY3 <= ceilings.ceilingY3,

      programs,
      byEconomicCategory,
    };
  }

  /**
   * Récupérer les plafonds CDMT Global pour un ministère
   */
  private static async getCDMTGlobalCeilings(
    ministryId: string,
    fiscalYear: number
  ): Promise<{ ceilingY1: number; ceilingY2: number; ceilingY3: number }> {
    // Trouver le scénario CDMT Global actif
    const scenario = await prisma.cDMTGlobalScenario.findFirst({
      where: {
        fiscalYear,
        isActive: true,
      },
      include: {
        ministerialCeilings: {
          where: { ministryId },
        },
      },
    });

    if (!scenario) {
      return { ceilingY1: 0, ceilingY2: 0, ceilingY3: 0 };
    }

    const ceilings = scenario.ministerialCeilings;

    return {
      ceilingY1: ceilings
        .filter(c => c.year === fiscalYear + 1)
        .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0),
      ceilingY2: ceilings
        .filter(c => c.year === fiscalYear + 2)
        .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0),
      ceilingY3: ceilings
        .filter(c => c.year === fiscalYear + 3)
        .reduce((sum, c) => sum + parseFloat(c.ceiling.toString()), 0),
    };
  }

  /**
   * Récupérer les données tendancielles par ministère
   */
  private static async getTendancielByMinistry(
    ministryId: string,
    fiscalYear: number
  ): Promise<any[]> {
    // Trouver la config tendancielle validée/approuvée pour l'année fiscale
    const config = await prisma.trendBudgetConfig.findFirst({
      where: {
        fiscalYear,
        status: { in: ['VALIDATED', 'APPROVED'] },
      },
    });

    if (!config) {
      return [];
    }

    return await prisma.trendProjection.findMany({
      where: {
        trendConfigId: config.id,
        ministryId,
      },
      include: {
        program: true,
        action: true,
        activity: true,
        economicNature: true,
        fundingSource: true,
      },
    });
  }

  /**
   * Récupérer les mesures nouvelles sectorielles (Type 2)
   */
  private static async getSectoralMeasures(
    ministryId: string,
    fiscalYear: number
  ): Promise<any[]> {
    return await prisma.sectoralMeasure.findMany({
      where: {
        ministryId,
        fiscalYear,
        status: { in: ['VALIDATED', 'INTEGRATED', 'APPROVED'] },
      },
      include: {
        program: true,
        action: true,
        activity: true,
        economicNature: true,
        fundingSource: true,
      },
    });
  }

  /**
   * Récupérer les mesures nouvelles centrales (Type 1) qui affectent ce ministère
   * Note: Le champ measureType sera disponible après migration Prisma
   */
  private static async getCentralMeasures(
    ministryId: string,
    fiscalYear: number
  ): Promise<any[]> {
    // Trouver le scénario actif
    const scenario = await prisma.cDMTGlobalScenario.findFirst({
      where: {
        fiscalYear,
        isActive: true,
      },
    });

    if (!scenario) {
      return [];
    }

    // Récupérer les mesures de politique du scénario
    // TODO: Filtrer par measureType = 'TYPE_1' après migration Prisma
    return await prisma.policyMeasure.findMany({
      where: {
        scenarioId: scenario.id,
        ministryId,
        status: { in: ['VALIDATED', 'APPROVED'] },
      },
    });
  }

  /**
   * Construire la structure programmatique hiérarchique
   */
  private static async buildProgrammaticStructure(
    ministryId: string,
    fiscalYear: number,
    tendancielData: any[],
    measures: any[]
  ): Promise<CDSMTLine[]> {
    // Récupérer tous les programmes du ministère
    const programs = await prisma.program.findMany({
      where: { ministryId, isActive: true },
      include: {
        actions: {
          where: { isActive: true },
          include: {
            activities: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    return programs.map(program => {
      // Filtrer les données pour ce programme
      const programTendanciel = tendancielData.filter(t => t.programId === program.id);
      const programMeasures = measures.filter(m => m.programId === program.id);

      // Calculer les totaux tendanciels du programme
      const tendancielY1 = programTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount1.toString()), 0);
      const tendancielY2 = programTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount2.toString()), 0);
      const tendancielY3 = programTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount3.toString()), 0);

      // Calculer les mesures nouvelles du programme
      const mesuresNouvellesY1 = programMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY1?.toString() || m.amountY1?.toString() || '0'), 0);
      const mesuresNouvellesY2 = programMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY2?.toString() || m.amountY2?.toString() || '0'), 0);
      const mesuresNouvellesY3 = programMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY3?.toString() || m.amountY3?.toString() || '0'), 0);

      // Construire les actions
      const actionLines: CDSMTLine[] = program.actions.map(action => {
        const actionTendanciel = programTendanciel.filter(t => t.actionId === action.id);
        const actionMeasures = programMeasures.filter(m => m.actionId === action.id);

        const actTendancielY1 = actionTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount1.toString()), 0);
        const actTendancielY2 = actionTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount2.toString()), 0);
        const actTendancielY3 = actionTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount3.toString()), 0);

        const actMesuresY1 = actionMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY1?.toString() || m.amountY1?.toString() || '0'), 0);
        const actMesuresY2 = actionMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY2?.toString() || m.amountY2?.toString() || '0'), 0);
        const actMesuresY3 = actionMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY3?.toString() || m.amountY3?.toString() || '0'), 0);

        // Construire les activités
        const activityLines: CDSMTLine[] = action.activities.map(activity => {
          const activityTendanciel = actionTendanciel.filter(t => t.activityId === activity.id);
          const activityMeasures = actionMeasures.filter(m => m.activityId === activity.id);

          const tY1 = activityTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount1.toString()), 0);
          const tY2 = activityTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount2.toString()), 0);
          const tY3 = activityTendanciel.reduce((sum, t) => sum + parseFloat(t.projectedAmount3.toString()), 0);

          const mY1 = activityMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY1?.toString() || m.amountY1?.toString() || '0'), 0);
          const mY2 = activityMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY2?.toString() || m.amountY2?.toString() || '0'), 0);
          const mY3 = activityMeasures.reduce((sum, m) => sum + parseFloat(m.totalCostY3?.toString() || m.amountY3?.toString() || '0'), 0);

          return {
            code: activity.code,
            label: activity.name,
            level: 'ACTIVITY' as const,
            tendancielY1: tY1,
            mesuresNouvellesY1: mY1,
            previsionsY1: tY1 + mY1,
            tendancielY2: tY2,
            mesuresNouvellesY2: mY2,
            previsionsY2: tY2 + mY2,
            tendancielY3: tY3,
            mesuresNouvellesY3: mY3,
            previsionsY3: tY3 + mY3,
            totalTendanciel: tY1 + tY2 + tY3,
            totalMesuresNouvelles: mY1 + mY2 + mY3,
            totalPrevisions: tY1 + tY2 + tY3 + mY1 + mY2 + mY3,
          };
        });

        return {
          code: action.code,
          label: action.name,
          level: 'ACTION' as const,
          tendancielY1: actTendancielY1,
          mesuresNouvellesY1: actMesuresY1,
          previsionsY1: actTendancielY1 + actMesuresY1,
          tendancielY2: actTendancielY2,
          mesuresNouvellesY2: actMesuresY2,
          previsionsY2: actTendancielY2 + actMesuresY2,
          tendancielY3: actTendancielY3,
          mesuresNouvellesY3: actMesuresY3,
          previsionsY3: actTendancielY3 + actMesuresY3,
          totalTendanciel: actTendancielY1 + actTendancielY2 + actTendancielY3,
          totalMesuresNouvelles: actMesuresY1 + actMesuresY2 + actMesuresY3,
          totalPrevisions: actTendancielY1 + actTendancielY2 + actTendancielY3 + actMesuresY1 + actMesuresY2 + actMesuresY3,
          children: activityLines,
        };
      });

      return {
        code: program.code,
        label: program.name,
        level: 'PROGRAM' as const,
        tendancielY1,
        mesuresNouvellesY1,
        previsionsY1: tendancielY1 + mesuresNouvellesY1,
        tendancielY2,
        mesuresNouvellesY2,
        previsionsY2: tendancielY2 + mesuresNouvellesY2,
        tendancielY3,
        mesuresNouvellesY3,
        previsionsY3: tendancielY3 + mesuresNouvellesY3,
        totalTendanciel: tendancielY1 + tendancielY2 + tendancielY3,
        totalMesuresNouvelles: mesuresNouvellesY1 + mesuresNouvellesY2 + mesuresNouvellesY3,
        totalPrevisions: tendancielY1 + tendancielY2 + tendancielY3 + mesuresNouvellesY1 + mesuresNouvellesY2 + mesuresNouvellesY3,
        children: actionLines,
      };
    });
  }

  /**
   * Calculer les montants par catégorie économique
   * Conforme au guide: Personnel, B&S, Transferts, Investissements internes/externes
   */
  private static async calculateByEconomicCategory(
    ministryId: string,
    fiscalYear: number,
    tendancielData: any[],
    sectoralMeasures: any[]
  ) {
    // Mapping des natures économiques vers les catégories du guide
    const economicNatures = await prisma.economicNature.findMany();

    const categoryMapping: Record<string, EconomicCategoryType> = {};
    for (const nature of economicNatures) {
      // Mapper selon le code ou le nom
      const code = nature.code.toString();
      if (code.startsWith('1') || nature.name.toLowerCase().includes('personnel')) {
        categoryMapping[nature.id] = EconomicCategoryType.PERSONNEL;
      } else if (code.startsWith('2') || nature.name.toLowerCase().includes('bien') || nature.name.toLowerCase().includes('service')) {
        categoryMapping[nature.id] = EconomicCategoryType.GOODS_SERVICES;
      } else if (code.startsWith('3') || nature.name.toLowerCase().includes('transfert')) {
        categoryMapping[nature.id] = EconomicCategoryType.TRANSFERS;
      } else if (code.startsWith('4') || code.startsWith('5')) {
        // Vérifier si financement interne ou externe
        categoryMapping[nature.id] = EconomicCategoryType.INTERNAL_INVESTMENT;
      } else {
        categoryMapping[nature.id] = EconomicCategoryType.GOODS_SERVICES; // Par défaut
      }
    }

    // Sources de financement externes
    // Note: Le champ isExternal sera disponible après migration Prisma
    // En attendant, on utilise le code et le nom pour identifier les sources externes
    const externalFundingSources = await prisma.fundingSource.findMany({
      where: {
        OR: [
          { code: { contains: 'EXT' } },
          { name: { contains: 'externe' } },
          { name: { contains: 'Externe' } },
          { name: { contains: 'PTF' } },
          { name: { contains: 'Donor' } },
          { type: { contains: 'EXTERNAL' } },
        ],
      },
    });
    const externalSourceIds = new Set(externalFundingSources.map(f => f.id));

    // Initialiser les résultats
    const result = {
      personnel: { tendanciel: [0, 0, 0], mesuresNouvelles: [0, 0, 0], previsions: [0, 0, 0] },
      goodsServices: { tendanciel: [0, 0, 0], mesuresNouvelles: [0, 0, 0], previsions: [0, 0, 0] },
      transfers: { tendanciel: [0, 0, 0], mesuresNouvelles: [0, 0, 0], previsions: [0, 0, 0] },
      internalInvestment: { tendanciel: [0, 0, 0], mesuresNouvelles: [0, 0, 0], previsions: [0, 0, 0] },
      externalInvestment: { tendanciel: [0, 0, 0], mesuresNouvelles: [0, 0, 0], previsions: [0, 0, 0] },
    };

    // Traiter les données tendancielles
    for (const item of tendancielData) {
      let category = categoryMapping[item.economicNatureId] || EconomicCategoryType.GOODS_SERVICES;

      // Si c'est un investissement, vérifier le financement
      if (category === EconomicCategoryType.INTERNAL_INVESTMENT && externalSourceIds.has(item.fundingSourceId)) {
        category = EconomicCategoryType.EXTERNAL_INVESTMENT;
      }

      const amounts = [
        parseFloat(item.projectedAmount1.toString()),
        parseFloat(item.projectedAmount2.toString()),
        parseFloat(item.projectedAmount3.toString()),
      ];

      switch (category) {
        case EconomicCategoryType.PERSONNEL:
          amounts.forEach((amt, i) => {
            result.personnel.tendanciel[i] += amt;
            result.personnel.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.GOODS_SERVICES:
          amounts.forEach((amt, i) => {
            result.goodsServices.tendanciel[i] += amt;
            result.goodsServices.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.TRANSFERS:
          amounts.forEach((amt, i) => {
            result.transfers.tendanciel[i] += amt;
            result.transfers.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.INTERNAL_INVESTMENT:
          amounts.forEach((amt, i) => {
            result.internalInvestment.tendanciel[i] += amt;
            result.internalInvestment.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.EXTERNAL_INVESTMENT:
          amounts.forEach((amt, i) => {
            result.externalInvestment.tendanciel[i] += amt;
            result.externalInvestment.previsions[i] += amt;
          });
          break;
      }
    }

    // Traiter les mesures nouvelles
    for (const measure of sectoralMeasures) {
      let category = categoryMapping[measure.economicNatureId] || EconomicCategoryType.GOODS_SERVICES;

      if (category === EconomicCategoryType.INTERNAL_INVESTMENT && externalSourceIds.has(measure.fundingSourceId)) {
        category = EconomicCategoryType.EXTERNAL_INVESTMENT;
      }

      const amounts = [
        parseFloat(measure.totalCostY1?.toString() || '0'),
        parseFloat(measure.totalCostY2?.toString() || '0'),
        parseFloat(measure.totalCostY3?.toString() || '0'),
      ];

      switch (category) {
        case EconomicCategoryType.PERSONNEL:
          amounts.forEach((amt, i) => {
            result.personnel.mesuresNouvelles[i] += amt;
            result.personnel.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.GOODS_SERVICES:
          amounts.forEach((amt, i) => {
            result.goodsServices.mesuresNouvelles[i] += amt;
            result.goodsServices.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.TRANSFERS:
          amounts.forEach((amt, i) => {
            result.transfers.mesuresNouvelles[i] += amt;
            result.transfers.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.INTERNAL_INVESTMENT:
          amounts.forEach((amt, i) => {
            result.internalInvestment.mesuresNouvelles[i] += amt;
            result.internalInvestment.previsions[i] += amt;
          });
          break;
        case EconomicCategoryType.EXTERNAL_INVESTMENT:
          amounts.forEach((amt, i) => {
            result.externalInvestment.mesuresNouvelles[i] += amt;
            result.externalInvestment.previsions[i] += amt;
          });
          break;
      }
    }

    return result;
  }

  /**
   * Calculer les totaux à partir des programmes
   */
  private static calculateTotals(programs: CDSMTLine[]) {
    return programs.reduce(
      (totals, program) => ({
        tendancielY1: totals.tendancielY1 + program.tendancielY1,
        tendancielY2: totals.tendancielY2 + program.tendancielY2,
        tendancielY3: totals.tendancielY3 + program.tendancielY3,
        mesuresNouvellesY1: totals.mesuresNouvellesY1 + program.mesuresNouvellesY1,
        mesuresNouvellesY2: totals.mesuresNouvellesY2 + program.mesuresNouvellesY2,
        mesuresNouvellesY3: totals.mesuresNouvellesY3 + program.mesuresNouvellesY3,
        previsionsY1: totals.previsionsY1 + program.previsionsY1,
        previsionsY2: totals.previsionsY2 + program.previsionsY2,
        previsionsY3: totals.previsionsY3 + program.previsionsY3,
      }),
      {
        tendancielY1: 0,
        tendancielY2: 0,
        tendancielY3: 0,
        mesuresNouvellesY1: 0,
        mesuresNouvellesY2: 0,
        mesuresNouvellesY3: 0,
        previsionsY1: 0,
        previsionsY2: 0,
        previsionsY3: 0,
      }
    );
  }

  /**
   * Valider le CDSMT par rapport au plafond CDMT Global
   */
  static async validateAgainstCeiling(
    ministryId: string,
    fiscalYear: number
  ): Promise<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
    details: {
      year: number;
      ceiling: number;
      total: number;
      gap: number;
      gapPercentage: number;
    }[];
  }> {
    const summary = await this.generateMinistrySDMT(ministryId, fiscalYear);

    const warnings: string[] = [];
    const errors: string[] = [];
    const details = [];

    // Vérifier chaque année
    const years = [
      { year: fiscalYear + 1, ceiling: summary.ceilingY1, total: summary.totalPrevisionsY1, respects: summary.respectsCeilingY1 },
      { year: fiscalYear + 2, ceiling: summary.ceilingY2, total: summary.totalPrevisionsY2, respects: summary.respectsCeilingY2 },
      { year: fiscalYear + 3, ceiling: summary.ceilingY3, total: summary.totalPrevisionsY3, respects: summary.respectsCeilingY3 },
    ];

    for (const { year, ceiling, total, respects } of years) {
      const gap = ceiling - total;
      const gapPercentage = ceiling > 0 ? (gap / ceiling) * 100 : 0;

      details.push({
        year,
        ceiling,
        total,
        gap,
        gapPercentage,
      });

      if (!respects) {
        const excess = Math.abs(gap);
        errors.push(
          `Année ${year}: Dépassement du plafond de ${excess.toLocaleString('fr-FR')} (${Math.abs(gapPercentage).toFixed(2)}%)`
        );
      } else if (gapPercentage > 0 && gapPercentage < 2) {
        // Avertissement si proche du plafond
        warnings.push(
          `Année ${year}: Marge résiduelle faible de ${gap.toLocaleString('fr-FR')} (${gapPercentage.toFixed(2)}%)`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors,
      details,
    };
  }

  /**
   * Générer une synthèse nationale (tous les ministères)
   */
  static async generateNationalSynthesis(fiscalYear: number): Promise<{
    fiscalYear: number;
    totalCeilingY1: number;
    totalCeilingY2: number;
    totalCeilingY3: number;
    totalPrevisionsY1: number;
    totalPrevisionsY2: number;
    totalPrevisionsY3: number;
    globalGapY1: number;
    globalGapY2: number;
    globalGapY3: number;
    byMinistry: MinistrySDMTSummary[];
    validationStatus: 'VALID' | 'WARNINGS' | 'ERRORS';
    totalWarnings: number;
    totalErrors: number;
  }> {
    // Récupérer tous les ministères actifs
    const ministries = await prisma.ministry.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });

    const byMinistry: MinistrySDMTSummary[] = [];
    let totalWarnings = 0;
    let totalErrors = 0;

    for (const ministry of ministries) {
      try {
        const summary = await this.generateMinistrySDMT(ministry.id, fiscalYear);
        byMinistry.push(summary);

        // Valider
        const validation = await this.validateAgainstCeiling(ministry.id, fiscalYear);
        totalWarnings += validation.warnings.length;
        totalErrors += validation.errors.length;
      } catch (error) {
        // Ignorer les ministères sans données
        console.warn(`Pas de données CDSMT pour ${ministry.name}`);
      }
    }

    // Calculer les totaux nationaux
    const totalCeilingY1 = byMinistry.reduce((sum, m) => sum + m.ceilingY1, 0);
    const totalCeilingY2 = byMinistry.reduce((sum, m) => sum + m.ceilingY2, 0);
    const totalCeilingY3 = byMinistry.reduce((sum, m) => sum + m.ceilingY3, 0);

    const totalPrevisionsY1 = byMinistry.reduce((sum, m) => sum + m.totalPrevisionsY1, 0);
    const totalPrevisionsY2 = byMinistry.reduce((sum, m) => sum + m.totalPrevisionsY2, 0);
    const totalPrevisionsY3 = byMinistry.reduce((sum, m) => sum + m.totalPrevisionsY3, 0);

    let validationStatus: 'VALID' | 'WARNINGS' | 'ERRORS' = 'VALID';
    if (totalErrors > 0) {
      validationStatus = 'ERRORS';
    } else if (totalWarnings > 0) {
      validationStatus = 'WARNINGS';
    }

    return {
      fiscalYear,
      totalCeilingY1,
      totalCeilingY2,
      totalCeilingY3,
      totalPrevisionsY1,
      totalPrevisionsY2,
      totalPrevisionsY3,
      globalGapY1: totalCeilingY1 - totalPrevisionsY1,
      globalGapY2: totalCeilingY2 - totalPrevisionsY2,
      globalGapY3: totalCeilingY3 - totalPrevisionsY3,
      byMinistry,
      validationStatus,
      totalWarnings,
      totalErrors,
    };
  }
}

export default CDSMTSynthesisService;
