import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const RejectionReasonModal = ({ show, handleClose, onReject, storyName }) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleSubmit = () => {
    onReject(rejectionReason);
    setRejectionReason(''); // Reset field after submission
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Reject Story</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>You are about to reject the story: <strong>{storyName}</strong></p>
        <p>Please provide a reason for rejection:</p>
        <Form>
          <Form.Group className="mb-3">
            <Form.Control
              as="textarea"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <Form.Text className="text-muted">
              A clear explanation helps the team understand what needs to be improved.
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleSubmit}
          disabled={!rejectionReason.trim()}
        >
          Reject Story
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RejectionReasonModal;