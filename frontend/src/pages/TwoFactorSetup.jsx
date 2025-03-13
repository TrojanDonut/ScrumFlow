import React, { useState } from 'react';
import { Form, Button, Card, Alert, InputGroup, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { setupTwoFactor, verifyTwoFactor, disableTwoFactor, clearTwoFactorSetupState } from '../store/slices/authSlice';
import { FaEye, FaEyeSlash, FaLock } from 'react-icons/fa';
import { formatErrorMessage } from '../utils/errorUtils';

const TwoFactorSetup = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState('initial'); // initial, setup, verify
  
  const dispatch = useDispatch();
  const { twoFactorSetup, loading, error, user } = useSelector(state => state.auth);
  
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    
    const result = await dispatch(setupTwoFactor(password));
    if (setupTwoFactor.fulfilled.match(result)) {
      setStep('setup');
    }
  };
  
  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    
    const result = await dispatch(verifyTwoFactor({
      token: verificationCode,
      secret_key: twoFactorSetup.secretKey
    }));
    
    if (verifyTwoFactor.fulfilled.match(result)) {
      setStep('success');
    }
  };
  
  const handleDisableSubmit = async (e) => {
    e.preventDefault();
    
    const result = await dispatch(disableTwoFactor(password));
    if (disableTwoFactor.fulfilled.match(result)) {
      setStep('initial');
      setPassword('');
      dispatch(clearTwoFactorSetupState());
    }
  };
  
  const renderInitialStep = () => (
    <>
      <Card.Title className="text-center mb-4">
        {user?.two_factor_enabled 
          ? 'Disable Two-Factor Authentication' 
          : 'Enable Two-Factor Authentication'}
      </Card.Title>
      
      {error && (
        <Alert variant="danger" dismissible>
          {formatErrorMessage(error)}
        </Alert>
      )}
      
      <p>
        {user?.two_factor_enabled 
          ? 'Two-factor authentication is currently enabled. Enter your password to disable it.' 
          : 'Two-factor authentication adds an extra layer of security to your account. You will need to enter a verification code from your authenticator app in addition to your password when logging in.'}
      </p>
      
      <Form onSubmit={user?.two_factor_enabled ? handleDisableSubmit : handleSetupSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <InputGroup>
            <InputGroup.Text>
              <FaLock />
            </InputGroup.Text>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <Button 
              variant="outline-secondary"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </Button>
          </InputGroup>
        </Form.Group>
        
        <Button
          variant={user?.two_factor_enabled ? "danger" : "primary"}
          type="submit"
          className="w-100 mt-3"
          disabled={loading}
        >
          {loading 
            ? (user?.two_factor_enabled ? 'Disabling...' : 'Setting up...') 
            : (user?.two_factor_enabled ? 'Disable Two-Factor Authentication' : 'Set Up Two-Factor Authentication')}
        </Button>
      </Form>
    </>
  );
  
  const renderSetupStep = () => (
    <>
      <Card.Title className="text-center mb-4">Set Up Two-Factor Authentication</Card.Title>
      
      {error && (
        <Alert variant="danger" dismissible>
          {formatErrorMessage(error)}
        </Alert>
      )}
      
      <Alert variant="info">
        <p>Follow these steps to set up two-factor authentication:</p>
        <ol>
          <li>Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.</li>
          <li>Scan the QR code below with your authenticator app.</li>
          <li>Enter the 6-digit verification code from your authenticator app.</li>
        </ol>
      </Alert>
      
      <Row className="mb-4">
        <Col className="text-center">
          <div className="qr-code-container mb-3">
            <img 
              src={twoFactorSetup.qrCode} 
              alt="QR Code for two-factor authentication" 
              style={{ maxWidth: '100%' }}
            />
          </div>
          <p className="text-muted">
            If you can't scan the QR code, you can manually enter this secret key in your authenticator app:
          </p>
          <p className="secret-key font-monospace">
            {twoFactorSetup.secretKey}
          </p>
        </Col>
      </Row>
      
      <Form onSubmit={handleVerifySubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Verification Code</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            required
            maxLength={6}
            pattern="[0-9]{6}"
          />
          <Form.Text className="text-muted">
            Enter the 6-digit code from your authenticator app
          </Form.Text>
        </Form.Group>
        
        <div className="d-flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('initial');
              dispatch(clearTwoFactorSetupState());
            }}
            className="flex-grow-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            className="flex-grow-1"
            disabled={loading || verificationCode.length !== 6}
          >
            {loading ? 'Verifying...' : 'Verify and Enable'}
          </Button>
        </div>
      </Form>
    </>
  );
  
  const renderSuccessStep = () => (
    <>
      <Card.Title className="text-center mb-4">Two-Factor Authentication Enabled</Card.Title>
      
      <Alert variant="success">
        <p>Two-factor authentication has been successfully enabled for your account.</p>
        <p>You will now need to enter a verification code from your authenticator app when logging in.</p>
      </Alert>
      
      <Button
        variant="primary"
        onClick={() => {
          setStep('initial');
          dispatch(clearTwoFactorSetupState());
        }}
        className="w-100"
      >
        Done
      </Button>
    </>
  );
  
  return (
    <div className="d-flex justify-content-center mt-5">
      <Card style={{ width: '500px' }}>
        <Card.Body>
          {step === 'initial' && renderInitialStep()}
          {step === 'setup' && renderSetupStep()}
          {step === 'success' && renderSuccessStep()}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TwoFactorSetup; 