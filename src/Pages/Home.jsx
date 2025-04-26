import React, { useState } from 'react';
import './Home.css';
import { RiLogoutCircleRLine } from "react-icons/ri";
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../Pages/LogoutModel';

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setShowModal(false);
    navigate('/');
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <h1>MQTT Connection Settings</h1>
        <button className="logout-icon-button" onClick={handleLogoutClick}>
          <RiLogoutCircleRLine size={24} />
        </button>
      </nav>
      
      <div className={`home-container ${showModal ? 'blur-background' : ''}`}>
        <form className="broker-form">
          <div className="form-group">
            <label htmlFor="broker">Broker IP *:</label>
            <input type="text" id="broker" name="broker" placeholder="Enter broker IP" />
          </div>
          <div className="form-group">
            <label htmlFor="port">Port *:</label>
            <input type="number" id="port" name="port" placeholder="Enter port number" />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" placeholder="Enter username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="Enter password" />
          </div>
          <div className="form-group">
            <label htmlFor="label">Label *:</label>
            <input type="text" id="label" name="label" placeholder="Enter Label" />
          </div>
          <button type="submit">Connect</button>
        </form>
      </div>

      <LogoutModal 
        isOpen={showModal}
        onConfirm={handleLogout}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Home;