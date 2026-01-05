/**
 * Types pour le système d'importation de données
 */

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: ImportError[];
  warnings: ImportWarning[];
  data?: any[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
  value?: any;
}

export interface ImportOptions {
  skipValidation?: boolean;
  stopOnError?: boolean;
  updateExisting?: boolean;
  dryRun?: boolean;
}

export interface BudgetImportRow {
  annee: number;
  ministereCode: string;
  programmeCode: string;
  actionCode?: string;
  activiteCode?: string;
  categorieEconomiqueCode: string;
  sourceFinancementCode?: string;
  montant: number;
  description?: string;
}

export interface ExecutionImportRow {
  annee: number;
  mois?: number;
  trimestre?: number;
  ministereCode: string;
  programmeCode: string;
  actionCode?: string;
  activiteCode?: string;
  categorieEconomiqueCode: string;
  montantPrevu: number;
  montantEngage?: number;
  montantOrdonnance?: number;
  montantPaye?: number;
}

export interface PIEImportRow {
  annee: number;
  projetCode: string;
  projetNom: string;
  ministereCode: string;
  secteurCode: string;
  montantTotal: number;
  montantAnnee: number;
  sourceFinancementCode: string;
  statut?: string;
}

export interface PIPImportRow {
  annee: number;
  projetCode: string;
  projetNom: string;
  ministereCode: string;
  programmeCode: string;
  montantTotal: number;
  montantAnneeN: number;
  montantAnneeN1?: number;
  montantAnneeN2?: number;
  sourceFinancementCode: string;
  typeProjet?: string;
}

export type ImportType = 'BUDGET' | 'EXECUTION' | 'PIE' | 'PIP' | 'NOMENCLATURE';

export interface ImportMapping {
  excelColumn: string;
  dbField: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean';
  validator?: (value: any) => boolean;
  transformer?: (value: any) => any;
}
