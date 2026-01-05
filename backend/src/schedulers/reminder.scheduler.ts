import cron from 'node-cron';
import prisma from '../config/database';
import NotificationService from '../services/notification.service';

// Document type to model name mapping
const DOCUMENT_TYPE_TO_MODEL: Record<string, string> = {
  'SectoralMeasure': 'sectoralMeasure',
  'ActionPlan': 'actionPlan',
  'MacroFramework': 'macroFramework',
  'RevenueProjection': 'revenueProjection',
  'ExpenseProjection': 'expenseProjection',
  'CBMTDocument': 'cBMTDocument',
  'TrendBudgetConfig': 'trendBudgetConfig',
  'CDMTGlobalScenario': 'cDMTGlobalScenario',
};

/**
 * Setup reminder scheduler
 *
 * Runs daily at 8:00 AM Djibouti time (EAT/UTC+3) to send reminders
 * for documents that have been pending validation for 3+ days.
 *
 * Features:
 * - Checks all document types for pending documents
 * - Sends notifications to document creator and assigned reviewer
 * - Both in-app and email notifications
 * - Calculates exact days waiting
 *
 * @example
 * ```typescript
 * // In server.ts or app.ts:
 * import { setupReminderScheduler } from './schedulers/reminder.scheduler';
 *
 * setupReminderScheduler();
 * ```
 */
export function setupReminderScheduler(): void {
  // Run daily at 8:00 AM (Djibouti timezone: EAT = UTC+3)
  // Cron expression: '0 8 * * *' = At 08:00 every day
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('[ReminderScheduler] Starting daily reminder job at', new Date().toISOString());

      try {
        await sendPendingDocumentReminders();
        console.log('[ReminderScheduler] Job completed successfully');
      } catch (error) {
        console.error('[ReminderScheduler] Error during job execution:', error);
      }
    },
    {
      timezone: 'Africa/Djibouti', // EAT (UTC+3)
    }
  );

  console.log('[ReminderScheduler] Scheduler initialized - daily at 8:00 AM EAT');
}

/**
 * Send reminders for all pending documents (3+ days old)
 */
async function sendPendingDocumentReminders(): Promise<void> {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let totalReminders = 0;

  // Check each document type
  for (const [docType, modelName] of Object.entries(DOCUMENT_TYPE_TO_MODEL)) {
    try {
      const reminders = await processDocumentType(docType, modelName, threeDaysAgo);
      totalReminders += reminders;
    } catch (error) {
      console.error(`[ReminderScheduler] Error processing ${docType}:`, error);
    }
  }

  console.log(`[ReminderScheduler] Sent ${totalReminders} reminders in total`);
}

/**
 * Process a specific document type
 */
async function processDocumentType(
  docType: string,
  modelName: string,
  threeDaysAgo: Date
): Promise<number> {
  try {
    // @ts-ignore - Dynamic model access
    const documents = await prisma[modelName].findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        submittedAt: { lte: threeDaysAgo }, // 3+ days ago
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (documents.length === 0) {
      return 0;
    }

    console.log(`[ReminderScheduler] Found ${documents.length} pending ${docType} documents`);

    let reminderCount = 0;

    for (const doc of documents) {
      // Calculate days waiting
      const daysWaiting = Math.floor(
        (Date.now() - new Date(doc.submittedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get assigned reviewer (if exists)
      const assignedReviewerId = await getAssignedReviewer(docType, doc.id, doc.ministryId);

      // Send reminder notification
      await NotificationService.notifyPendingDocument({
        documentType: docType,
        documentId: doc.id,
        documentCode: doc.code || doc.id,
        daysWaiting,
        creatorId: doc.createdBy || doc.createdByUser?.id,
        assignedReviewerId,
      });

      reminderCount++;
    }

    return reminderCount;
  } catch (error) {
    console.error(`[ReminderScheduler] Error processing ${docType}:`, error);
    return 0;
  }
}

/**
 * Get assigned reviewer for a document
 *
 * This is a simplified version - you may want to enhance this
 * based on your actual workflow assignment logic
 */
async function getAssignedReviewer(
  docType: string,
  documentId: string,
  ministryId?: string
): Promise<string | undefined> {
  try {
    // Note: WorkflowState is a simple status lookup table without document assignments
    // For now, we skip workflow-based assignment and fall back to ministry-based reviewer lookup

    // Find a reviewer for the ministry
    const reviewerRoles = await prisma.role.findMany({
      where: {
        name: { in: ['REVIEWER', 'VALIDATOR'] },
      },
      select: { id: true },
    });

    const roleIds = reviewerRoles.map(r => r.id);

    const reviewer = await prisma.user.findFirst({
      where: {
        roleId: { in: roleIds },
        ...(ministryId && { ministryId }),
      },
      select: { id: true },
    });

    return reviewer?.id;
  } catch (error) {
    console.error('[ReminderScheduler] Error finding assigned reviewer:', error);
    return undefined;
  }
}

/**
 * Manual trigger for testing (can be called from a route)
 */
export async function triggerReminderJobManually(): Promise<{ success: boolean; count: number }> {
  try {
    console.log('[ReminderScheduler] Manual trigger started');
    await sendPendingDocumentReminders();
    console.log('[ReminderScheduler] Manual trigger completed');
    return { success: true, count: 0 };
  } catch (error) {
    console.error('[ReminderScheduler] Manual trigger failed:', error);
    return { success: false, count: 0 };
  }
}
