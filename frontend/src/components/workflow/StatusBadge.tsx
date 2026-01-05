import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { WorkflowStatus, WORKFLOW_STATUS_CONFIG } from '../../types/workflow.types';

interface StatusBadgeProps {
  status: WorkflowStatus;
  size?: 'small' | 'medium';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const config = WORKFLOW_STATUS_CONFIG[status];

  if (!config) {
    return <Chip label={status} size={size} />;
  }

  return (
    <Tooltip title={config.description}>
      <Chip
        label={config.label}
        color={config.color}
        size={size}
        sx={{
          fontWeight: 500,
          textTransform: 'uppercase',
          fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        }}
      />
    </Tooltip>
  );
};

export default StatusBadge;
