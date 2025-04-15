import React from 'react';
import { Button } from 'react-bootstrap';

export const getButtonVariant = (status) => {
    switch (status) {
      case 'UNASSIGNED':
        return 'secondary';
      case 'ASSIGNED':
        return 'warning';
        case 'IN_PROGRESS':
        return 'danger';
      case 'COMPLETED':
        return 'primary';
      default:
        return 'dark';
    }
  };

export const formatStatus = (status) => {
    return status.replace('_', ' ');
};

// Generate tag (button) for a task
export const generateTaskStatusTag = (status) => {
    return (
      <Button
        variant={getButtonVariant(status)}
        size="sm"
        style={{ marginLeft: '10px', fontSize: '0.7rem', pointerEvents: 'none',}}
      >
        {formatStatus(status)}
      </Button>
    );
  };
