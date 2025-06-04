import React, { useState } from 'react';
import './WiFiConfig.css';

const WiFiConfig = () => {
  const [formData, setFormData] = useState({
    ssid: '',
    password: '',
    topic: '',
  });

  const [focusedFields, setFocusedFields] = useState({
    ssid: false,
    password: false,
    topic: false,
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFocus = (field) => {
    setFocusedFields({
      ...focusedFields,
      [field]: true,
    });
  };

  const handleBlur = (field) => {
    setFocusedFields({
      ...focusedFields,
      [field]: formData[field] !== '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = `${formData.ssid}.${formData.password}`; // Format payload as ssid.password
    const requestData = {
      topic: formData.topic,
      payload,
      qosLevel: '1', // Default QoS 1
    };

    console.log('Sending WiFi Config:', requestData); // Log request data

    try {
      const response = await fetch('http://localhost:5000/api/wifi/user/pub/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log('WiFi Publish Response:', result); // Log response

      if (!response.ok) {
        throw new Error(result.error || 'Failed to publish WiFi configuration');
      }

      alert(`WiFi Configuration Published: SSID - ${formData.ssid}, Topic - ${formData.topic}, Payload - ${payload}`);
    } catch (error) {
      console.error('Error publishing WiFi configuration:', error.message);
      alert('Failed to publish WiFi configuration: ' + error.message);
    }
  };

  return (
    <div className="wifi-config-container">
      <div className="wifi-config-content">
        <h2 className="wifi-config-title">WiFi Configuration</h2>
        <form className="wifi-config-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ssid" className={`form-label ${focusedFields.ssid || formData.ssid ? 'floating' : ''}`}>
              WiFi SSID
            </label>
            <input
              required
              className="form-input"
              type="text"
              name="ssid"
              id="ssid"
              placeholder="Enter WiFi SSID"
              value={formData.ssid}
              onChange={handleChange}
              onFocus={() => handleFocus('ssid')}
              onBlur={() => handleBlur('ssid')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password" className={`form-label ${focusedFields.password || formData.password ? 'floating' : ''}`}>
              Password
            </label>
            <input
              required
              className="form-input"
              type="password"
              name="password"
              id="password"
              placeholder="Enter WiFi Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => handleFocus('password')}
              onBlur={() => handleBlur('password')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="topic" className={`form-label ${focusedFields.topic || formData.topic ? 'floating' : ''}`}>
              Topic
            </label>
            <input
              required
              className="form-input"
              type="text"
              name="topic"
              id="topic"
              placeholder="Enter Topic"
              value={formData.topic}
              onChange={handleChange}
              onFocus={() => handleFocus('topic')}
              onBlur={() => handleBlur('topic')}
            />
          </div>
          <button className="form-submit-button" type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default WiFiConfig;