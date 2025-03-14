import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, InputGroup, ProgressBar } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { changePassword, clearPasswordChangeState } from '../store/slices/authSlice';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { formatErrorMessage } from '../utils/errorUtils';

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  const dispatch = useDispatch();
  const { passwordChange } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Clean up when component unmounts
    return () => {
      dispatch(clearPasswordChangeState());
    };
  }, [dispatch]);
  
  useEffect(() => {
    // Calculate password strength
    if (newPassword.length === 0) {
      setPasswordStrength(0);
      setPasswordFeedback('Enter your new password');
      return;
    }
    
    let strength = 0;
    let feedback = '';
    
    // Check length
    if (newPassword.length < 12) {
      feedback = 'Password is too short (min 12 characters)';
    } else if (newPassword.length > 64) {
      feedback = 'Password is too long (max 128 characters)';
    } else {
      strength += 20;
      feedback = 'Password length is good';
    }
    
    // Check for lowercase letters
    if (/[a-z]/.test(newPassword)) {
      strength += 20;
    }
    
    // Check for uppercase letters
    if (/[A-Z]/.test(newPassword)) {
      strength += 20;
    }
    
    // Check for numbers
    if (/[0-9]/.test(newPassword)) {
      strength += 20;
    }
    
    // Check for special characters
    if (/[^A-Za-z0-9]/.test(newPassword)) {
      strength += 20;
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  }, [newPassword]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== newPasswordConfirm) {
      alert('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 12) {
      alert('Password must be at least 12 characters long');
      return;
    }
    
    if (newPassword.length > 128) {
      alert('Password cannot be longer than 128 characters');
      return;
    }
    
    await dispatch(changePassword({
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm
    }));
  };
  
  const getPasswordStrengthVariant = () => {
    if (passwordStrength < 40) return 'danger';
    if (passwordStrength < 80) return 'warning';
    return 'success';
  };
  
  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ width: '500px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Change Password</Card.Title>
          
          {passwordChange.error && (
            <Alert variant="danger" onClose={() => dispatch(clearPasswordChangeState())} dismissible>
              {formatErrorMessage(passwordChange.error)}
            </Alert>
          )}
          
          {passwordChange.success && (
            <Alert variant="success" onClose={() => dispatch(clearPasswordChangeState())} dismissible>
              Password changed successfully!
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showOldPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  aria-label={showOldPassword ? "Hide password" : "Show password"}
                >
                  {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              <div className="mt-2">
                <ProgressBar 
                  now={passwordStrength} 
                  variant={getPasswordStrengthVariant()} 
                  className="mb-1"
                />
                <small className="text-muted">{passwordFeedback}</small>
              </div>
              <Form.Text className="text-muted">
                Password must be at least 12 characters long and include uppercase, lowercase, numbers, and special characters.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showNewPasswordConfirm ? "text" : "password"}
                  placeholder="Confirm your new password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                  aria-label={showNewPasswordConfirm ? "Hide password" : "Show password"}
                >
                  {showNewPasswordConfirm ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
              {newPassword !== newPasswordConfirm && newPasswordConfirm.length > 0 && (
                <Form.Text className="text-danger">
                  Passwords do not match
                </Form.Text>
              )}
            </Form.Group>

            <Button
              variant="primary"
              type="submit"
              className="w-100 mt-3"
              disabled={passwordChange.loading}
            >
              {passwordChange.loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ChangePassword; 