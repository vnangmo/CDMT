import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to convert Decimal to Number for JSON serialization
function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj && typeof obj === 'object' && typeof obj.toNumber === 'function') {
    return obj.toNumber();
  }
  if (Array.isArray(obj)) {
    return obj.map(convertDecimalToNumber);
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = convertDecimalToNumber(obj[key]);
      }
    }
    return result;
  }
  return obj;
}

// =============================================
// RESERVE RATES (Taux des réserves)
// =============================================

export const getReserveRates = async (macroFrameworkId: string) => {
  const rates = await prisma.reserveRate.findMany({
    where: { macroFrameworkId, isActive: true },
    orderBy: { categoryCode: 'asc' },
  });
  return convertDecimalToNumber(rates);
};

export const createReserveRate = async (data: {
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  contingencyRateY1?: number;
  programmingRateY1?: number;
  contingencyRateY2?: number;
  programmingRateY2?: number;
  contingencyRateY3?: number;
  programmingRateY3?: number;
}) => {
  const rate = await prisma.reserveRate.create({ data });
  return convertDecimalToNumber(rate);
};

export const updateReserveRate = async (id: string, data: Partial<{
  expenseCategory: string;
  categoryCode: string;
  contingencyRateY1: number;
  programmingRateY1: number;
  contingencyRateY2: number;
  programmingRateY2: number;
  contingencyRateY3: number;
  programmingRateY3: number;
  isActive: boolean;
}>) => {
  const rate = await prisma.reserveRate.update({ where: { id }, data });
  return convertDecimalToNumber(rate);
};

export const deleteReserveRate = async (id: string) => {
  return prisma.reserveRate.delete({ where: { id } });
};

export const upsertReserveRates = async (macroFrameworkId: string, rates: Array<{
  expenseCategory: string;
  categoryCode: string;
  contingencyRateY1?: number;
  programmingRateY1?: number;
  contingencyRateY2?: number;
  programmingRateY2?: number;
  contingencyRateY3?: number;
  programmingRateY3?: number;
}>) => {
  const results = await Promise.all(
    rates.map(rate =>
      prisma.reserveRate.upsert({
        where: {
          macroFrameworkId_categoryCode: {
            macroFrameworkId,
            categoryCode: rate.categoryCode,
          },
        },
        update: {
          expenseCategory: rate.expenseCategory,
          contingencyRateY1: rate.contingencyRateY1,
          programmingRateY1: rate.programmingRateY1,
          contingencyRateY2: rate.contingencyRateY2,
          programmingRateY2: rate.programmingRateY2,
          contingencyRateY3: rate.contingencyRateY3,
          programmingRateY3: rate.programmingRateY3,
        },
        create: {
          macroFrameworkId,
          ...rate,
        },
      })
    )
  );
  return convertDecimalToNumber(results);
};

// =============================================
// AVAILABLE FISCAL MARGINS (Marges disponibles)
// =============================================

export const getAvailableFiscalMargins = async (macroFrameworkId: string) => {
  const margins = await prisma.availableFiscalMargin.findMany({
    where: { macroFrameworkId, isActive: true },
    orderBy: { categoryCode: 'asc' },
  });
  return convertDecimalToNumber(margins);
};

export const createAvailableFiscalMargin = async (data: {
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  cbmtAmountY1?: number;
  trendAmountY1?: number;
  marginBeforeReservesY1?: number;
  contingencyReservesY1?: number;
  programmingReservesY1?: number;
  availableMarginY1?: number;
  cbmtAmountY2?: number;
  trendAmountY2?: number;
  marginBeforeReservesY2?: number;
  contingencyReservesY2?: number;
  programmingReservesY2?: number;
  availableMarginY2?: number;
  cbmtAmountY3?: number;
  trendAmountY3?: number;
  marginBeforeReservesY3?: number;
  contingencyReservesY3?: number;
  programmingReservesY3?: number;
  availableMarginY3?: number;
}) => {
  const margin = await prisma.availableFiscalMargin.create({ data });
  return convertDecimalToNumber(margin);
};

export const updateAvailableFiscalMargin = async (id: string, data: any) => {
  const margin = await prisma.availableFiscalMargin.update({ where: { id }, data });
  return convertDecimalToNumber(margin);
};

export const deleteAvailableFiscalMargin = async (id: string) => {
  return prisma.availableFiscalMargin.delete({ where: { id } });
};

export const calculateAvailableFiscalMargins = async (macroFrameworkId: string) => {
  // Get CBMT aggregates (from CBMTAggregate)
  const cbmtDoc = await prisma.cBMTDocument.findFirst({
    where: { macroFrameworkId },
    include: { aggregates: true },
  });

  // Get Trend projections (from expense projections)
  const expenseProjections = await prisma.expenseProjection.findMany({
    where: { macroFrameworkId, isActive: true },
  });

  // Get reserve rates
  const reserveRates = await prisma.reserveRate.findMany({
    where: { macroFrameworkId, isActive: true },
  });

  // Create a map of reserve rates by category code
  const ratesMap = new Map(reserveRates.map(r => [r.categoryCode, r]));

  // Calculate margins for each category
  const marginData: any[] = [];

  if (cbmtDoc?.aggregates) {
    for (const agg of cbmtDoc.aggregates) {
      const trendData = expenseProjections.find(e => e.categoryCode === agg.categoryCode);
      const rates = ratesMap.get(agg.categoryCode);

      const cbmtY1 = Number(agg.amount1 || 0);
      const cbmtY2 = Number(agg.amount2 || 0);
      const cbmtY3 = Number(agg.amount3 || 0);

      const trendY1 = Number(trendData?.projectedAmount1 || 0);
      const trendY2 = Number(trendData?.projectedAmount2 || 0);
      const trendY3 = Number(trendData?.projectedAmount3 || 0);

      const marginBeforeY1 = cbmtY1 - trendY1;
      const marginBeforeY2 = cbmtY2 - trendY2;
      const marginBeforeY3 = cbmtY3 - trendY3;

      const contingencyY1 = marginBeforeY1 * Number(rates?.contingencyRateY1 || 0);
      const contingencyY2 = marginBeforeY2 * Number(rates?.contingencyRateY2 || 0);
      const contingencyY3 = marginBeforeY3 * Number(rates?.contingencyRateY3 || 0);

      const programmingY1 = marginBeforeY1 * Number(rates?.programmingRateY1 || 0);
      const programmingY2 = marginBeforeY2 * Number(rates?.programmingRateY2 || 0);
      const programmingY3 = marginBeforeY3 * Number(rates?.programmingRateY3 || 0);

      marginData.push({
        macroFrameworkId,
        expenseCategory: agg.categoryName,
        categoryCode: agg.categoryCode,
        cbmtAmountY1: cbmtY1,
        trendAmountY1: trendY1,
        marginBeforeReservesY1: marginBeforeY1,
        contingencyReservesY1: contingencyY1,
        programmingReservesY1: programmingY1,
        availableMarginY1: Math.max(0, marginBeforeY1 - contingencyY1 - programmingY1),
        cbmtAmountY2: cbmtY2,
        trendAmountY2: trendY2,
        marginBeforeReservesY2: marginBeforeY2,
        contingencyReservesY2: contingencyY2,
        programmingReservesY2: programmingY2,
        availableMarginY2: Math.max(0, marginBeforeY2 - contingencyY2 - programmingY2),
        cbmtAmountY3: cbmtY3,
        trendAmountY3: trendY3,
        marginBeforeReservesY3: marginBeforeY3,
        contingencyReservesY3: contingencyY3,
        programmingReservesY3: programmingY3,
        availableMarginY3: Math.max(0, marginBeforeY3 - contingencyY3 - programmingY3),
      });
    }
  }

  // Upsert all margins
  const results = await Promise.all(
    marginData.map(m =>
      prisma.availableFiscalMargin.upsert({
        where: {
          macroFrameworkId_categoryCode: {
            macroFrameworkId,
            categoryCode: m.categoryCode,
          },
        },
        update: m,
        create: m,
      })
    )
  );

  return convertDecimalToNumber(results);
};

// =============================================
// NEW MEASURE RATES (Taux mesures nouvelles)
// =============================================

export const getNewMeasureRates = async (macroFrameworkId: string) => {
  const rates = await prisma.newMeasureRate.findMany({
    where: { macroFrameworkId, isActive: true },
    orderBy: { categoryCode: 'asc' },
  });
  return convertDecimalToNumber(rates);
};

export const createNewMeasureRate = async (data: {
  macroFrameworkId: string;
  expenseCategory: string;
  categoryCode: string;
  rateY1?: number;
  rateY2?: number;
  rateY3?: number;
}) => {
  const rate = await prisma.newMeasureRate.create({ data });
  return convertDecimalToNumber(rate);
};

export const updateNewMeasureRate = async (id: string, data: any) => {
  const rate = await prisma.newMeasureRate.update({ where: { id }, data });
  return convertDecimalToNumber(rate);
};

export const deleteNewMeasureRate = async (id: string) => {
  return prisma.newMeasureRate.delete({ where: { id } });
};

export const upsertNewMeasureRates = async (macroFrameworkId: string, rates: Array<{
  expenseCategory: string;
  categoryCode: string;
  rateY1?: number;
  rateY2?: number;
  rateY3?: number;
}>) => {
  const results = await Promise.all(
    rates.map(rate =>
      prisma.newMeasureRate.upsert({
        where: {
          macroFrameworkId_categoryCode: {
            macroFrameworkId,
            categoryCode: rate.categoryCode,
          },
        },
        update: {
          expenseCategory: rate.expenseCategory,
          rateY1: rate.rateY1,
          rateY2: rate.rateY2,
          rateY3: rate.rateY3,
        },
        create: {
          macroFrameworkId,
          ...rate,
        },
      })
    )
  );
  return convertDecimalToNumber(results);
};

// =============================================
// NEW MEASURES (Mesures nouvelles centrales)
// =============================================

export const getNewMeasures = async (macroFrameworkId: string) => {
  const measures = await prisma.newMeasure.findMany({
    where: { macroFrameworkId, isActive: true },
    orderBy: { categoryCode: 'asc' },
  });
  return convertDecimalToNumber(measures);
};

export const createNewMeasure = async (data: {
  macroFrameworkId: string;
  measureName: string;
  expenseCategory: string;
  categoryCode: string;
  description?: string;
  amountY1?: number;
  amountY2?: number;
  amountY3?: number;
}) => {
  const measure = await prisma.newMeasure.create({ data });
  return convertDecimalToNumber(measure);
};

export const updateNewMeasure = async (id: string, data: any) => {
  const measure = await prisma.newMeasure.update({ where: { id }, data });
  return convertDecimalToNumber(measure);
};

export const deleteNewMeasure = async (id: string) => {
  return prisma.newMeasure.delete({ where: { id } });
};

// =============================================
// DISTRIBUTION KEYS (Clé de répartition)
// =============================================

export const getDistributionKeys = async (macroFrameworkId: string) => {
  const keys = await prisma.distributionKey.findMany({
    where: { macroFrameworkId, isActive: true },
    include: { ministry: true },
    orderBy: { ministry: { name: 'asc' } },
  });
  return convertDecimalToNumber(keys);
};

export const createDistributionKey = async (data: {
  macroFrameworkId: string;
  ministryId: string;
  rateY1?: number;
  rateY2?: number;
  rateY3?: number;
}) => {
  const key = await prisma.distributionKey.create({
    data,
    include: { ministry: true },
  });
  return convertDecimalToNumber(key);
};

export const updateDistributionKey = async (id: string, data: any) => {
  const key = await prisma.distributionKey.update({
    where: { id },
    data,
    include: { ministry: true },
  });
  return convertDecimalToNumber(key);
};

export const deleteDistributionKey = async (id: string) => {
  return prisma.distributionKey.delete({ where: { id } });
};

export const upsertDistributionKeys = async (macroFrameworkId: string, keys: Array<{
  ministryId: string;
  rateY1?: number;
  rateY2?: number;
  rateY3?: number;
}>) => {
  const results = await Promise.all(
    keys.map(key =>
      prisma.distributionKey.upsert({
        where: {
          macroFrameworkId_ministryId: {
            macroFrameworkId,
            ministryId: key.ministryId,
          },
        },
        update: {
          rateY1: key.rateY1,
          rateY2: key.rateY2,
          rateY3: key.rateY3,
        },
        create: {
          macroFrameworkId,
          ...key,
        },
        include: { ministry: true },
      })
    )
  );
  return convertDecimalToNumber(results);
};

// =============================================
// MINISTRY MARGINS (Marge par ministère)
// =============================================

export const getMinistryMargins = async (macroFrameworkId: string) => {
  const margins = await prisma.ministryMargin.findMany({
    where: { macroFrameworkId, isActive: true },
    include: { ministry: true },
    orderBy: [{ ministry: { name: 'asc' } }, { categoryCode: 'asc' }],
  });
  return convertDecimalToNumber(margins);
};

export const getMinistryMarginsByMinistry = async (macroFrameworkId: string, ministryId: string) => {
  const margins = await prisma.ministryMargin.findMany({
    where: { macroFrameworkId, ministryId, isActive: true },
    include: { ministry: true },
    orderBy: { categoryCode: 'asc' },
  });
  return convertDecimalToNumber(margins);
};

export const createMinistryMargin = async (data: {
  macroFrameworkId: string;
  ministryId: string;
  expenseCategory: string;
  categoryCode: string;
  marginY1?: number;
  marginY2?: number;
  marginY3?: number;
}) => {
  const margin = await prisma.ministryMargin.create({
    data,
    include: { ministry: true },
  });
  return convertDecimalToNumber(margin);
};

export const updateMinistryMargin = async (id: string, data: any) => {
  const margin = await prisma.ministryMargin.update({
    where: { id },
    data,
    include: { ministry: true },
  });
  return convertDecimalToNumber(margin);
};

export const deleteMinistryMargin = async (id: string) => {
  return prisma.ministryMargin.delete({ where: { id } });
};

export const calculateMinistryMargins = async (macroFrameworkId: string) => {
  // Get available margins by category
  const availableMargins = await prisma.availableFiscalMargin.findMany({
    where: { macroFrameworkId, isActive: true },
  });

  // Get distribution keys
  const distributionKeys = await prisma.distributionKey.findMany({
    where: { macroFrameworkId, isActive: true },
  });

  // Calculate margins for each ministry and category
  const marginData: any[] = [];

  for (const key of distributionKeys) {
    for (const margin of availableMargins) {
      marginData.push({
        macroFrameworkId,
        ministryId: key.ministryId,
        expenseCategory: margin.expenseCategory,
        categoryCode: margin.categoryCode,
        marginY1: Number(margin.availableMarginY1 || 0) * Number(key.rateY1 || 0),
        marginY2: Number(margin.availableMarginY2 || 0) * Number(key.rateY2 || 0),
        marginY3: Number(margin.availableMarginY3 || 0) * Number(key.rateY3 || 0),
      });
    }
  }

  // Upsert all margins
  const results = await Promise.all(
    marginData.map(m =>
      prisma.ministryMargin.upsert({
        where: {
          macroFrameworkId_ministryId_categoryCode: {
            macroFrameworkId,
            ministryId: m.ministryId,
            categoryCode: m.categoryCode,
          },
        },
        update: m,
        create: m,
        include: { ministry: true },
      })
    )
  );

  return convertDecimalToNumber(results);
};

// =============================================
// SUMMARY & TOTALS
// =============================================

export const getFiscalMarginSummary = async (macroFrameworkId: string) => {
  const [reserveRates, availableMargins, newMeasureRates, newMeasures, distributionKeys, ministryMargins] = await Promise.all([
    prisma.reserveRate.findMany({ where: { macroFrameworkId, isActive: true } }),
    prisma.availableFiscalMargin.findMany({ where: { macroFrameworkId, isActive: true } }),
    prisma.newMeasureRate.findMany({ where: { macroFrameworkId, isActive: true } }),
    prisma.newMeasure.findMany({ where: { macroFrameworkId, isActive: true } }),
    prisma.distributionKey.findMany({ where: { macroFrameworkId, isActive: true }, include: { ministry: true } }),
    prisma.ministryMargin.findMany({ where: { macroFrameworkId, isActive: true }, include: { ministry: true } }),
  ]);

  // Calculate totals
  const totals = {
    totalAvailableMarginY1: availableMargins.reduce((sum, m) => sum + Number(m.availableMarginY1 || 0), 0),
    totalAvailableMarginY2: availableMargins.reduce((sum, m) => sum + Number(m.availableMarginY2 || 0), 0),
    totalAvailableMarginY3: availableMargins.reduce((sum, m) => sum + Number(m.availableMarginY3 || 0), 0),
    totalNewMeasuresY1: newMeasures.reduce((sum, m) => sum + Number(m.amountY1 || 0), 0),
    totalNewMeasuresY2: newMeasures.reduce((sum, m) => sum + Number(m.amountY2 || 0), 0),
    totalNewMeasuresY3: newMeasures.reduce((sum, m) => sum + Number(m.amountY3 || 0), 0),
    totalDistributionRate: distributionKeys.reduce((sum, k) => sum + Number(k.rateY1 || 0), 0),
  };

  return convertDecimalToNumber({
    reserveRates,
    availableMargins,
    newMeasureRates,
    newMeasures,
    distributionKeys,
    ministryMargins,
    totals,
  });
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
