import prisma from '../config/database';
import { NotFoundError, ConflictError, BadRequestError } from '../middleware/errorHandler';

interface CreateProgramData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  ministryId: string;
  objectif?: string;
  indicateurs?: string;
}

interface UpdateProgramData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  ministryId?: string;
  objectif?: string;
  indicateurs?: string;
  isActive?: boolean;
}

interface CreateActionData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  programId: string;
  objectif?: string;
  indicateurs?: string;
}

interface UpdateActionData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  programId?: string;
  objectif?: string;
  indicateurs?: string;
  isActive?: boolean;
}

interface CreateActivityData {
  code: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  actionId: string;
  objectif?: string;
  indicateurs?: string;
}

interface UpdateActivityData {
  code?: string;
  name?: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  actionId?: string;
  objectif?: string;
  indicateurs?: string;
  isActive?: boolean;
}

export class ProgramService {
  // ==================== PROGRAMMES ====================

  /**
   * Obtenir tous les programmes
   */
  static async getAllPrograms(filters?: {
    isActive?: boolean;
    ministryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      ministryId,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (ministryId) {
      where.ministryId = ministryId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.program.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          ministry: true,
          actions: {
            where: { isActive: true },
            include: {
              activities: {
                where: { isActive: true },
              },
            },
          },
          objectives: {
            where: { isActive: true },
            include: {
              indicators: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      prisma.program.count({ where }),
    ]);

    return {
      data: programs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir un programme par ID
   */
  static async getProgramById(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        ministry: true,
        actions: {
          include: {
            activities: true,
            objectives: {
              where: { isActive: true },
              include: {
                indicators: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
        objectives: {
          include: {
            indicators: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundError('Programme non trouvé');
    }

    return program;
  }

  /**
   * Créer un programme
   */
  static async createProgram(data: CreateProgramData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.program.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Un programme avec ce code existe déjà');
    }

    // Vérifier que le ministère existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId },
    });

    if (!ministry) {
      throw new BadRequestError('Ministère non trouvé');
    }

    const program = await prisma.program.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
      include: {
        ministry: true,
      },
    });

    return program;
  }

  /**
   * Mettre à jour un programme
   */
  static async updateProgram(id: string, data: UpdateProgramData) {
    const program = await prisma.program.findUnique({
      where: { id },
    });

    if (!program) {
      throw new NotFoundError('Programme non trouvé');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== program.code) {
      const existingCode = await prisma.program.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Un programme avec ce code existe déjà');
      }
    }

    // Si changement de ministère, vérifier qu'il existe
    if (data.ministryId) {
      const ministry = await prisma.ministry.findUnique({
        where: { id: data.ministryId },
      });

      if (!ministry) {
        throw new BadRequestError('Ministère non trouvé');
      }
    }

    const updated = await prisma.program.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
      include: {
        ministry: true,
        actions: true,
      },
    });

    return updated;
  }

  /**
   * Supprimer un programme (soft delete)
   */
  static async deleteProgram(id: string) {
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        actions: { where: { isActive: true } },
      },
    });

    if (!program) {
      throw new NotFoundError('Programme non trouvé');
    }

    // Vérifier qu'il n'y a pas d'actions actives
    if (program.actions.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer ce programme car ${program.actions.length} action(s) y sont associées`
      );
    }

    const deleted = await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  // ==================== ACTIONS ====================

  /**
   * Obtenir toutes les actions
   */
  static async getAllActions(filters?: {
    isActive?: boolean;
    programId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      programId,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (programId) {
      where.programId = programId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [actions, total] = await Promise.all([
      prisma.action.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          program: {
            include: {
              ministry: true,
            },
          },
          activities: {
            where: { isActive: true },
          },
          objectives: {
            where: { isActive: true },
            include: {
              indicators: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      prisma.action.count({ where }),
    ]);

    return {
      data: actions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une action par ID
   */
  static async getActionById(id: string) {
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            ministry: true,
          },
        },
        activities: {
          include: {
            objectives: {
              where: { isActive: true },
              include: {
                indicators: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
        objectives: {
          include: {
            indicators: true,
          },
        },
      },
    });

    if (!action) {
      throw new NotFoundError('Action non trouvée');
    }

    return action;
  }

  /**
   * Créer une action
   */
  static async createAction(data: CreateActionData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.action.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Une action avec ce code existe déjà');
    }

    // Vérifier que le programme existe
    const program = await prisma.program.findUnique({
      where: { id: data.programId },
    });

    if (!program) {
      throw new BadRequestError('Programme non trouvé');
    }

    const action = await prisma.action.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
      include: {
        program: true,
      },
    });

    return action;
  }

  /**
   * Mettre à jour une action
   */
  static async updateAction(id: string, data: UpdateActionData) {
    const action = await prisma.action.findUnique({
      where: { id },
    });

    if (!action) {
      throw new NotFoundError('Action non trouvée');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== action.code) {
      const existingCode = await prisma.action.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Une action avec ce code existe déjà');
      }
    }

    // Si changement de programme, vérifier qu'il existe
    if (data.programId) {
      const program = await prisma.program.findUnique({
        where: { id: data.programId },
      });

      if (!program) {
        throw new BadRequestError('Programme non trouvé');
      }
    }

    const updated = await prisma.action.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
      include: {
        program: true,
        activities: true,
      },
    });

    return updated;
  }

  /**
   * Supprimer une action (soft delete)
   */
  static async deleteAction(id: string) {
    const action = await prisma.action.findUnique({
      where: { id },
      include: {
        activities: { where: { isActive: true } },
      },
    });

    if (!action) {
      throw new NotFoundError('Action non trouvée');
    }

    // Vérifier qu'il n'y a pas d'activités actives
    if (action.activities.length > 0) {
      throw new BadRequestError(
        `Impossible de supprimer cette action car ${action.activities.length} activité(s) y sont associées`
      );
    }

    const deleted = await prisma.action.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  // ==================== ACTIVITÉS ====================

  /**
   * Obtenir toutes les activités
   */
  static async getAllActivities(filters?: {
    isActive?: boolean;
    actionId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      isActive,
      actionId,
      search,
      page = 1,
      limit = 50,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (actionId) {
      where.actionId = actionId;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
        include: {
          action: {
            include: {
              program: {
                include: {
                  ministry: true,
                },
              },
            },
          },
          objectives: {
            where: { isActive: true },
            include: {
              indicators: {
                where: { isActive: true },
              },
            },
          },
        },
      }),
      prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtenir une activité par ID
   */
  static async getActivityById(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        action: {
          include: {
            program: {
              include: {
                ministry: true,
              },
            },
          },
        },
        objectives: {
          include: {
            indicators: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundError('Activité non trouvée');
    }

    return activity;
  }

  /**
   * Créer une activité
   */
  static async createActivity(data: CreateActivityData) {
    // Vérifier que le code n'existe pas déjà
    const existingCode = await prisma.activity.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existingCode) {
      throw new ConflictError('Une activité avec ce code existe déjà');
    }

    // Vérifier que l'action existe
    const action = await prisma.action.findUnique({
      where: { id: data.actionId },
    });

    if (!action) {
      throw new BadRequestError('Action non trouvée');
    }

    const activity = await prisma.activity.create({
      data: {
        ...data,
        code: data.code.toUpperCase(),
      },
      include: {
        action: true,
      },
    });

    return activity;
  }

  /**
   * Mettre à jour une activité
   */
  static async updateActivity(id: string, data: UpdateActivityData) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundError('Activité non trouvée');
    }

    // Si changement de code, vérifier qu'il n'existe pas déjà
    if (data.code && data.code.toUpperCase() !== activity.code) {
      const existingCode = await prisma.activity.findUnique({
        where: { code: data.code.toUpperCase() },
      });

      if (existingCode) {
        throw new ConflictError('Une activité avec ce code existe déjà');
      }
    }

    // Si changement d'action, vérifier qu'elle existe
    if (data.actionId) {
      const action = await prisma.action.findUnique({
        where: { id: data.actionId },
      });

      if (!action) {
        throw new BadRequestError('Action non trouvée');
      }
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        ...data,
        code: data.code ? data.code.toUpperCase() : undefined,
      },
      include: {
        action: {
          include: {
            program: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Supprimer une activité (soft delete)
   */
  static async deleteActivity(id: string) {
    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (!activity) {
      throw new NotFoundError('Activité non trouvée');
    }

    const deleted = await prisma.activity.update({
      where: { id },
      data: { isActive: false },
    });

    return deleted;
  }

  // ==================== STATISTIQUES ====================

  /**
   * Obtenir les statistiques de la structure programmatique
   */
  static async getStats() {
    const [
      totalPrograms,
      activePrograms,
      totalActions,
      activeActions,
      totalActivities,
      activeActivities,
    ] = await Promise.all([
      prisma.program.count(),
      prisma.program.count({ where: { isActive: true } }),
      prisma.action.count(),
      prisma.action.count({ where: { isActive: true } }),
      prisma.activity.count(),
      prisma.activity.count({ where: { isActive: true } }),
    ]);

    return {
      programs: {
        total: totalPrograms,
        active: activePrograms,
        inactive: totalPrograms - activePrograms,
      },
      actions: {
        total: totalActions,
        active: activeActions,
        inactive: totalActions - activeActions,
      },
      activities: {
        total: totalActivities,
        active: activeActivities,
        inactive: totalActivities - activeActivities,
      },
    };
  }
}
