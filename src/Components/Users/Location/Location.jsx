import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Location.css';
import API_CONFIG from '../../Config/apiConfig';

const Location = () => {
  const [formData, setFormData] = useState({
    locationName: '',
    topic: '',
  });

  const { brokerId, userId, userRole, setError } = useOutletContext();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const authToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');

    if (!authToken || !storedUserId) {
      setError('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    if (userRole === 'admin') {
      setError('Admins are not allowed to publish.');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Please enter a topic name before publishing.');
      return;
    }

    if (!formData.locationName) {
      setError('Please fill in the location name before publishing.');
      return;
    }

    const payload = {
      locationName: formData.locationName,
    };

    try {
      const response = await fetch(`http://3.110.131.251:5000/api/brokers/${brokerId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: formData.topic.trim(),
          message: JSON.stringify(payload),
          label: 'Location Configuration',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || `Failed to publish location (HTTP ${response.status})`;
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Location Configuration Published: Location - ${formData.locationName}, Topic - ${formData.topic}`);
      setFormData({
        locationName: '',
        topic: '',
      });
    } catch (error) {
      console.error('Error publishing location configuration:', error.message);
      setError(error.message || 'An error occurred while publishing location.');
      toast.error(error.message || 'Failed to publish location configuration.');
    }
  };

  return (
    <div className="loc-config-wrapper">
      <div className="loc-config-panel">
        <h2 className="loc-config-heading">Location Configuration</h2>
        <form className="loc-config-form" onSubmit={handleSubmit}>
          <div className="input-section">
            <label htmlFor="locationName" className="input-label">
              Location Name
            </label>
            <input
              required
              className="input-field"
              type="text"
              name="locationName"
              id="locationName"
              placeholder="Enter Location Name"
              value={formData.locationName}
              onChange={handleChange}
            />
          </div>
          <div className="input-section">
            <label htmlFor="topic" className="input-label">
              Topic
            </label>
            <input
              required
              className="input-field"
              type="text"
              name="topic"
              id="topic"
              placeholder="Enter Topic"
              value={formData.topic}
              onChange={handleChange}
            />
          </div>
          <button className="submit-btn" type="submit" disabled={userRole === 'admin'}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Location;