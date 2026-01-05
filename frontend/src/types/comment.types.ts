export enum CommentType {
  GENERAL = 'GENERAL',
  REVIEW = 'REVIEW',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  QUESTION = 'QUESTION',
}

export interface Comment {
  id: string;
  documentType: string;
  documentId: string;
  content: string;
  commentType: CommentType;
  parentId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  isInternal: boolean;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  parent?: Comment;
  replies?: Comment[];
}

export interface CommentCreateInput {
  documentType: string;
  documentId: string;
  content: string;
  commentType?: CommentType;
  parentId?: string;
  isInternal?: boolean;
}

export interface CommentUpdateInput {
  content?: string;
  isResolved?: boolean;
}

// Comment type display configuration
export const COMMENT_TYPE_CONFIG: Record<
  CommentType,
  {
    label: string;
    color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    icon: string;
  }
> = {
  [CommentType.GENERAL]: {
    label: 'Général',
    color: 'default',
    icon: 'comment',
  },
  [CommentType.REVIEW]: {
    label: 'Révision',
    color: 'warning',
    icon: 'rate_review',
  },
  [CommentType.APPROVAL]: {
    label: 'Approbation',
    color: 'success',
    icon: 'check_circle',
  },
  [CommentType.REJECTION]: {
    label: 'Rejet',
    color: 'error',
    icon: 'cancel',
  },
  [CommentType.QUESTION]: {
    label: 'Question',
    color: 'info',
    icon: 'help',
  },
};
