import React, { useEffect, useState } from 'react';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  RateReview,
  Send,
  ThumbUp,
  Undo,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import workflowService from '../../services/workflow.service';
import { WorkflowHistory, WorkflowAction } from '../../types/workflow.types';

interface WorkflowTimelineProps {
  documentType: string;
  documentId: string;
}

const ACTION_ICONS: Record<WorkflowAction, React.ReactElement> = {
  [WorkflowAction.CREATE]: <CheckCircle />,
  [WorkflowAction.SUBMIT]: <Send />,
  [WorkflowAction.START_REVIEW]: <RateReview />,
  [WorkflowAction.VALIDATE]: <CheckCircle />,
  [WorkflowAction.APPROVE]: <ThumbUp />,
  [WorkflowAction.REJECT]: <Cancel />,
  [WorkflowAction.RETURN]: <Undo />,
};

const ACTION_COLORS: Record<WorkflowAction, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  [WorkflowAction.CREATE]: 'info',
  [WorkflowAction.SUBMIT]: 'info',
  [WorkflowAction.START_REVIEW]: 'warning',
  [WorkflowAction.VALIDATE]: 'primary',
  [WorkflowAction.APPROVE]: 'success',
  [WorkflowAction.REJECT]: 'error',
  [WorkflowAction.RETURN]: 'warning',
};

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
  documentType,
  documentId,
}) => {
  const [history, setHistory] = useState<WorkflowHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [documentType, documentId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workflowService.getHistory(documentType, documentId);
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (history.length === 0) {
    return (
      <Alert severity="info">
        Aucun historique de workflow pour ce document
      </Alert>
    );
  }

  return (
    <Timeline position="right">
      {history.map((entry, index) => (
        <TimelineItem key={entry.id}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
            <Typography variant="caption" display="block">
              {format(new Date(entry.actionAt), 'dd MMM yyyy', { locale: fr })}
            </Typography>
            <Typography variant="caption" display="block">
              {format(new Date(entry.actionAt), 'HH:mm', { locale: fr })}
            </Typography>
          </TimelineOppositeContent>

          <TimelineSeparator>
            <TimelineDot color={ACTION_COLORS[entry.action] || 'grey'}>
              {ACTION_ICONS[entry.action]}
            </TimelineDot>
            {index < history.length - 1 && <TimelineConnector />}
          </TimelineSeparator>

          <TimelineContent>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {entry.action}
                </Typography>
                <Chip
                  label={entry.toStatus}
                  size="small"
                  color={ACTION_COLORS[entry.action]}
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Par: {entry.validatorName || `${entry.actionByUser?.firstName} ${entry.actionByUser?.lastName}`}
              </Typography>

              {entry.validatorRole && (
                <Typography variant="caption" color="text.secondary" display="block">
                  Rôle: {entry.validatorRole}
                </Typography>
              )}

              {entry.comment && (
                <Box mt={1} p={1} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" fontStyle="italic">
                    "{entry.comment}"
                  </Typography>
                </Box>
              )}

              {entry.rejectionReason && (
                <Box mt={1} p={1} bgcolor="error.50" borderRadius={1}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    Raison du rejet:
                  </Typography>
                  <Typography variant="body2" color="error.dark">
                    {entry.rejectionReason}
                  </Typography>
                </Box>
              )}
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default WorkflowTimeline;
