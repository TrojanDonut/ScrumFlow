import React from 'react';
import { Navbar, Nav, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { FaUserCog, FaLock, FaShieldAlt, FaUser, FaInfoCircle } from 'react-icons/fa';

const Header = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Scrum App</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                <Nav.Link as={Link} to="/projects">Projects</Nav.Link>
                {user?.user_type === 'ADMIN' && (
                  <Nav.Link as={Link} to="/users">User Management</Nav.Link>
                )}
                <Nav.Link as={Link} to="/instructions">
                  <FaInfoCircle className="me-1" />
                  Instructions
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                <NavDropdown 
                  title={
                    <span>
                      <FaUserCog className="me-1" />
                      {user?.username}
                    </span>
                  } 
                  id="user-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile">
                    <FaUser className="me-2" />
                    My Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/change-password">
                    <FaLock className="me-2" />
                    Change Password
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/two-factor-setup">
                    <FaShieldAlt className="me-2" />
                    {user?.two_factor_enabled ? 'Manage Two-Factor Auth' : 'Enable Two-Factor Auth'}
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header; 