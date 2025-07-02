import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Location.css';

const Location = () => {
  const [formData, setFormData] = useState({
    locationName: '',
    topic: '',
  });

  const { setError } = useOutletContext();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = formData.locationName; // Use locationName as payload, similar to ssid.password in WiFiConfig
    const requestData = {
      topic: formData.topic,
      payload,
      qosLevel: '1', // Match WiFiConfig's default QoS
    };

    try {
      const response = await fetch('http://localhost:5000/api/wifi/user/pub/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to publish location (HTTP ${response.status})`);
      }

      // alert(`Location configuration published: Location - ${formData.locationName}, Topic - ${formData.topic}`);
      setFormData({
        locationName: '',
        topic: '',
      });
    } catch (err) {
      setError(err.message || 'An error occurred while publishing location.');
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
          <button className="submit-btn" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Location;