import { PrismaClient, Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError, UnauthorizedError } from '../middleware/errorHandler';
import { WorkflowHistoryService } from './workflowHistory.service';
import NotificationService from './notification.service';

const prisma = new PrismaClient();

// Workflow status enum
export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VALIDATED = 'VALIDATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// Workflow action enum
export enum WorkflowAction {
  CREATE = 'CREATED',
  SUBMIT = 'SUBMITTED',
  START_REVIEW = 'REVIEWED',
  VALIDATE = 'VALIDATED',
  APPROVE = 'APPROVED',
  REJECT = 'REJECTED',
  RETURN = 'RETURNED',
}

// Valid transitions map
const VALID_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  [WorkflowStatus.DRAFT]: [WorkflowStatus.SUBMITTED],
  [WorkflowStatus.SUBMITTED]: [
    WorkflowStatus.UNDER_REVIEW,
    WorkflowStatus.DRAFT,
    WorkflowStatus.REJECTED,
  ],
  [WorkflowStatus.UNDER_REVIEW]: [
    WorkflowStatus.VALIDATED,
    WorkflowStatus.DRAFT,
    WorkflowStatus.REJECTED,
  ],
  [WorkflowStatus.VALIDATED]: [
    WorkflowStatus.APPROVED,
    WorkflowStatus.UNDER_REVIEW,
    WorkflowStatus.REJECTED,
  ],
  [WorkflowStatus.APPROVED]: [], // Terminal state
  [WorkflowStatus.REJECTED]: [WorkflowStatus.DRAFT], // Can be resubmitted
};

// Status to action mapping
const STATUS_TO_ACTION: Record<string, WorkflowAction> = {
  SUBMITTED: WorkflowAction.SUBMIT,
  UNDER_REVIEW: WorkflowAction.START_REVIEW,
  VALIDATED: WorkflowAction.VALIDATE,
  APPROVED: WorkflowAction.APPROVE,
  REJECTED: WorkflowAction.REJECT,
  DRAFT: WorkflowAction.RETURN,
};

// Document type to Prisma model mapping
const DOCUMENT_TYPE_TO_MODEL: Record<string, string> = {
  SECTORAL_MEASURE: 'sectoralMeasure',
  ACTION_PLAN: 'actionPlan',
  MACRO_FRAMEWORK: 'macroFramework',
  CBMT: 'cBMTDocument',
  TOFE: 'tOFEDocument',
  POLICY_MEASURE: 'policyMeasure',
  MINISTERIAL_CEILING: 'ministerialCeiling',
  TREND_BUDGET_CONFIG: 'trendBudgetConfig',
  CDMT_GLOBAL_SCENARIO: 'cDMTGlobalScenario',
};

// Status to timestamp field mapping
const STATUS_TO_TIMESTAMP_FIELD: Record<string, string> = {
  SUBMITTED: 'submittedAt',
  UNDER_REVIEW: 'reviewStartedAt',
  VALIDATED: 'validatedAt',
  APPROVED: 'approvedAt',
  REJECTED: 'rejectedAt',
};

// Status to user field mapping
const STATUS_TO_USER_FIELD: Record<string, string> = {
  SUBMITTED: 'submittedBy',
  UNDER_REVIEW: 'reviewStartedBy',
  VALIDATED: 'validatedBy',
  APPROVED: 'approvedBy',
  REJECTED: 'rejectedBy',
};

export class WorkflowService {
  /**
   * Transition document to new status
   */
  static async transitionStatus(params: {
    documentType: string;
    documentId: string;
    documentCode?: string;
    toStatus: WorkflowStatus;
    userId: string;
    comment?: string;
    rejectionReason?: string;
  }): Promise<void> {
    // Get current status
    const currentStatus = await this.getCurrentStatus(params.documentType, params.documentId);

    // Validate transition
    const isValid = await this.validateTransition(
      params.documentType,
      params.documentId,
      params.toStatus,
      params.userId
    );

    if (!isValid) {
      throw new BadRequestError(
        `Transition invalide de ${currentStatus} vers ${params.toStatus}`
      );
    }

    // Get user info for validator name/role
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Utilisateur introuvable');
    }

    // Determine action
    const action = STATUS_TO_ACTION[params.toStatus] || WorkflowAction.CREATE;

    // Update document status
    await this.updateDocumentStatus(
      params.documentType,
      params.documentId,
      params.toStatus,
      params.userId,
      params.rejectionReason
    );

    // Record in workflow history
    await WorkflowHistoryService.create({
      documentType: params.documentType,
      documentId: params.documentId,
      documentCode: params.documentCode,
      fromStatus: currentStatus,
      toStatus: params.toStatus,
      action,
      actionBy: params.userId,
      comment: params.comment,
      rejectionReason: params.rejectionReason,
      validatorRole: user.role?.name,
      validatorName: `${user.firstName} ${user.lastName}`,
    });

    // Send notifications (placeholder for now)
    await this.notifyStakeholders(params.documentType, params.documentId, params.toStatus);
  }

  /**
   * Validate if transition is allowed
   */
  static async validateTransition(
    documentType: string,
    documentId: string,
    toStatus: WorkflowStatus,
    userId: string
  ): Promise<boolean> {
    // Get current status
    const currentStatus = await this.getCurrentStatus(documentType, documentId);

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[currentStatus as WorkflowStatus] || [];
    if (!allowedTransitions.includes(toStatus)) {
      return false;
    }

    // TODO: Add permission checks here
    // const hasPermission = await this.checkPermission(userId, documentType, currentStatus, toStatus);
    // if (!hasPermission) {
    //   return false;
    // }

    return true;
  }

  /**
   * Get current document status
   */
  static async getCurrentStatus(
    documentType: string,
    documentId: string
  ): Promise<WorkflowStatus> {
    const modelName = DOCUMENT_TYPE_TO_MODEL[documentType];

    if (!modelName) {
      throw new BadRequestError(`Type de document invalide: ${documentType}`);
    }

    const document = await (prisma as any)[modelName].findUnique({
      where: { id: documentId },
      select: { status: true },
    });

    if (!document) {
      throw new NotFoundError('Document introuvable');
    }

    return document.status as WorkflowStatus;
  }

  /**
   * Update document status
   */
  private static async updateDocumentStatus(
    documentType: string,
    documentId: string,
    newStatus: WorkflowStatus,
    userId: string,
    rejectionReason?: string
  ): Promise<void> {
    const modelName = DOCUMENT_TYPE_TO_MODEL[documentType];

    if (!modelName) {
      throw new BadRequestError(`Type de document invalide: ${documentType}`);
    }

    const updateData: any = {
      status: newStatus,
    };

    // Set timestamp field
    const timestampField = STATUS_TO_TIMESTAMP_FIELD[newStatus];
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    // Set user field
    const userField = STATUS_TO_USER_FIELD[newStatus];
    if (userField) {
      updateData[userField] = userId;
    }

    // Set rejection reason if applicable
    if (newStatus === WorkflowStatus.REJECTED && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Clear rejection reason when returning to draft or moving forward
    if (newStatus === WorkflowStatus.DRAFT || newStatus === WorkflowStatus.SUBMITTED) {
      updateData.rejectionReason = null;
    }

    await (prisma as any)[modelName].update({
      where: { id: documentId },
      data: updateData,
    });
  }

  /**
   * Get workflow history
   */
  static async getHistory(documentType: string, documentId: string) {
    return await WorkflowHistoryService.getByDocument(documentType, documentId);
  }

  /**
   * Get pending reviews for user
   */
  static async getPendingReviews(userId: string, role?: string): Promise<any[]> {
    // Get user's role if not provided
    if (!role) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      role = user?.role?.name;
    }

    if (!role) {
      return [];
    }

    const pendingDocuments: any[] = [];

    // For each document type, find documents in pending review states
    for (const [docType, modelName] of Object.entries(DOCUMENT_TYPE_TO_MODEL)) {
      try {
        const documents = await (prisma as any)[modelName].findMany({
          where: {
            status: {
              in: [
                WorkflowStatus.SUBMITTED,
                WorkflowStatus.UNDER_REVIEW,
                WorkflowStatus.VALIDATED,
              ],
            },
          },
          select: {
            id: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
        });

        documents.forEach((doc: any) => {
          pendingDocuments.push({
            documentType: docType,
            documentId: doc.id,
            status: doc.status,
            submittedAt: doc.submittedAt,
            createdAt: doc.createdAt,
          });
        });
      } catch (error) {
        // Skip if model doesn't exist or error occurs
        console.warn(`Could not query ${modelName}:`, error);
      }
    }

    // Sort by submission date (newest first)
    pendingDocuments.sort((a, b) => {
      const dateA = a.submittedAt || a.createdAt;
      const dateB = b.submittedAt || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return pendingDocuments;
  }

  /**
   * Send notifications to stakeholders
   */
  private static async notifyStakeholders(
    documentType: string,
    documentId: string,
    newStatus: WorkflowStatus
  ): Promise<void> {
    await NotificationService.notifyWorkflowTransition({
      documentType,
      documentId,
      newStatus,
    });
  }

  /**
   * Get workflow statistics
   */
  static async getWorkflowStats(filters?: {
    documentType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await WorkflowHistoryService.getStats(filters);
  }

  /**
   * Check if document can be edited
   */
  static async canEdit(documentType: string, documentId: string): Promise<boolean> {
    const currentStatus = await this.getCurrentStatus(documentType, documentId);
    // Only DRAFT and REJECTED documents can be edited
    return currentStatus === WorkflowStatus.DRAFT || currentStatus === WorkflowStatus.REJECTED;
  }

  /**
   * Check if document is in final state
   */
  static async isFinal(documentType: string, documentId: string): Promise<boolean> {
    const currentStatus = await this.getCurrentStatus(documentType, documentId);
    return currentStatus === WorkflowStatus.APPROVED;
  }
}

export default WorkflowService;
