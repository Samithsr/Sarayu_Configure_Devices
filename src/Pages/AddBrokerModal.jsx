import React, { useState, useEffect } from 'react';
import '../Pages/AddBrokerModal.css';

const AddBrokerModal = ({ isOpen, onConfirm, onCancel, title = "Add Broker" }) => {
  const [formData, setFormData] = useState({
    brokerIp: '',
    portNumber: '',
    username: '',
    password: '',
    label: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      brokerIp: '',
      portNumber: '',
      username: '',
      password: '',
      label: '',
    });
    setErrors({});
  }, [isOpen]);

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
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        <h2 className="add-modal-title">{title}</h2>
        <div className="add-broker-form">
          <div className="add-form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              value={formData.brokerIp}
              onChange={handleInputChange}
              placeholder="e.g., 192.168.1.100"
            />
            {errors.brokerIp && <p className="add-error-message">{errors.brokerIp}</p>}
          </div>
          <div className="add-form-group">
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
            {errors.portNumber && <p className="add-error-message">{errors.portNumber}</p>}
          </div>
          <div className="add-form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
            />
          </div>
          <div className="add-form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>
          <div className="add-form-group">
            <label htmlFor="label">Label *:</label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleInputChange}
            />
            {errors.label && <p className="add-error-message">{errors.label}</p>}
          </div>
        </div>
        <div className="add-modal-buttons">
          <button className="add-modal-button add-cancel-button" onClick={onCancel}>
            Cancel
          </button>
          <button className="add-modal-button add-confirm-button" onClick={handleSubmit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBrokerModal;