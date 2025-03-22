import React from 'react';
import { useParams } from 'react-router-dom';

const UserStories = () => {
  const { projectId, sprintId } = useParams();

  return (
    <div>
      <h1>User Stories for Sprint {sprintId}</h1>
      <p>Project ID: {projectId}</p>
      {/* Add functionality for managing user stories here */}
    </div>
  );
};

export default UserStories;
