import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button">Publish</button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Com Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>
      <div className="dashboard-main">
        <h2>Com Configuration</h2>

        {/* Row 1 */}
        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="tag1">Tagname:</label>
            <input type="text" id="tag1" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag2">Device ID</label>
            <input type="text" id="tag2" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag3">Function Code</label>
            <input type="text" id="tag3" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag4">Address</label>
            <input type="text" id="tag4" />
          </div>
        </div>

        {/* Row 2 */}
        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="tag5">Size</label>
            <input type="text" id="tag5" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag6">Data Type</label>
            <input type="text" id="tag6" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag7">Scaling</label>
            <input type="text" id="tag7" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag8">Baud Rate</label>
            <input type="text" id="tag8" />
          </div>
        </div>

        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="tag5">Data Bit</label>
            <input type="text" id="tag5" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag6">Parity</label>
            <input type="text" id="tag6" />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag7">Stop Bit</label>
            <input type="text" id="tag7" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
