import { PrismaClient, WorkflowHistory, Prisma } from '@prisma/client';
import { NotFoundError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export class WorkflowHistoryService {
  /**
   * Create workflow history entry
   */
  static async create(data: {
    documentType: string;
    documentId: string;
    documentCode?: string;
    fromStatus: string | null;
    toStatus: string;
    action: string;
    actionBy: string;
    comment?: string;
    rejectionReason?: string;
    validatorRole?: string;
    validatorName?: string;
  }): Promise<WorkflowHistory> {
    return await prisma.workflowHistory.create({
      data: {
        documentType: data.documentType,
        documentId: data.documentId,
        documentCode: data.documentCode,
        fromStatus: data.fromStatus,
        toStatus: data.toStatus,
        action: data.action,
        actionBy: data.actionBy,
        comment: data.comment,
        rejectionReason: data.rejectionReason,
        validatorRole: data.validatorRole,
        validatorName: data.validatorName,
      },
      include: {
        actionByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get workflow history for a document
   */
  static async getByDocument(
    documentType: string,
    documentId: string
  ): Promise<WorkflowHistory[]> {
    return await prisma.workflowHistory.findMany({
      where: {
        documentType,
        documentId,
      },
      include: {
        actionByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        actionAt: 'desc',
      },
    });
  }

  /**
   * Get workflow history for a user
   */
  static async getByUser(userId: string): Promise<WorkflowHistory[]> {
    return await prisma.workflowHistory.findMany({
      where: {
        actionBy: userId,
      },
      include: {
        actionByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        actionAt: 'desc',
      },
    });
  }

  /**
   * Get workflow statistics
   */
  static async getStats(filters?: {
    documentType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any> {
    const where: Prisma.WorkflowHistoryWhereInput = {};

    if (filters?.documentType) {
      where.documentType = filters.documentType;
    }

    if (filters?.startDate || filters?.endDate) {
      where.actionAt = {};
      if (filters.startDate) {
        where.actionAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.actionAt.lte = filters.endDate;
      }
    }

    const [totalActions, byStatus, byDocumentType, byAction] = await Promise.all([
      prisma.workflowHistory.count({ where }),
      prisma.workflowHistory.groupBy({
        by: ['toStatus'],
        where,
        _count: true,
      }),
      prisma.workflowHistory.groupBy({
        by: ['documentType'],
        where,
        _count: true,
      }),
      prisma.workflowHistory.groupBy({
        by: ['action'],
        where,
        _count: true,
      }),
    ]);

    return {
      totalActions,
      byStatus,
      byDocumentType,
      byAction,
    };
  }

  /**
   * Get latest workflow entry for a document
   */
  static async getLatest(
    documentType: string,
    documentId: string
  ): Promise<WorkflowHistory | null> {
    return await prisma.workflowHistory.findFirst({
      where: {
        documentType,
        documentId,
      },
      orderBy: {
        actionAt: 'desc',
      },
      include: {
        actionByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}

export default WorkflowHistoryService;
