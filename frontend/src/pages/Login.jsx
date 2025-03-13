import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Alert, InputGroup } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError, fetchCurrentUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock, FaUser, FaShieldAlt } from 'react-icons/fa';
import { formatErrorMessage } from '../utils/errorUtils';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (error && error.two_factor_required) {
      setTwoFactorRequired(true);
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await dispatch(login({ 
        username, 
        password,
        ...(twoFactorRequired && { otp_token: otpToken })
      }));
      
      if (login.fulfilled.match(result)) {
        dispatch(fetchCurrentUser());
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ width: '400px' }}>
        <Card.Body>
          <Card.Title className="text-center mb-4">Login</Card.Title>
          
          {error && !error.two_factor_required && (
            <Alert variant="danger" onClose={() => dispatch(clearError())} dismissible>
              {formatErrorMessage(error)}
            </Alert>
          )}
          
          {error && error.two_factor_required && (
            <Alert variant="info" onClose={() => dispatch(clearError())} dismissible>
              <Alert.Heading>
                <FaShieldAlt className="me-2" />
                Two-Factor Authentication Required
              </Alert.Heading>
              <p>For your security, please enter the 6-digit code from your authenticator app to continue.</p>
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaUser />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </InputGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <InputGroup.Text>
                  <FaLock />
                </InputGroup.Text>
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  onCopy={(e) => e.preventDefault()}
                  onPaste={(e) => e.preventDefault()}
                  onCut={(e) => e.preventDefault()}
                />
                <Button 
                  variant="outline-secondary"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </Button>
              </InputGroup>
            </Form.Group>
            
            {twoFactorRequired && (
              <Form.Group className="mb-3">
                <Form.Label>Two-Factor Authentication Code</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
                <Form.Text className="text-muted">
                  Enter the 6-digit code from your authenticator app
                </Form.Text>
              </Form.Group>
            )}

            <Button
              variant="primary"
              type="submit"
              className="w-100 mt-3"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login; 