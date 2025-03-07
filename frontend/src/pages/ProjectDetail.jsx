import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Alert, Spinner } from 'react-bootstrap';
import { fetchProjectById } from '../store/slices/projectSlice';

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading, error } = useSelector(state => state.projects);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!currentProject) {
    return (
      <Alert variant="info">
        Project not found. <Link to="/projects">Return to projects list</Link>
      </Alert>
    );
  }

  return (
    <div>
      <h1>Project Detail: {id}</h1>
      <p>This component needs to be implemented.</p>
    </div>
  );
};

export default ProjectDetail; 