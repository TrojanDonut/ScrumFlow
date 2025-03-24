import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Button, Spinner, Alert, Card, ListGroup, Modal } from 'react-bootstrap';
import { fetchProjectById, updateProject, fetchAllUsers, clearProjectError, removeMemberFromProject, addMemberToProject } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';
import AssignedUsersList from '../pages/AssignedUsersList';

const EditProject = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading, error, members } = useSelector(state => state.projects);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchAllUsers());
    if (currentProject) {
      setFormData({ name: currentProject.name, description: currentProject.description });
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setFormData({ name: currentProject.name, description: currentProject.description });
    }
  }, [currentProject]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProject({ id, projectData: formData }));
    navigate(`/projects/${id}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser('');
    setRole('DEVELOPER');
  };

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
  <div>
    <h1>Edit Project</h1>
    <Form onSubmit={handleSubmit}>
      <Form.Group controlId="formProjectName" className="mb-4">
        <Form.Label>Project Name</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </Form.Group>
      <Form.Group controlId="formProjectDescription" className="mb-4">
        <Form.Label>Project Description</Form.Label>
        <Form.Control
          as="textarea"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </Form.Group>

      {error && (
        <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
          {formatErrorMessage(error)}
        </Alert>
      )}
      <AssignedUsersList projectId={id} />
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
    </Form>
    </div>
  );
};

export default EditProject;