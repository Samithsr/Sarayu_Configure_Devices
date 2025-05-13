import React, { useState, useEffect } from 'react';
import "../Pages/Home.css";

const EditModal = ({ isOpen, onConfirm, onCancel, broker }) => {
  const [formData, setFormData] = useState({
    brokerIp: '',
    portNumber: '',
    username: '',
    password: '',
    label: '',
  });
  const [errors, setErrors] = useState({});

  // Update formData when broker prop changes
  useEffect(() => {
    if (broker) {
      setFormData({
        brokerIp: broker.brokerip || '',
        portNumber: broker.port || '',
        username: broker.user || '',
        password: broker.rawPassword || '',
        label: broker.label || '',
      });
      setErrors({}); // Clear errors when modal opens with new broker
    }
  }, [broker]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.brokerIp) {
      newErrors.brokerIp = 'Broker IP is required.';
    } else if (!/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(formData.brokerIp)) {
      newErrors.brokerIp = 'Invalid IP address format.';
    }
    if (!formData.portNumber) {
      newErrors.portNumber = 'Port is required.';
    } else if (isNaN(formData.portNumber) || formData.portNumber < 1 || formData.portNumber > 65535) {
      newErrors.portNumber = 'Port must be between 1 and 65535.';
    }
    if (!formData.label) {
      newErrors.label = 'Label is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Edit Broker</h2>
        <div className="broker-form">
          <div className="form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              value={formData.brokerIp}
              onChange={handleInputChange}
              placeholder="e.g., 192.168.1.100"
            />
            {errors.brokerIp && <p className="error-message">{errors.brokerIp}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="portNumber">Port *:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              value={formData.portNumber}
              onChange={handleInputChange}
              min="1"
              max="65535"
            />
            {errors.portNumber && <p className="error-message">{errors.portNumber}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
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
              value={formData.label}
              onChange={handleInputChange}
            />
            {errors.label && <p className="error-message">{errors.label}</p>}
          </div>
        </div>
        <div className="modal-buttons">
          <button className="modal-button cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="modal-button confirm-button" onClick={handleSubmit}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;