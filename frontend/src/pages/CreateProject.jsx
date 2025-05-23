import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { createProject, clearProjectError, addMemberToProject } from '../store/slices/projectSlice';
import { useNavigate } from 'react-router-dom';
import { formatErrorMessage } from '../utils/errorUtils';
import { fetchUsers } from '../store/slices/userSlice'; // Assuming you have a slice for fetching users

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, members } = useSelector(state => state.projects);
  const { users } = useSelector(state => state.users); // Assuming users are stored in state.users
  const [project, setProject] = useState({
    name: '',
    description: '',
    product_owner: '',
    scrum_master: ''
  });

  const [developers, setDevelopers] = useState([]);

  useEffect(() => {
    dispatch(fetchUsers(true)); // Fetch users when the component mounts
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProject({
      ...project,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createProject(project));
    const projectId = result.payload.id;
    if (projectId) {
      // Add members to the project
      const addMemberPromises = developers.map(dev => {
        return dispatch(addMemberToProject({userId: dev.id, projectId, role: 'DEVELOPER'}));
      });
    };
      if (createProject.fulfilled.match(result)) {
        navigate('/projects');
      }
  }


  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center mt-5">
      <div style={{ width: '600px' }}>
        <h1>Create Project</h1>
        {error && (
          <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
            {formatErrorMessage(error)}
          </Alert>
        )}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={project.name}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              value={project.description}
              onChange={handleInputChange}
              rows={3}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Product Owner</Form.Label>
            <Form.Control
              as="select"
              name="product_owner"
              value={project.product_owner}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Product Owner</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Scrum Master</Form.Label>
            <Form.Control
              as="select"
              name="scrum_master"
              value={project.scrum_master}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Scrum Master</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Team Members</Form.Label>
            <Form.Control
              as="select"
              name="members"
              onChange={(e) => {
                const selectedMemberId = e.target.value;
                const selectedMember = users.find(user => user.id === parseInt(selectedMemberId, 10));
                if (selectedMember && !developers.some(dev => dev.id === selectedMember.id)) {
                  setDevelopers([...developers, selectedMember]);
                }
              }}
            >
              <option value="">Select a Team Member</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.username}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3">
          <Form.Label>Selected Team Members</Form.Label>
          <ul>
            {developers.map(dev => (
              <li key={dev.id}>
                {dev.username}{' '}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDevelopers(developers.filter(d => d.id !== dev.id))}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        </Form.Group>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Create Project'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default CreateProject;