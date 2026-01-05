import prisma from '../config/database';
import { Objective, Prisma } from '@prisma/client';

interface CreateObjectiveDto {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  entityType: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string;
  actionId?: string;
  activityId?: string;
  objectiveType?: string;
  priority?: number;
}

interface UpdateObjectiveDto {
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  objectiveType?: string;
  priority?: number;
  isActive?: boolean;
}

interface ObjectiveFilters {
  entityType?: 'PROGRAM' | 'ACTION' | 'ACTIVITY';
  programId?: string;
  actionId?: string;
  activityId?: string;
  objectiveType?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

class ObjectiveService {
  /**
   * Get all objectives with optional filters
   */
  async getObjectives(filters: ObjectiveFilters = {}) {
    const {
      entityType,
      programId,
      actionId,
      activityId,
      objectiveType,
      isActive,
      search,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.ObjectiveWhereInput = {};

    if (entityType) {
      where.entityType = entityType;
    }

    if (programId) {
      where.programId = programId;
    }

    if (actionId) {
      where.actionId = actionId;
    }

    if (activityId) {
      where.activityId = activityId;
    }

    if (objectiveType) {
      where.objectiveType = objectiveType;
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

    const [objectives, total] = await Promise.all([
      prisma.objective.findMany({
        where,
        include: {
          program: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          action: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          activity: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          indicators: {
            select: {
              id: true,
              code: true,
              name: true,
              indicatorType: true,
              isActive: true,
            },
            where: { isActive: true },
          },
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.objective.count({ where }),
    ]);

    return {
      objectives,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get objective by ID
   */
  async getObjectiveById(id: string) {
    const objective = await prisma.objective.findUnique({
      where: { id },
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
            program: {
              select: {
                id: true,
                code: true,
                name: true,
                ministryId: true,
              },
            },
          },
        },
        activity: {
          select: {
            id: true,
            code: true,
            name: true,
            actionId: true,
            action: {
              select: {
                id: true,
                code: true,
                name: true,
                programId: true,
              },
            },
          },
        },
        indicators: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    return objective;
  }

  /**
   * Create new objective
   */
  async createObjective(data: CreateObjectiveDto) {
    // Validate that exactly one entity reference is provided
    const entityReferences = [data.programId, data.actionId, data.activityId].filter(Boolean);
    if (entityReferences.length !== 1) {
      throw new Error('Objective must be linked to exactly one entity (Program, Action, or Activity)');
    }

    // Validate entityType matches the provided reference
    if (data.entityType === 'PROGRAM' && !data.programId) {
      throw new Error('programId is required when entityType is PROGRAM');
    }
    if (data.entityType === 'ACTION' && !data.actionId) {
      throw new Error('actionId is required when entityType is ACTION');
    }
    if (data.entityType === 'ACTIVITY' && !data.activityId) {
      throw new Error('activityId is required when entityType is ACTIVITY');
    }

    // Check if code already exists
    const existing = await prisma.objective.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error('Objective code already exists');
    }

    const objective = await prisma.objective.create({
      data: {
        code: data.code,
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        entityType: data.entityType,
        programId: data.programId,
        actionId: data.actionId,
        activityId: data.activityId,
        objectiveType: data.objectiveType,
        priority: data.priority,
      },
      include: {
        program: true,
        action: true,
        activity: true,
        indicators: true,
      },
    });

    return objective;
  }

  /**
   * Update objective
   */
  async updateObjective(id: string, data: UpdateObjectiveDto) {
    const objective = await prisma.objective.findUnique({
      where: { id },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    const updated = await prisma.objective.update({
      where: { id },
      data: {
        name: data.name,
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        description: data.description,
        objectiveType: data.objectiveType,
        priority: data.priority,
        isActive: data.isActive,
      },
      include: {
        program: true,
        action: true,
        activity: true,
        indicators: true,
      },
    });

    return updated;
  }

  /**
   * Delete objective
   */
  async deleteObjective(id: string) {
    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        indicators: true,
      },
    });

    if (!objective) {
      throw new Error('Objective not found');
    }

    // Check if objective has indicators
    if (objective.indicators.length > 0) {
      throw new Error('Cannot delete objective with associated indicators. Delete indicators first.');
    }

    await prisma.objective.delete({
      where: { id },
    });

    return { message: 'Objective deleted successfully' };
  }

  /**
   * Get objectives by Program ID
   */
  async getObjectivesByProgram(programId: string) {
    const objectives = await prisma.objective.findMany({
      where: {
        programId,
        isActive: true,
      },
      include: {
        indicators: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return objectives;
  }

  /**
   * Get objectives by Action ID
   */
  async getObjectivesByAction(actionId: string) {
    const objectives = await prisma.objective.findMany({
      where: {
        actionId,
        isActive: true,
      },
      include: {
        indicators: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return objectives;
  }

  /**
   * Get objectives by Activity ID
   */
  async getObjectivesByActivity(activityId: string) {
    const objectives = await prisma.objective.findMany({
      where: {
        activityId,
        isActive: true,
      },
      include: {
        indicators: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return objectives;
  }

  /**
   * Get objective statistics
   */
  async getObjectiveStats() {
    const [
      totalObjectives,
      activeObjectives,
      byEntityType,
      byObjectiveType,
      withIndicators,
    ] = await Promise.all([
      prisma.objective.count(),
      prisma.objective.count({ where: { isActive: true } }),
      prisma.objective.groupBy({
        by: ['entityType'],
        _count: true,
      }),
      prisma.objective.groupBy({
        by: ['objectiveType'],
        _count: true,
        where: {
          objectiveType: { not: null },
        },
      }),
      prisma.objective.count({
        where: {
          indicators: {
            some: {
              isActive: true,
            },
          },
        },
      }),
    ]);

    return {
      total: totalObjectives,
      active: activeObjectives,
      inactive: totalObjectives - activeObjectives,
      byEntityType: byEntityType.reduce((acc, item) => {
        acc[item.entityType] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byObjectiveType: byObjectiveType.reduce((acc, item) => {
        if (item.objectiveType) {
          acc[item.objectiveType] = item._count;
        }
        return acc;
      }, {} as Record<string, number>),
      withIndicators,
      withoutIndicators: totalObjectives - withIndicators,
    };
  }
}

export default new ObjectiveService();
