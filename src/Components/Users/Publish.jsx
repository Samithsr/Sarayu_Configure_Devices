import React from 'react';
import { useOutletContext } from 'react-router-dom';
// import "../../Pages/Dashboard.css";
// import './Dashboard.css';

const Publish = () => {
  const { brokerId, userId, userRole } = useOutletContext();

  return (
    <div className="dashboard-main window-effect">
      <h3>Publish Section</h3>
      <p>Broker ID: {brokerId}</p>
      <p>User ID: {userId}</p>
      <p>User Role: {userRole}</p>
      <p>This is a placeholder for the Publish functionality.</p>
    </div>
  );
};

export default Publish;