import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { fetchProjectById, updateProject, fetchAllUsers, clearProjectError } from '../store/slices/projectSlice';
import { formatErrorMessage } from '../utils/errorUtils';
import AssignedUsersList from '../pages/AssignedUsersList';

const EditProject = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading, error, members } = useSelector(state => state.projects);
  const { users } = useSelector(state => state.users);
  const [formData, setFormData] = useState({ name: '', description: '', productOwner: '', scrumMaster: '' });
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchAllUsers());
  }, [dispatch, id]);

  useEffect(() => {
    if (currentProject) {
      setFormData({
        name: currentProject.name,
        description: currentProject.description,
        product_owner: currentProject.product_owner || '',
        scrum_master: currentProject.scrum_master || '',
      });
    }
  }, [currentProject]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateProject({ id, projectData: formData }));
    if (updateProject.fulfilled.match(result)) {
      navigate(`/projects/${id}`);
    }
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
        {error && (
          <Alert variant="danger" onClose={() => dispatch(clearProjectError())} dismissible>
            {formatErrorMessage(error)}
          </Alert>
        )}
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

        <Form.Group controlId="formProductOwner" className="mb-4">
          <Form.Label>Product Owner</Form.Label>
          <Form.Control
            as="select"
            name="product_owner"
            value={formData.product_owner}
            onChange={handleChange}
            required
          >
            <option value="">Select Product Owner</option>
            {members.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <Form.Group controlId="formScrumMaster" className="mb-4">
          <Form.Label>Scrum Master</Form.Label>
          <Form.Control
            as="select"
            name="scrum_master"
            value={formData.scrum_master}
            onChange={handleChange}
            required
          >
            <option value="">Select Scrum Master</option>
            {members.map(user => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </Form.Control>
        </Form.Group>

        <AssignedUsersList projectId={id} />
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </Form>
    </div>
  );
};

export default EditProject;