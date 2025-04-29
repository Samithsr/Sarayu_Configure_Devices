import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <button className="dashboard-button">Publish</button>
      <button className="dashboard-button">Subscribe</button>
      <button className="dashboard-button">Com Configuration</button>
      <button className="dashboard-button">Wi-Fi</button>
    </div>
  );
};

export default Dashboard;
