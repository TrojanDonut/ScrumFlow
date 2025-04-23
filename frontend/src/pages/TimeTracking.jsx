import React, { useState, useEffect } from 'react';
import { Button, Form, Table, Alert, Accordion } from 'react-bootstrap';
import { useSelector } from 'react-redux';
import axios from 'axios';

const TimeTracking = ({ task, onTimeLogged }) => {
  const [timeLogs, setTimeLogs] = useState([]);
  const [manualHours, setManualHours] = useState('');
  const [description, setDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState(task?.status);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const currentUser = useSelector((state) => state.auth.user);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  
  // Update tracking state and task status whenever task changes
  useEffect(() => {
    if (task && task.id && !task.id.toString().includes('temp-')) {
      setTaskStatus(task.status);
      fetchTimeLogs();
      checkForActiveSession();
    }
  }, [task]);
  
  // Check if there's an active session for this task
  const checkForActiveSession = async () => {
    // Skip for temporary tasks
    if (!task.id || task.id.toString().includes('temp-')) {
      return;
    }
    
    try {
      // SessionStatus would be stored in localStorage with a key specific to this task and user
      const sessionKey = `task_session_${task.id}_${currentUser.id}`;
      const storedSession = localStorage.getItem(sessionKey);
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        setActiveSession(true);
        setSessionStartTime(new Date(sessionData.startTime));
      }
    } catch (error) {
      console.error('Error checking for active session:', error);
    }
  };

  const fetchTimeLogs = async () => {
    // Skip API call for temporary tasks
    if (!task.id || task.id.toString().includes('temp-')) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/tasks/${task.id}/logs/`);
      setTimeLogs(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching time logs:', error);
      // Don't show errors for 404s on time logs as they might be expected for new tasks
      if (error.response && error.response.status !== 404) {
        setError('Error loading time logs. Please try refreshing.');
      }
    }
  };

  const fetchTaskStatus = async () => {
    // Skip API call for temporary tasks
    if (!task.id || task.id.toString().includes('temp-')) {
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/tasks/${task.id}/`);
      setTaskStatus(response.data.status);
      setError('');
    } catch (error) {
      console.error('Error fetching task status:', error);
    }
  };

  const startSession = async () => {
    setError('');
    try {
      // First ensure task is in progress
      if (taskStatus !== 'IN_PROGRESS') {
        await axios.post(`${API_URL}/tasks/${task.id}/start/`);
        setTaskStatus('IN_PROGRESS');
      }
      
      // Start tracking session
      const response = await axios.post(`${API_URL}/tasks/${task.id}/start-session/`);
      
      if (response.data.success) {
        setActiveSession(true);
        const now = new Date();
        setSessionStartTime(now);
        
        // Store session info in localStorage to persist across page reloads
        const sessionKey = `task_session_${task.id}_${currentUser.id}`;
        localStorage.setItem(sessionKey, JSON.stringify({
          active: true,
          startTime: now.toISOString(),
          taskId: task.id
        }));
        
        // We don't need to trigger onTimeLogged for starting a session
        // This was causing unnecessary story refreshes
      } else {
        setError(response.data.error || 'Failed to start session');
      }
    } catch (error) {
      console.error('Error starting time tracking:', error);
      setError('Failed to start tracking: ' + (error.response?.data?.error || error.message));
    }
  };

  const stopSession = async () => {
    setError('');
    try {
      const response = await axios.post(`${API_URL}/tasks/${task.id}/stop-session/`);
      
      if (response.data.success) {
        setActiveSession(false);
        setSessionStartTime(null);
        
        // Clear session info from localStorage
        const sessionKey = `task_session_${task.id}_${currentUser.id}`;
        localStorage.removeItem(sessionKey);
        
        // Refresh time logs to show the newly logged time
        fetchTimeLogs();
        
        // Only call onTimeLogged when time is actually recorded
        if (response.data.hours_logged > 0 && onTimeLogged) {
          onTimeLogged();
        }
      } else {
        setError(response.data.error || 'No active session found to stop');
      }
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      // If we get a 400 error about no active session, clear the session state
      if (error.response && error.response.status === 400) {
        setActiveSession(false);
        setSessionStartTime(null);
        const sessionKey = `task_session_${task.id}_${currentUser.id}`;
        localStorage.removeItem(sessionKey);
      }
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
      // If task is not in progress, start it
      if (taskStatus !== 'IN_PROGRESS') {
        await axios.post(`${API_URL}/tasks/${task.id}/start/`);
        setTaskStatus('IN_PROGRESS');
      }
      
      // Log time by stopping (but task remains in progress)
      await axios.post(`${API_URL}/tasks/${task.id}/stop/`, {
        hours_spent: parseFloat(manualHours),
        description: description || 'Manual time entry'
      });
      
      // Clear form and update UI
      setManualHours('');
      setDescription('');
      
      // Refresh data
      fetchTimeLogs();
      
      // Only call onTimeLogged for manual time logging since we know time was logged
      if (onTimeLogged) {
        onTimeLogged();
      }
    } catch (error) {
      console.error('Error logging manual time:', error);
      setError('Error logging time: ' + (error.response?.data?.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Calculate elapsed time for active session
  const getElapsedTime = () => {
    if (!activeSession || !sessionStartTime) return '';
    
    const now = new Date();
    const elapsed = now - sessionStartTime;
    
    // Format elapsed time as HH:MM:SS
    const seconds = Math.floor((elapsed / 1000) % 60);
    const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Only show time tracking controls if user is assigned to the task and it's in progress
  const isAssignedToMe = task.assigned_to === currentUser?.id;
  
  // Don't render anything for:
  // 1. Temporary tasks (id includes temp-)
  // 2. Tasks not assigned to the current user
  // 3. Tasks that are not IN_PROGRESS status
  if (!task.id || 
      task.id.toString().includes('temp-') || 
      !isAssignedToMe || 
      task.status !== 'IN_PROGRESS') {
    return null;
  }

  // Get the button label based on current tracking status
  const getSessionButtonLabel = () => {
    if (taskStatus === 'COMPLETED') {
      return 'Completed';
    } else if (activeSession) {
      return 'Stop Session';
    } else {
      return 'Start Session';
    }
  };

  // Get the button variant based on current tracking status
  const getSessionButtonVariant = () => {
    if (taskStatus === 'COMPLETED') {
      return 'primary';
    } else if (activeSession) {
      return 'danger';
    } else {
      return 'success';
    }
  };

  const handleSessionButton = () => {
    if (activeSession) {
      stopSession();
    } else {
      startSession();
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
            
            {/* Time tracking controls - only available if task is not completed */}
            {taskStatus !== 'COMPLETED' && (
              <div className="mb-3">
                <Button 
                  variant={getSessionButtonVariant()}
                  onClick={handleSessionButton}
                  disabled={taskStatus === 'COMPLETED'}
                >
                  {getSessionButtonLabel()}
                </Button>
                
                {activeSession && (
                  <span className="text-success ms-2">
                    <small>Time tracking session is active</small>
                  </span>
                )}
              </div>
            )}

            {/* Manual time entry form - available for all task statuses except completed */}
            {taskStatus !== 'COMPLETED' && (
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
                    >
                      Log Time
                    </Button>
                  </div>
                </Form.Group>
              </Form>
            )}

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