import React, { useState } from 'react';
import './WiFiConfig.css';

const WiFiConfig = () => {
  const [formData, setFormData] = useState({
    ssid: '',
    password: '',
    topic: '', // Added topic to formData
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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('WiFi Configuration Submitted:', formData);
    alert('WiFi Configuration Saved: SSID - ' + formData.ssid + ', Topic - ' + formData.topic);
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
              type="text" // Changed to text since "Topic" is not a password
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