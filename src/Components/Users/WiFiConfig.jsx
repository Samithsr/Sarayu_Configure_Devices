import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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

  const { brokerId, userId, userRole, setError } = useOutletContext();
  const navigate = useNavigate();

  // Fetch the latest WiFi configuration on mount
  useEffect(() => {
    const fetchLatestConfig = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('http://13.202.129.139:5000/api/published-data/latest', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const wifiConfig = data.find((item) => item.label === 'WiFi Configuration');
          if (wifiConfig) {
            const payload = JSON.parse(wifiConfig.message);
            setFormData({
              ssid: payload.ssid || '',
              password: payload.password || '',
              topic: wifiConfig.topic || '',
            });
            setFocusedFields({
              ssid: !!payload.ssid,
              password: !!payload.password,
              topic: !!wifiConfig.topic,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching latest WiFi configuration:', error.message);
      }
    };

    fetchLatestConfig();
  }, []);

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

    if (!formData.ssid || !formData.password) {
      setError('Please fill in all fields before publishing.');
      return;
    }

    const payload = {
      ssid: formData.ssid,
      password: formData.password,
    };

    try {
      const response = await fetch(`http://13.202.129.139:5000/api/brokers/${brokerId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: formData.topic.trim(),
          message: JSON.stringify(payload),
          label: 'WiFi Configuration',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to publish WiFi configuration.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`WiFi Configuration Published: SSID - ${formData.ssid}, Topic - ${formData.topic}`);
      setFormData({
        ssid: '',
        password: '',
        topic: '',
      });
      setFocusedFields({
        ssid: false,
        password: false,
        topic: false,
      });
    } catch (error) {
      console.error('Error publishing WiFi configuration:', error.message);
      setError(error.message || 'An error occurred while publishing WiFi configuration.');
      toast.error(error.message || 'Failed to publish WiFi configuration.');
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
          <button className="submit-btn" type="submit" disabled={userRole === 'admin'}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default WiFiConfig;