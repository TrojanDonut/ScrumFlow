import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { updateSprint } from '../store/slices/sprintSlice';

const SprintEditModal = ({ show, handleClose, sprintId, projectId, sprintData }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [velocity, setVelocity] = useState('');
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

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

    try {
      await dispatch(
        updateSprint({
          sprintId,
          projectId,
          sprintData: { start_date: startDate, end_date: endDate, velocity: velocity, project: projectId },
        })
      ).unwrap();
      handleClose();
    } catch (err) {
      setError('Failed to update sprint. Please try again.');
    }
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Sprint</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group controlId="startDate">
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="endDate" className="mt-3">
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group controlId="velocity" className="mt-3">
            <Form.Label>Velocity</Form.Label>
            <Form.Control
              type="number"
              value={velocity}
              onChange={(e) => setVelocity(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SprintEditModal;