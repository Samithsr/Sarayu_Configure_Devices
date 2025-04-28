import React, { useState } from 'react';
import './Home.css';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../Pages/LogoutModel';

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    brokerIp: '',
    portNumber: '',
    username: '',
    password: '',
    label: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Check for auth token
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setError('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    // Prepare payload, converting portNumber to integer
    const payload = {
      ...formData,
      portNumber: formData.portNumber ? parseInt(formData.portNumber, 10) : undefined,
    };

    try {
      const response = await fetch('http://ec2-43-204-109-20.ap-south-1.compute.amazonaws.com:5000/api/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess('Successfully connected to the broker!');
      // Reset form
      setFormData({
        brokerIp: '',
        portNumber: '',
        username: '',
        password: '',
        label: '',
      });
    } catch (err) {
      console.error('Error connecting to broker:', err);
      setError(err.message || 'An error occurred while connecting to the broker.');
    }
  };

  // Handle logout click
  const handleLogoutClick = () => {
    setShowModal(true);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setShowModal(false);
    navigate('/');
  };

  // Handle modal cancel
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
        <div className="broker-form">
          <div className="form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              placeholder="Enter broker IP"
              value={formData.brokerIp}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="portNumber">Port *:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              placeholder="Enter port number"
              value={formData.portNumber}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="label">Label *:</label>
            <input
              type="text"
              id="label"
              name="label"
              placeholder="Enter Label"
              value={formData.label}
              onChange={handleInputChange}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          <button type="button" onClick={handleSubmit}>
            Connect
          </button>
        </div>
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