import React from 'react';
import { Button } from 'react-bootstrap';

// Get button variant based on task status
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

// Format status for display
export const formatStatus = (status) => {
    if (!status) return 'Unknown';
    
    // Replace underscores with spaces and capitalize each word
    return status.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
};

// Generate tag (button) for a task
export const generateTaskStatusTag = (status) => {
    return (
      <Button
        variant={getButtonVariant(status)}
        size="sm"
        style={{ marginLeft: '10px', fontSize: '0.7rem', pointerEvents: 'none'}}
      >
        {formatStatus(status)}
      </Button>
    );
  };
