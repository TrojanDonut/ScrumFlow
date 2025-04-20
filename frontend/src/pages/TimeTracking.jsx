import React, { useState, useEffect } from 'react';
import { Button, Form, Table, Alert, Accordion } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';

const TimeTracking = ({ task, onTimeLogged }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [timeLogs, setTimeLogs] = useState([]);
  const [manualHours, setManualHours] = useState('');
  const [description, setDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState(task?.status);
  const [error, setError] = useState('');
  const currentUser = useSelector((state) => state.auth.user);
  const API_URL = 'http://localhost:8000/api';
  
  // Update tracking state and task status whenever task changes
  useEffect(() => {
    if (task) {
      setTaskStatus(task.status);
      setIsTracking(task.status === 'IN_PROGRESS');
      fetchTimeLogs();
    }
  }, [task]);

  const fetchTimeLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${task.id}/logs/`);
      setTimeLogs(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching time logs:', error);
    }
  };

  const fetchTaskStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${task.id}/`);
      setTaskStatus(response.data.status);
      setIsTracking(response.data.status === 'IN_PROGRESS');
      setError('');
    } catch (error) {
      console.error('Error fetching task status:', error);
    }
  };

  const startTracking = async () => {
    setError('');
    try {
      await axios.post(`${API_URL}/tasks/${task.id}/start/`);
      setIsTracking(true);
      setTaskStatus('IN_PROGRESS');
      if (onTimeLogged) onTimeLogged();
    } catch (error) {
      console.error('Error starting time tracking:', error);
      setError('Failed to start tracking: ' + (error.response?.data?.error || error.message));
    }
  };

  const stopTracking = async () => {
    setError('');
    try {
      await axios.post(`${API_URL}/tasks/${task.id}/stop/`, {
        hours_spent: 0.5, // Default minimal time
        description: "Auto logged from session"
      });
      setIsTracking(false);
      setTaskStatus('ASSIGNED');
      fetchTimeLogs();
      if (onTimeLogged) onTimeLogged();
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      setError('Failed to stop tracking: ' + (error.response?.data?.error || error.message));
    }
  };

  const logManualTime = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!manualHours || parseFloat(manualHours) <= 0) {
      setError('Please enter a valid number of hours');
      return;
    }
    
    try {
      // Step 1: Start the task (change status to IN_PROGRESS)
      await axios.post(`${API_URL}/tasks/${task.id}/start/`);
      
      // Step 2: Immediately stop it with the logged time
      await axios.post(`${API_URL}/tasks/${task.id}/stop/`, {
        hours_spent: parseFloat(manualHours),
        description: description || 'Manual time entry'
      });
      
      // Clear form and update UI
      setManualHours('');
      setDescription('');
      setTaskStatus('ASSIGNED');
      setIsTracking(false);
      
      // Refresh data
      fetchTimeLogs();
      if (onTimeLogged) onTimeLogged();
    } catch (error) {
      console.error('Error logging manual time:', error);
      setError('Error logging time: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Only show time tracking controls if user is assigned to the task
  const isAssignedToMe = task.assigned_to === currentUser?.id;
  if (!isAssignedToMe) {
    return null;
  }

  // Get the button label based on current tracking status
  const getTrackingButtonLabel = () => {
    if (taskStatus === 'COMPLETED') {
      return 'Completed';
    } else if (isTracking) {
      return 'Stop Tracking';
    } else {
      return 'Start Tracking';
    }
  };

  // Get the button variant based on current tracking status
  const getTrackingButtonVariant = () => {
    if (taskStatus === 'COMPLETED') {
      return 'primary';
    } else if (isTracking) {
      return 'danger';
    } else {
      return 'success';
    }
  };

  const handleTrackingButton = () => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  };

  return (
    <div className="mt-4">
      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Time Tracking</Accordion.Header>
          <Accordion.Body>
            <h5>Time Tracking</h5>
            
            {error && (
              <Alert variant="danger" className="mt-2 mb-2 py-2" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}
            
            {/* Time tracking controls */}
            <div className="mb-3">
              <Button 
                variant={getTrackingButtonVariant()}
                onClick={handleTrackingButton}
                disabled={taskStatus === 'COMPLETED'}
              >
                {getTrackingButtonLabel()}
              </Button>
            </div>

            {/* Manual time entry form - always available even when not tracking */}
            <Form onSubmit={logManualTime} className="mb-4">
              <Form.Group className="mb-3">
                <Form.Label>Manual Time Entry</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="number"
                    placeholder="Hours"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    min="0.1"
                    step="0.1"
                    required
                    style={{ maxWidth: '100px' }}
                  />
                  <Form.Control
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={taskStatus === 'COMPLETED'}
                  >
                    Log Time
                  </Button>
                </div>
                <small className="text-muted mt-1 d-block">
                  Manual time entry works even when the task is not being actively tracked.
                </small>
              </Form.Group>
            </Form>

            {/* Time logs table */}
            <h6>Time Logs</h6>
            {timeLogs.length > 0 ? (
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Hours</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDate(log.date)}</td>
                      <td>{log.hours_spent}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-muted">No time logs recorded yet.</p>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default TimeTracking; 