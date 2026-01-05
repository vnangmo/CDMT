export enum WorkflowStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  VALIDATED = 'VALIDATED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum WorkflowAction {
  CREATE = 'CREATED',
  SUBMIT = 'SUBMITTED',
  START_REVIEW = 'REVIEWED',
  VALIDATE = 'VALIDATED',
  APPROVE = 'APPROVED',
  REJECT = 'REJECTED',
  RETURN = 'RETURNED',
}

export interface WorkflowHistory {
  id: string;
  documentType: string;
  documentId: string;
  documentCode?: string;
  fromStatus: WorkflowStatus | null;
  toStatus: WorkflowStatus;
  action: WorkflowAction;
  actionBy: string;
  actionAt: string;
  comment?: string;
  rejectionReason?: string;
  validatorRole?: string;
  validatorName?: string;
  actionByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WorkflowTransitionRequest {
  documentType: string;
  documentId: string;
  toStatus: WorkflowStatus;
  comment?: string;
  rejectionReason?: string;
}

export interface WorkflowStats {
  totalActions: number;
  byStatus: Array<{
    toStatus: string;
    _count: number;
  }>;
  byDocumentType: Array<{
    documentType: string;
    _count: number;
  }>;
  byAction: Array<{
    action: string;
    _count: number;
  }>;
}

export interface PendingReview {
  documentType: string;
  documentId: string;
  status: WorkflowStatus;
  submittedAt?: string;
  createdAt: string;
}

// Status display configuration
export const WORKFLOW_STATUS_CONFIG: Record<
  WorkflowStatus,
  {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    description: string;
  }
> = {
  [WorkflowStatus.DRAFT]: {
    label: 'Brouillon',
    color: 'default',
    description: 'Document en cours de rédaction',
  },
  [WorkflowStatus.SUBMITTED]: {
    label: 'Soumis',
    color: 'info',
    description: 'Document soumis pour révision',
  },
  [WorkflowStatus.UNDER_REVIEW]: {
    label: 'En révision',
    color: 'warning',
    description: 'Document en cours de révision',
  },
  [WorkflowStatus.VALIDATED]: {
    label: 'Validé',
    color: 'primary',
    description: 'Document validé par les validateurs',
  },
  [WorkflowStatus.APPROVED]: {
    label: 'Approuvé',
    color: 'success',
    description: 'Document approuvé et finalisé',
  },
  [WorkflowStatus.REJECTED]: {
    label: 'Rejeté',
    color: 'error',
    description: 'Document rejeté',
  },
};
