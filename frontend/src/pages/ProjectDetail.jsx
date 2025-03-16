import React, { useEffect, useState } from "react"; 
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Alert, Spinner, Card, ListGroup, Button } from "react-bootstrap";
import { fetchProjectById } from "../store/slices/projectSlice";
import axios from "axios";

const ProjectDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { currentProject, loading, error } = useSelector(state => state.projects);

  const [sprints, setSprints] = useState([]);
  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    velocity: 0,
  });
  const [errorSprint, setErrorSprint] = useState(null);
  const [loadingSprint, setLoadingSprint] = useState(false);

  useEffect(() => {
    dispatch(fetchProjectById(id));
  }, [dispatch, id]);

  useEffect(() => {
    const fetchSprints = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/projects/${id}/sprints/`);
        setSprints(response.data);
      } catch (err) {
        console.error("Error fetching sprints:", err);
      }
    };
    fetchSprints();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingSprint(true);
    setErrorSprint(null);

    // Validate form data before submitting
    const { start_date, end_date, velocity } = formData;
    const today = new Date().toISOString().split("T")[0];
    if (end_date < start_date) {
      setErrorSprint("End date cannot be before start date.");
      setLoadingSprint(false);
      return;
    }
    if (start_date < today) {
      setErrorSprint("Start date cannot be in the past.");
      setLoadingSprint(false);
      return;
    }
    if (velocity <= 0) {
      setErrorSprint("Velocity must be a positive number.");
      setLoadingSprint(false);
      return;
    }
    // Check for overlapping sprints
    const overlappingSprint = sprints.some(sprint => (
      (start_date >= sprint.start_date && start_date <= sprint.end_date) ||
      (end_date >= sprint.start_date && end_date <= sprint.end_date)
    ));
    if (overlappingSprint) {
      setErrorSprint("The sprint dates overlap with an existing sprint.");
      setLoadingSprint(false);
      return;
    }

    try {
      const response = await axios.post(`http://localhost:8000/api/projects/${id}/sprints/`, formData, {
        headers: { "Content-Type": "application/json" },
      });

      setSprints([...sprints, response.data]);
      setFormData({ start_date: "", end_date: "", velocity: 0 });
    } catch (err) {
      if (err.response) {
        // Server responded with a status other than 200 range
        setErrorSprint(`Error: ${err.response.status} - ${err.response.data}`);
      } else if (err.request) {
        // Request was made but no response received
        setErrorSprint("Error: No response from server. Please try again later.");
      } else {
        // Something else happened while setting up the request
        setErrorSprint(`Error: ${err.message}`);
      }
    } finally {
      setLoadingSprint(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
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
      <h1>Project Detail: {currentProject.name}</h1>
      <p>{currentProject.description}</p>
      <div className="mt-3">
        <strong>Created:</strong> {new Date(currentProject.created_at).toLocaleDateString()}
      </div>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Team Members</Card.Title>
          {currentProject.members && currentProject.members.length > 0 ? (
            <ListGroup>
              {currentProject.members.map(member => (
                <ListGroup.Item key={member.id}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{member.user.username}</strong> ({member.role})
                    </div>
                    <div>{member.user.email}</div>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No team members assigned to this project.</p>
          )}
          <Button variant="outline-primary" className="mt-3" as={Link} to={`/projects/${id}/members`}>
            Manage Team Members
          </Button>
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Create a New Sprint</Card.Title>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Start Date:</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">End Date:</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Velocity:</label>
              <input type="number" name="velocity" value={formData.velocity} onChange={handleChange} className="form-control" required />
            </div>
            <Button type="submit" variant="primary" disabled={loadingSprint}>
              {loadingSprint ? "Creating..." : "Create Sprint"}
            </Button>
          </form>
          {errorSprint && <Alert variant="danger" className="mt-3">{errorSprint.replace(/['"]+/g, '')}</Alert>}
        </Card.Body>
      </Card>

      <Card className="mt-4">
        <Card.Body>
          <Card.Title>Existing Sprints</Card.Title>
          {sprints.length > 0 ? (
            <ListGroup>
              {sprints.map((sprint) => (
                <ListGroup.Item key={sprint.id}>
                  Sprint from {formatDate(sprint.start_date)} to {formatDate(sprint.end_date)} (Velocity: {sprint.velocity})
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>No sprints available.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default ProjectDetail;
