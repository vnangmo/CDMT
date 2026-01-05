import prisma from '../config/database';
import { Indicator, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

interface CreateIndicatorDto {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  objectiveId: string;
  unit: string;
  measurementMethod?: string;
  dataSource?: string;
  baselineYear?: number;
  baselineValue?: number;
  targetYear1?: number;
  targetValue1?: number;
  targetYear2?: number;
  targetValue2?: number;
  targetYear3?: number;
  targetValue3?: number;
  indicatorType?: string;
  frequency?: string;
  responsibleEntity?: string;
}

interface UpdateIndicatorDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  unit?: string;
  measurementMethod?: string;
  dataSource?: string;
  baselineYear?: number;
  baselineValue?: number;
  targetYear1?: number;
  targetValue1?: number;
  targetYear2?: number;
  targetValue2?: number;
  targetYear3?: number;
  targetValue3?: number;
  actualYear1?: number;
  actualValue1?: number;
  actualYear2?: number;
  actualValue2?: number;
  actualYear3?: number;
  actualValue3?: number;
  indicatorType?: string;
  frequency?: string;
  responsibleEntity?: string;
  isActive?: boolean;
}

interface IndicatorFilters {
  objectiveId?: string;
  indicatorType?: string;
  frequency?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class IndicatorService {
  /**
   * Get all indicators with optional filters
   */
  async getIndicators(filters: IndicatorFilters = {}) {
    const {
      objectiveId,
      indicatorType,
      frequency,
      isActive,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.IndicatorWhereInput = {};

    if (objectiveId) {
      where.objectiveId = objectiveId;
    }

    if (indicatorType) {
      where.indicatorType = indicatorType;
    }

    if (frequency) {
      where.frequency = frequency;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [indicators, total] = await Promise.all([
      prisma.indicator.findMany({
        where,
        include: {
          objective: {
            select: {
              id: true,
              code: true,
              name: true,
              entityType: true,
              programId: true,
              actionId: true,
              activityId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.indicator.count({ where }),
    ]);

    return {
      indicators,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get indicator by ID
   */
  async getIndicatorById(id: string) {
    const indicator = await prisma.indicator.findUnique({
      where: { id },
      include: {
        objective: {
          include: {
            program: {
              select: {
                id: true,
                code: true,
                name: true,
                ministryId: true,
                ministry: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
            action: {
              select: {
                id: true,
                code: true,
                name: true,
                programId: true,
              },
            },
            activity: {
              select: {
                id: true,
                code: true,
                name: true,
                actionId: true,
              },
            },
          },
        },
      },
    });

    if (!indicator) {
      throw new Error('Indicator not found');
    }

    return indicator;
  }

  /**
   * Create new indicator
   */
  async createIndicator(data: CreateIndicatorDto) {
    // Verify objective exists
    const objective = await prisma.objective.findUnique({
      where: { id: data.objectiveId },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    // Check if code already exists
    const existing = await prisma.indicator.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Indicator code already exists');
    }

    const indicator = await prisma.indicator.create({
      data: {
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        objectiveId: data.objectiveId,
        unit: data.unit,
        measurementMethod: data.measurementMethod,
        dataSource: data.dataSource,
        baselineYear: data.baselineYear,
        baselineValue: data.baselineValue ? new Decimal(data.baselineValue) : null,
        targetYear1: data.targetYear1,
        targetValue1: data.targetValue1 ? new Decimal(data.targetValue1) : null,
        targetYear2: data.targetYear2,
        targetValue2: data.targetValue2 ? new Decimal(data.targetValue2) : null,
        targetYear3: data.targetYear3,
        targetValue3: data.targetValue3 ? new Decimal(data.targetValue3) : null,
        indicatorType: data.indicatorType,
        frequency: data.frequency,
        responsibleEntity: data.responsibleEntity,
      },
      include: {
        objective: true,
      },
    });

    return indicator;
  }

  /**
   * Update indicator
   */
  async updateIndicator(id: string, data: UpdateIndicatorDto) {
    const indicator = await prisma.indicator.findUnique({
      where: { id },
    });

    if (!indicator) {
      throw new Error('Indicator not found');
    }

    const updateData: Prisma.IndicatorUpdateInput = {
      name: data.name,
      nameAr: data.nameAr,
      nameEn: data.nameEn,
      description: data.description,
      unit: data.unit,
      measurementMethod: data.measurementMethod,
      dataSource: data.dataSource,
      baselineYear: data.baselineYear,
      indicatorType: data.indicatorType,
      frequency: data.frequency,
      responsibleEntity: data.responsibleEntity,
      isActive: data.isActive,
    };

    // Handle Decimal fields
    if (data.baselineValue !== undefined) {
      updateData.baselineValue = data.baselineValue !== null ? new Decimal(data.baselineValue) : null;
    }
    if (data.targetValue1 !== undefined) {
      updateData.targetValue1 = data.targetValue1 !== null ? new Decimal(data.targetValue1) : null;
    }
    if (data.targetValue2 !== undefined) {
      updateData.targetValue2 = data.targetValue2 !== null ? new Decimal(data.targetValue2) : null;
    }
    if (data.targetValue3 !== undefined) {
      updateData.targetValue3 = data.targetValue3 !== null ? new Decimal(data.targetValue3) : null;
    }
    if (data.actualValue1 !== undefined) {
      updateData.actualValue1 = data.actualValue1 !== null ? new Decimal(data.actualValue1) : null;
    }
    if (data.actualValue2 !== undefined) {
      updateData.actualValue2 = data.actualValue2 !== null ? new Decimal(data.actualValue2) : null;
    }
    if (data.actualValue3 !== undefined) {
      updateData.actualValue3 = data.actualValue3 !== null ? new Decimal(data.actualValue3) : null;
    }

    // Handle year fields
    if (data.targetYear1 !== undefined) {
      updateData.targetYear1 = data.targetYear1;
    }
    if (data.targetYear2 !== undefined) {
      updateData.targetYear2 = data.targetYear2;
    }
    if (data.targetYear3 !== undefined) {
      updateData.targetYear3 = data.targetYear3;
    }
    if (data.actualYear1 !== undefined) {
      updateData.actualYear1 = data.actualYear1;
    }
    if (data.actualYear2 !== undefined) {
      updateData.actualYear2 = data.actualYear2;
    }
    if (data.actualYear3 !== undefined) {
      updateData.actualYear3 = data.actualYear3;
    }

    const updated = await prisma.indicator.update({
      where: { id },
      data: updateData,
      include: {
        objective: true,
      },
    });

    return updated;
  }

  /**
   * Delete indicator
   */
  async deleteIndicator(id: string) {
    const indicator = await prisma.indicator.findUnique({
      where: { id },
    });

    if (!indicator) {
      throw new Error('Indicator not found');
    }

    await prisma.indicator.delete({
      where: { id },
    });

    return { message: 'Indicator deleted successfully' };
  }

  /**
   * Get indicators by Objective ID
   */
  async getIndicatorsByObjective(objectiveId: string) {
    const indicators = await prisma.indicator.findMany({
      where: {
        objectiveId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return indicators;
  }

  /**
   * Update actual values for an indicator
   */
  async updateActualValues(
    id: string,
    actualValues: {
      actualYear1?: number;
      actualValue1?: number;
      actualYear2?: number;
      actualValue2?: number;
      actualYear3?: number;
      actualValue3?: number;
    }
  ) {
    const indicator = await prisma.indicator.findUnique({
      where: { id },
    });

    if (!indicator) {
      throw new Error('Indicator not found');
    }

    const updateData: Prisma.IndicatorUpdateInput = {};

    if (actualValues.actualYear1 !== undefined) {
      updateData.actualYear1 = actualValues.actualYear1;
    }
    if (actualValues.actualValue1 !== undefined) {
      updateData.actualValue1 = actualValues.actualValue1 !== null ? new Decimal(actualValues.actualValue1) : null;
    }
    if (actualValues.actualYear2 !== undefined) {
      updateData.actualYear2 = actualValues.actualYear2;
    }
    if (actualValues.actualValue2 !== undefined) {
      updateData.actualValue2 = actualValues.actualValue2 !== null ? new Decimal(actualValues.actualValue2) : null;
    }
    if (actualValues.actualYear3 !== undefined) {
      updateData.actualYear3 = actualValues.actualYear3;
    }
    if (actualValues.actualValue3 !== undefined) {
      updateData.actualValue3 = actualValues.actualValue3 !== null ? new Decimal(actualValues.actualValue3) : null;
    }

    const updated = await prisma.indicator.update({
      where: { id },
      data: updateData,
      include: {
        objective: true,
      },
    });

    return updated;
  }

  /**
   * Get indicator performance (comparison of targets vs actuals)
   */
  async getIndicatorPerformance(id: string) {
    const indicator = await prisma.indicator.findUnique({
      where: { id },
      include: {
        objective: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!indicator) {
      throw new Error('Indicator not found');
    }

    // Calculate achievement rate for each year
    const calculateAchievement = (actual: Decimal | null, target: Decimal | null): number | null => {
      if (!actual || !target || target.isZero()) return null;
      return (actual.toNumber() / target.toNumber()) * 100;
    };

    const performance = {
      indicator: {
        id: indicator.id,
        code: indicator.code,
        name: indicator.name,
        unit: indicator.unit,
        indicatorType: indicator.indicatorType,
      },
      objective: indicator.objective,
      baseline: {
        year: indicator.baselineYear,
        value: indicator.baselineValue?.toNumber() || null,
      },
      years: [
        {
          year: indicator.targetYear1,
          target: indicator.targetValue1?.toNumber() || null,
          actual: indicator.actualValue1?.toNumber() || null,
          achievementRate: calculateAchievement(indicator.actualValue1, indicator.targetValue1),
          variance: indicator.actualValue1 && indicator.targetValue1
            ? indicator.actualValue1.minus(indicator.targetValue1).toNumber()
            : null,
        },
        {
          year: indicator.targetYear2,
          target: indicator.targetValue2?.toNumber() || null,
          actual: indicator.actualValue2?.toNumber() || null,
          achievementRate: calculateAchievement(indicator.actualValue2, indicator.targetValue2),
          variance: indicator.actualValue2 && indicator.targetValue2
            ? indicator.actualValue2.minus(indicator.targetValue2).toNumber()
            : null,
        },
        {
          year: indicator.targetYear3,
          target: indicator.targetValue3?.toNumber() || null,
          actual: indicator.actualValue3?.toNumber() || null,
          achievementRate: calculateAchievement(indicator.actualValue3, indicator.targetValue3),
          variance: indicator.actualValue3 && indicator.targetValue3
            ? indicator.actualValue3.minus(indicator.targetValue3).toNumber()
            : null,
        },
      ].filter((year) => year.year !== null),
    };

    return performance;
  }

  /**
   * Get indicator statistics
   */
  async getIndicatorStats() {
    const [
      totalIndicators,
      activeIndicators,
      byIndicatorType,
      byFrequency,
      withBaseline,
      withActuals,
    ] = await Promise.all([
      prisma.indicator.count(),
      prisma.indicator.count({ where: { isActive: true } }),
      prisma.indicator.groupBy({
        by: ['indicatorType'],
        _count: true,
        where: {
          indicatorType: { not: null },
        },
      }),
      prisma.indicator.groupBy({
        by: ['frequency'],
        _count: true,
        where: {
          frequency: { not: null },
        },
      }),
      prisma.indicator.count({
        where: {
          baselineValue: { not: null },
        },
      }),
      prisma.indicator.count({
        where: {
          OR: [
            { actualValue1: { not: null } },
            { actualValue2: { not: null } },
            { actualValue3: { not: null } },
          ],
        },
      }),
    ]);

    return {
      total: totalIndicators,
      active: activeIndicators,
      inactive: totalIndicators - activeIndicators,
      byIndicatorType: byIndicatorType.reduce((acc, item) => {
        if (item.indicatorType) {
          acc[item.indicatorType] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      byFrequency: byFrequency.reduce((acc, item) => {
        if (item.frequency) {
          acc[item.frequency] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      withBaseline,
      withActuals,
    };
  }
}

export default new IndicatorService();
