import api from './api.service';

const API_BASE = '/fiscal-margins';

// =============================================
// Types
// =============================================

export interface ReserveRate {
  id: string;
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  contingencyRateY1: number;
  programmingRateY1: number;
  contingencyRateY2: number;
  programmingRateY2: number;
  contingencyRateY3: number;
  programmingRateY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableFiscalMargin {
  id: string;
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  cbmtAmountY1: number;
  trendAmountY1: number;
  marginBeforeReservesY1: number;
  contingencyReservesY1: number;
  programmingReservesY1: number;
  availableMarginY1: number;
  cbmtAmountY2: number;
  trendAmountY2: number;
  marginBeforeReservesY2: number;
  contingencyReservesY2: number;
  programmingReservesY2: number;
  availableMarginY2: number;
  cbmtAmountY3: number;
  trendAmountY3: number;
  marginBeforeReservesY3: number;
  contingencyReservesY3: number;
  programmingReservesY3: number;
  availableMarginY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewMeasureRate {
  id: string;
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  rateY1: number;
  rateY2: number;
  rateY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewMeasure {
  id: string;
  macroFrameworkId: string;
  measureName: string;
  expenseCategory: string;
  categoryCode: string;
  description?: string;
  amountY1: number;
  amountY2: number;
  amountY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DistributionKey {
  id: string;
  macroFrameworkId: string;
  ministryId: string;
  ministry: {
    id: string;
    code: string;
    name: string;
  };
  rateY1: number;
  rateY2: number;
  rateY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MinistryMargin {
  id: string;
  macroFrameworkId: string;
  ministryId: string;
  ministry: {
    id: string;
    code: string;
    name: string;
  };
  expenseCategory: string;
  categoryCode: string;
  marginY1: number;
  marginY2: number;
  marginY3: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FiscalMarginSummary {
  reserveRates: ReserveRate[];
  availableMargins: AvailableFiscalMargin[];
  newMeasureRates: NewMeasureRate[];
  newMeasures: NewMeasure[];
  distributionKeys: DistributionKey[];
  ministryMargins: MinistryMargin[];
  totals: {
    totalAvailableMarginY1: number;
    totalAvailableMarginY2: number;
    totalAvailableMarginY3: number;
    totalNewMeasuresY1: number;
    totalNewMeasuresY2: number;
    totalNewMeasuresY3: number;
    totalDistributionRate: number;
  };
}

// =============================================
// Reserve Rates
// =============================================

export const getReserveRates = async (macroFrameworkId: string): Promise<ReserveRate[]> => {
  const response = await api.get(`${API_BASE}/reserve-rates/${macroFrameworkId}`);
  return response.data;
};

export const createReserveRate = async (data: Partial<ReserveRate>): Promise<ReserveRate> => {
  const response = await api.post(`${API_BASE}/reserve-rates`, data);
  return response.data;
};

export const updateReserveRate = async (id: string, data: Partial<ReserveRate>): Promise<ReserveRate> => {
  const response = await api.put(`${API_BASE}/reserve-rates/${id}`, data);
  return response.data;
};

export const deleteReserveRate = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/reserve-rates/${id}`);
};

export const upsertReserveRates = async (
  macroFrameworkId: string,
  rates: Partial<ReserveRate>[]
): Promise<ReserveRate[]> => {
  const response = await api.post(`${API_BASE}/reserve-rates/${macroFrameworkId}/bulk`, { rates });
  return response.data;
};

// =============================================
// Available Fiscal Margins
// =============================================

export const getAvailableFiscalMargins = async (macroFrameworkId: string): Promise<AvailableFiscalMargin[]> => {
  const response = await api.get(`${API_BASE}/available-margins/${macroFrameworkId}`);
  return response.data;
};

export const createAvailableFiscalMargin = async (data: Partial<AvailableFiscalMargin>): Promise<AvailableFiscalMargin> => {
  const response = await api.post(`${API_BASE}/available-margins`, data);
  return response.data;
};

export const updateAvailableFiscalMargin = async (id: string, data: Partial<AvailableFiscalMargin>): Promise<AvailableFiscalMargin> => {
  const response = await api.put(`${API_BASE}/available-margins/${id}`, data);
  return response.data;
};

export const deleteAvailableFiscalMargin = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/available-margins/${id}`);
};

export const calculateAvailableFiscalMargins = async (macroFrameworkId: string): Promise<AvailableFiscalMargin[]> => {
  const response = await api.post(`${API_BASE}/available-margins/${macroFrameworkId}/calculate`);
  return response.data;
};

// =============================================
// New Measure Rates
// =============================================

export const getNewMeasureRates = async (macroFrameworkId: string): Promise<NewMeasureRate[]> => {
  const response = await api.get(`${API_BASE}/new-measure-rates/${macroFrameworkId}`);
  return response.data;
};

export const createNewMeasureRate = async (data: Partial<NewMeasureRate>): Promise<NewMeasureRate> => {
  const response = await api.post(`${API_BASE}/new-measure-rates`, data);
  return response.data;
};

export const updateNewMeasureRate = async (id: string, data: Partial<NewMeasureRate>): Promise<NewMeasureRate> => {
  const response = await api.put(`${API_BASE}/new-measure-rates/${id}`, data);
  return response.data;
};

export const deleteNewMeasureRate = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/new-measure-rates/${id}`);
};

export const upsertNewMeasureRates = async (
  macroFrameworkId: string,
  rates: Partial<NewMeasureRate>[]
): Promise<NewMeasureRate[]> => {
  const response = await api.post(`${API_BASE}/new-measure-rates/${macroFrameworkId}/bulk`, { rates });
  return response.data;
};

// =============================================
// New Measures
// =============================================

export const getNewMeasures = async (macroFrameworkId: string): Promise<NewMeasure[]> => {
  const response = await api.get(`${API_BASE}/new-measures/${macroFrameworkId}`);
  return response.data;
};

export const createNewMeasure = async (data: Partial<NewMeasure>): Promise<NewMeasure> => {
  const response = await api.post(`${API_BASE}/new-measures`, data);
  return response.data;
};

export const updateNewMeasure = async (id: string, data: Partial<NewMeasure>): Promise<NewMeasure> => {
  const response = await api.put(`${API_BASE}/new-measures/${id}`, data);
  return response.data;
};

export const deleteNewMeasure = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/new-measures/${id}`);
};

// =============================================
// Distribution Keys
// =============================================

export const getDistributionKeys = async (macroFrameworkId: string): Promise<DistributionKey[]> => {
  const response = await api.get(`${API_BASE}/distribution-keys/${macroFrameworkId}`);
  return response.data;
};

export const createDistributionKey = async (data: Partial<DistributionKey>): Promise<DistributionKey> => {
  const response = await api.post(`${API_BASE}/distribution-keys`, data);
  return response.data;
};

export const updateDistributionKey = async (id: string, data: Partial<DistributionKey>): Promise<DistributionKey> => {
  const response = await api.put(`${API_BASE}/distribution-keys/${id}`, data);
  return response.data;
};

export const deleteDistributionKey = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/distribution-keys/${id}`);
};

export const upsertDistributionKeys = async (
  macroFrameworkId: string,
  keys: Partial<DistributionKey>[]
): Promise<DistributionKey[]> => {
  const response = await api.post(`${API_BASE}/distribution-keys/${macroFrameworkId}/bulk`, { keys });
  return response.data;
};

// =============================================
// Ministry Margins
// =============================================

export const getMinistryMargins = async (macroFrameworkId: string): Promise<MinistryMargin[]> => {
  const response = await api.get(`${API_BASE}/ministry-margins/${macroFrameworkId}`);
  return response.data;
};

export const getMinistryMarginsByMinistry = async (
  macroFrameworkId: string,
  ministryId: string
): Promise<MinistryMargin[]> => {
  const response = await api.get(`${API_BASE}/ministry-margins/${macroFrameworkId}/ministry/${ministryId}`);
  return response.data;
};

export const createMinistryMargin = async (data: Partial<MinistryMargin>): Promise<MinistryMargin> => {
  const response = await api.post(`${API_BASE}/ministry-margins`, data);
  return response.data;
};

export const updateMinistryMargin = async (id: string, data: Partial<MinistryMargin>): Promise<MinistryMargin> => {
  const response = await api.put(`${API_BASE}/ministry-margins/${id}`, data);
  return response.data;
};

export const deleteMinistryMargin = async (id: string): Promise<void> => {
  await api.delete(`${API_BASE}/ministry-margins/${id}`);
};

export const calculateMinistryMargins = async (macroFrameworkId: string): Promise<MinistryMargin[]> => {
  const response = await api.post(`${API_BASE}/ministry-margins/${macroFrameworkId}/calculate`);
  return response.data;
};

// =============================================
// Summary
// =============================================

export const getFiscalMarginSummary = async (macroFrameworkId: string): Promise<FiscalMarginSummary> => {
  const response = await api.get(`${API_BASE}/summary/${macroFrameworkId}`);
  return response.data;
};

export default {
  // Reserve Rates
  getReserveRates,
  createReserveRate,
  updateReserveRate,
  deleteReserveRate,
  upsertReserveRates,
  // Available Fiscal Margins
  getAvailableFiscalMargins,
  createAvailableFiscalMargin,
  updateAvailableFiscalMargin,
  deleteAvailableFiscalMargin,
  calculateAvailableFiscalMargins,
  // New Measure Rates
  getNewMeasureRates,
  createNewMeasureRate,
  updateNewMeasureRate,
  deleteNewMeasureRate,
  upsertNewMeasureRates,
  // New Measures
  getNewMeasures,
  createNewMeasure,
  updateNewMeasure,
  deleteNewMeasure,
  // Distribution Keys
  getDistributionKeys,
  createDistributionKey,
  updateDistributionKey,
  deleteDistributionKey,
  upsertDistributionKeys,
  // Ministry Margins
  getMinistryMargins,
  getMinistryMarginsByMinistry,
  createMinistryMargin,
  updateMinistryMargin,
  deleteMinistryMargin,
  calculateMinistryMargins,
  // Summary
  getFiscalMarginSummary,
};
