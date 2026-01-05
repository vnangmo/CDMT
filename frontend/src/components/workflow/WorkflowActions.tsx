import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Send,
  RateReview,
  CheckCircle,
  ThumbUp,
  Cancel,
  Undo,
} from '@mui/icons-material';
import { WorkflowStatus } from '../../types/workflow.types';
import sectoralMeasureService from '../../services/sectoralMeasure.service';

interface WorkflowActionsProps {
  documentType: string;
  documentId: string;
  currentStatus: WorkflowStatus;
  onStatusChange: () => void;
  disabled?: boolean;
}

const WorkflowActions: React.FC<WorkflowActionsProps> = ({
  documentType,
  documentId,
  currentStatus,
  onStatusChange,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'comment' | 'reject'>('comment');
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<() => Promise<any>>(() => async () => {});

  const handleAction = async (
    actionFn: () => Promise<any>,
    requiresInput?: 'comment' | 'reject'
  ) => {
    if (requiresInput) {
      setDialogType(requiresInput);
      setAction(() => actionFn);
      setDialogOpen(true);
    } else {
      setLoading(true);
      setError(null);
      try {
        await actionFn();
        onStatusChange();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDialogConfirm = async () => {
    setDialogOpen(false);
    setLoading(true);
    setError(null);
    try {
      await action();
      onStatusChange();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setComment('');
    }
  };

  const getAvailableActions = () => {
    const actions = [];

    switch (currentStatus) {
      case WorkflowStatus.DRAFT:
        actions.push({
          label: 'Soumettre',
          icon: <Send />,
          color: 'primary' as const,
          action: () => sectoralMeasureService.submit(documentId),
        });
        break;

      case WorkflowStatus.SUBMITTED:
        actions.push({
          label: 'Démarrer Révision',
          icon: <RateReview />,
          color: 'warning' as const,
          action: () => sectoralMeasureService.startReview(documentId),
        });
        actions.push({
          label: 'Retourner',
          icon: <Undo />,
          color: 'secondary' as const,
          action: () => sectoralMeasureService.returnToDraft(documentId, comment),
          requiresInput: 'comment' as const,
        });
        actions.push({
          label: 'Rejeter',
          icon: <Cancel />,
          color: 'error' as const,
          action: () => sectoralMeasureService.reject(documentId, comment),
          requiresInput: 'reject' as const,
        });
        break;

      case WorkflowStatus.UNDER_REVIEW:
        actions.push({
          label: 'Valider',
          icon: <CheckCircle />,
          color: 'primary' as const,
          action: () => sectoralMeasureService.validate(documentId, comment),
          requiresInput: 'comment' as const,
        });
        actions.push({
          label: 'Retourner',
          icon: <Undo />,
          color: 'secondary' as const,
          action: () => sectoralMeasureService.returnToDraft(documentId, comment),
          requiresInput: 'comment' as const,
        });
        actions.push({
          label: 'Rejeter',
          icon: <Cancel />,
          color: 'error' as const,
          action: () => sectoralMeasureService.reject(documentId, comment),
          requiresInput: 'reject' as const,
        });
        break;

      case WorkflowStatus.VALIDATED:
        actions.push({
          label: 'Approuver',
          icon: <ThumbUp />,
          color: 'success' as const,
          action: () => sectoralMeasureService.approve(documentId, comment),
          requiresInput: 'comment' as const,
        });
        actions.push({
          label: 'Retour Révision',
          icon: <Undo />,
          color: 'warning' as const,
          action: () => sectoralMeasureService.returnToDraft(documentId, comment),
          requiresInput: 'comment' as const,
        });
        actions.push({
          label: 'Rejeter',
          icon: <Cancel />,
          color: 'error' as const,
          action: () => sectoralMeasureService.reject(documentId, comment),
          requiresInput: 'reject' as const,
        });
        break;

      case WorkflowStatus.REJECTED:
        actions.push({
          label: 'Retourner Brouillon',
          icon: <Undo />,
          color: 'primary' as const,
          action: () => sectoralMeasureService.returnToDraft(documentId),
        });
        break;
    }

    return actions;
  };

  const availableActions = getAvailableActions();

  if (availableActions.length === 0 || currentStatus === WorkflowStatus.APPROVED) {
    return null;
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ButtonGroup variant="contained" disabled={disabled || loading}>
        {availableActions.map((actionItem, index) => (
          <Button
            key={index}
            color={actionItem.color}
            startIcon={actionItem.icon}
            onClick={() =>
              handleAction(actionItem.action, actionItem.requiresInput)
            }
          >
            {actionItem.label}
          </Button>
        ))}
      </ButtonGroup>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogType === 'reject' ? 'Rejeter le document' : 'Ajouter un commentaire'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={dialogType === 'reject' ? 'Raison du rejet *' : 'Commentaire (optionnel)'}
            type="text"
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required={dialogType === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button
            onClick={handleDialogConfirm}
            variant="contained"
            color={dialogType === 'reject' ? 'error' : 'primary'}
            disabled={dialogType === 'reject' && !comment.trim()}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WorkflowActions;
