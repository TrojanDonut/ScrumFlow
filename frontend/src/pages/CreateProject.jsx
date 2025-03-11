import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { createProject, clearProjectError } from '../store/slices/projectSlice';
import { useNavigate } from 'react-router-dom';

const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(state => state.projects);
  const [project, setProject] = useState({
    name: '',
    description: ''
  });

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
    if (createProject.fulfilled.match(result)) {
      navigate('/projects');
    }
  };

  return (
    <div className="d-flex justify-content-center mt-5">
      <div style={{ width: '600px' }}>
        <h1>Create Project</h1>
        {error && (
          <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
            {error}
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
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? <Spinner animation="border" size="sm" /> : 'Create Project'}
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default CreateProject;