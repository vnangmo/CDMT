import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : undefined,
        message: err.msg,
      })),
    });
  }

  return next();
};

/**
 * Auth validation rules
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('First name must be 2-50 characters, letters only'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-ZÀ-ÿ\s-]+$/)
    .withMessage('Last name must be 2-50 characters, letters only'),
  body('roleId')
    .isUUID()
    .withMessage('Valid role ID is required'),
  handleValidationErrors,
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
  handleValidationErrors,
];

/**
 * UUID parameter validation
 */
export const validateUuidParam = (paramName: string = 'id'): ValidationChain[] => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt()
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

/**
 * Ministry validation rules
 */
export const validateCreateMinistry = [
  body('code')
    .trim()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Code must be 2-20 uppercase alphanumeric characters'),
  body('name')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be 3-200 characters'),
  body('acronym')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Acronym must be uppercase alphanumeric'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  handleValidationErrors,
];

export const validateUpdateMinistry = [
  ...validateUuidParam('id'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .matches(/^[A-Z0-9_-]+$/)
    .withMessage('Code must be 2-20 uppercase alphanumeric characters'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Name must be 3-200 characters'),
  body('acronym')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Acronym must be uppercase alphanumeric'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  handleValidationErrors,
];

/**
 * Fiscal year validation
 */
export const validateFiscalYear = [
  query('fiscalYear')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .toInt()
    .withMessage('Fiscal year must be between 2000 and 2100'),
  handleValidationErrors,
];

/**
 * Amount validation
 */
export const validateAmount = (fieldName: string = 'amount') => [
  body(fieldName)
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} must be a positive number`),
];

/**
 * Sectoral measure validation
 */
export const validateCreateSectoralMeasure = [
  body('ministryId')
    .isUUID()
    .withMessage('Valid ministry ID is required'),
  body('fiscalYear')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Fiscal year must be between 2000 and 2100'),
  body('economicNatureId')
    .isUUID()
    .withMessage('Valid economic nature ID is required'),
  body('fundingSourceId')
    .isUUID()
    .withMessage('Valid funding source ID is required'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be 5-500 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('estimatedCost')
    .isFloat({ min: 0 })
    .withMessage('Estimated cost must be a positive number'),
  body('status')
    .optional()
    .isIn(['DRAFT', 'SUBMITTED', 'VALIDATED', 'REJECTED'])
    .withMessage('Invalid status'),
  handleValidationErrors,
];

/**
 * File upload validation
 */
export const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      const file = (req as any).file;
      if (!file) {
        throw new Error('File is required');
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must not exceed 10MB');
      }

      // Check file type (Excel only for imports)
      const allowedMimes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        throw new Error('Only Excel files (.xlsx, .xls) are allowed');
      }

      return true;
    }),
  handleValidationErrors,
];

/**
 * Export format validation
 */
export const validateExportFormat = [
  query('format')
    .isIn(['xlsx', 'pdf', 'csv'])
    .withMessage('Format must be xlsx, pdf, or csv'),
  handleValidationErrors,
];

/**
 * Comment validation
 */
export const validateCreateComment = [
  body('entityType')
    .isIn(['TOFE', 'CBMT', 'CDMT_GLOBAL', 'SECTORAL_MEASURE', 'ACTION_PLAN'])
    .withMessage('Invalid entity type'),
  body('entityId')
    .isUUID()
    .withMessage('Valid entity ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Comment must be 1-2000 characters'),
  handleValidationErrors,
];

/**
 * Workflow validation
 */
export const validateWorkflowTransition = [
  body('action')
    .isIn(['SUBMIT', 'VALIDATE', 'REJECT', 'REQUEST_CHANGES'])
    .withMessage('Invalid workflow action'),
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters'),
  handleValidationErrors,
];
