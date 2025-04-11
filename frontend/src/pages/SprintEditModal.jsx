import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Badge } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateSprint } from '../store/slices/sprintSlice';

const SprintEditModal = ({ show, handleClose, sprintId, projectId, sprintData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [velocity, setVelocity] = useState('');
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  // Determine sprint status based on ORIGINAL data, not the edited values
  const getSprintStatus = () => {
    if (!sprintData || !sprintData.start_date || !sprintData.end_date) return 'unknown';
    
    const now = new Date();
    if (new Date(sprintData.start_date) > now) {
      return 'future';
    } else if (new Date(sprintData.end_date) < now) {
      return 'past';
    }
    return 'active';
  };
  const sprintStatus = getSprintStatus();

  // Visual indicator for sprint status
  const getStatusBadge = () => {
    switch(sprintStatus) {
      case 'past':
        return <Badge bg="secondary">Past Sprint - Read Only</Badge>;
      case 'active':
        return <Badge bg="success">Active Sprint - Limited Editing</Badge>;
      case 'future':
        return <Badge bg="primary">Future Sprint - Full Editing</Badge>;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (sprintData) {
      setStartDate(sprintData.start_date || '');
      setEndDate(sprintData.end_date || '');
      setVelocity(sprintData.velocity || '');
    }
  }, [sprintData]);

  const handleSave = async () => {
    if (!startDate || !endDate || !velocity) {
      setError('All fields are required.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date.');
      return;
    }

    // Check for change restrictions based on sprint status
    if (sprintStatus === 'past') {
      setError('Past sprints cannot be modified to maintain historical accuracy.');
      return;
    }

    if (sprintStatus === 'active' && 
        (startDate !== sprintData.start_date || endDate !== sprintData.end_date)) {
      setError('You cannot change start or end dates for an active sprint.');
      return;
    }

    try {
      // For active sprints, only send velocity update
      const updateData = sprintStatus === 'active' 
        ? { velocity, project: projectId }
        : { start_date: startDate, end_date: endDate, velocity, project: projectId };
      
      const result = await dispatch(
        updateSprint({
          sprintId,
          projectId,
          sprintData: updateData,
        })
      ).unwrap();
      
      // Close the modal and indicate success
      handleClose(true);
    } catch (err) {
      setError('Failed to update sprint. Please try again.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          Edit Sprint 
          <div className="mt-1">{getStatusBadge()}</div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        {sprintStatus === 'past' && (
          <Alert variant="info">
            Past sprints cannot be modified to maintain historical accuracy.
          </Alert>
        )}
        
        {sprintStatus === 'active' && (
          <Alert variant="info">
            For active sprints, you can only modify the velocity (points).
          </Alert>
        )}
        
        <Form>
          <Form.Group controlId="startDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={sprintStatus !== 'future'} // Disable if not future
            />
            {sprintStatus !== 'future' && (
              <Form.Text className="text-muted">
                Start date can only be changed for future sprints.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="endDate" className="mt-3">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={sprintStatus !== 'future'} // Disable if not future
            />
            {sprintStatus !== 'future' && (
              <Form.Text className="text-muted">
                End date can only be changed for future sprints.
              </Form.Text>
            )}
          </Form.Group>
          <Form.Group controlId="velocity" className="mt-3">
            <Form.Label>Velocity (points)</Form.Label>
            <Form.Control
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(e.target.value)}
              disabled={sprintStatus === 'past'}
            />
            {sprintStatus === 'past' ? (
              <Form.Text className="text-muted">
                Velocity cannot be changed for past sprints.
              </Form.Text>
            ) : (
              <Form.Text className="text-muted">
                The maximum total points of stories that can be added to this sprint.
              </Form.Text>
            )}
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave}
          disabled={sprintStatus === 'past'}
        >
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SprintEditModal;