/**
 * Types pour la Synthèse CDSMT (Maquette CDSMT - Figure 10 du guide)
 */

// Structure hiérarchique Programme → Action → Activité
export interface ProgramNode {
  id?: string;
  code: string;
  label: string;
  tendancielY1: number;
  mesuresNouvellesY1: number;
  previsionsY1: number;
  tendancielY2: number;
  mesuresNouvellesY2: number;
  previsionsY2: number;
  tendancielY3: number;
  mesuresNouvellesY3: number;
  previsionsY3: number;
  totalTendanciel: number;
  totalMesuresNouvelles: number;
  totalPrevisions: number;
  children?: ActionNode[];
}

export interface ActionNode {
  id?: string;
  code: string;
  label: string;
  tendancielY1: number;
  mesuresNouvellesY1: number;
  previsionsY1: number;
  tendancielY2: number;
  mesuresNouvellesY2: number;
  previsionsY2: number;
  tendancielY3: number;
  mesuresNouvellesY3: number;
  previsionsY3: number;
  totalTendanciel: number;
  totalMesuresNouvelles: number;
  totalPrevisions: number;
  children?: ActivityNode[];
}

export interface ActivityNode {
  id?: string;
  code: string;
  label: string;
  tendancielY1: number;
  mesuresNouvellesY1: number;
  previsionsY1: number;
  tendancielY2: number;
  mesuresNouvellesY2: number;
  previsionsY2: number;
  tendancielY3: number;
  mesuresNouvellesY3: number;
  previsionsY3: number;
  totalTendanciel: number;
  totalMesuresNouvelles: number;
  totalPrevisions: number;
}

// Répartition par catégorie économique
export interface EconomicCategoryData {
  tendanciel: [number, number, number]; // Y1, Y2, Y3
  mesuresNouvelles: [number, number, number];
  previsions: [number, number, number];
}

export interface EconomicCategoryBreakdown {
  personnel: EconomicCategoryData;
  goodsServices: EconomicCategoryData;
  transfers: EconomicCategoryData;
  internalInvestment: EconomicCategoryData;
  externalInvestment: EconomicCategoryData;
}

// Réponse de la synthèse CDSMT ministérielle
export interface MinistrySDMTSummary {
  ministryId: string;
  ministryCode: string;
  ministryName: string;
  fiscalYear: number;

  // Plafonds CDMT Global
  ceilingY1: number;
  ceilingY2: number;
  ceilingY3: number;

  // Totaux tendanciels
  totalTendancielY1: number;
  totalTendancielY2: number;
  totalTendancielY3: number;

  // Totaux mesures nouvelles
  totalMesuresNouvellesY1: number;
  totalMesuresNouvellesY2: number;
  totalMesuresNouvellesY3: number;

  // Totaux prévisions (tendanciel + mesures nouvelles)
  totalPrevisionsY1: number;
  totalPrevisionsY2: number;
  totalPrevisionsY3: number;

  // Écarts avec plafonds
  gapY1: number;
  gapY2: number;
  gapY3: number;

  // Structure programmatique
  programs: ProgramNode[];

  // Répartition par catégorie économique
  byEconomicCategory: EconomicCategoryBreakdown;
}

// Validation CDSMT par rapport au plafond CDMT Global
export interface CDSMTValidation {
  isValid: boolean;
  ministryId: string;
  ministryName: string;
  fiscalYear: number;

  yearlyValidation: {
    year: number;
    ceiling: number;
    projected: number;
    gap: number;
    isValid: boolean;
    percentage: number;
  }[];

  errors: string[];
  warnings: string[];
}

// Synthèse nationale (tous ministères)
export interface NationalSynthesis {
  fiscalYear: number;
  generatedAt: string;

  // Totaux nationaux
  totalCeilings: {
    y1: number;
    y2: number;
    y3: number;
  };

  totalTendanciel: {
    y1: number;
    y2: number;
    y3: number;
  };

  totalMesuresNouvelles: {
    y1: number;
    y2: number;
    y3: number;
  };

  totalPrevisions: {
    y1: number;
    y2: number;
    y3: number;
  };

  // Résumé par ministère
  ministries: MinistryNationalSummary[];

  // Statistiques de conformité
  conformityStats: {
    totalMinistries: number;
    conformantMinistries: number;
    nonConformantMinistries: number;
    conformityRate: number;
  };
}

export interface MinistryNationalSummary {
  ministryId: string;
  ministryCode: string;
  ministryName: string;

  ceilings: {
    y1: number;
    y2: number;
    y3: number;
  };

  previsions: {
    y1: number;
    y2: number;
    y3: number;
  };

  gaps: {
    y1: number;
    y2: number;
    y3: number;
  };

  isConformant: boolean;
}

// Filtres
export interface CDSMTSynthesisFilters {
  fiscalYear: number;
  ministryId?: string;
}
