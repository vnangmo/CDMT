// Types pour les référentiels

export interface Ministry {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  ministryId: string;
  ministry?: Ministry;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicAxis {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EconomicNature {
  id: string;
  code: string;
  name: string;
  type: 'REVENUE' | 'EXPENSE';
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FundingSource {
  id: string;
  code: string;
  name: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'LOAN' | 'GRANT';
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalYear {
  id: string;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour la création/modification
export interface CreateMinistryDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateMinistryDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProgramDto {
  code: string;
  name: string;
  description?: string;
  ministryId: string;
  isActive?: boolean;
}

export interface UpdateProgramDto {
  code?: string;
  name?: string;
  description?: string;
  ministryId?: string;
  isActive?: boolean;
}

export interface CreateStrategicAxisDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateStrategicAxisDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateEconomicNatureDto {
  code: string;
  name: string;
  type: 'REVENUE' | 'EXPENSE';
  description?: string;
  isActive?: boolean;
}

export interface UpdateEconomicNatureDto {
  code?: string;
  name?: string;
  type?: 'REVENUE' | 'EXPENSE';
  description?: string;
  isActive?: boolean;
}

export interface CreateFundingSourceDto {
  code: string;
  name: string;
  type: 'INTERNAL' | 'EXTERNAL' | 'LOAN' | 'GRANT';
  description?: string;
  isActive?: boolean;
}

export interface UpdateFundingSourceDto {
  code?: string;
  name?: string;
  type?: 'INTERNAL' | 'EXTERNAL' | 'LOAN' | 'GRANT';
  description?: string;
  isActive?: boolean;
}

export interface CreateFiscalYearDto {
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateFiscalYearDto {
  year?: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  isClosed?: boolean;
  isActive?: boolean;
}
