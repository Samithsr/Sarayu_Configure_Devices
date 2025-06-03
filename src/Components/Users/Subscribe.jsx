import React from 'react';
import { useOutletContext } from 'react-router-dom';
// import "../../Pages/Dashboard.css";
// import './Dashboard.css';
// import Dashboard from './../../Pages/Dashboard';

const Subscribe = () => {
  const { brokerId, userId, userRole } = useOutletContext();

  return (
    <div className="dashboard-main window-effect">
      <h3>Subscribe Section</h3>
      <p>Broker ID: {brokerId}</p>
      <p>User ID: {userId}</p>
      <p>User Role: {userRole}</p>
      <p>This is a placeholder for the Subscribe functionality.</p>
    </div>
  );
};

export default Subscribe;