import React, { useState, useEffect } from 'react';
import './EditModal.css';

const EditModal = ({ isOpen, onConfirm, onCancel, broker, title = "Edit Broker" }) => {
  const [formData, setFormData] = useState({
    brokerIp: '',
    portNumber: '',
    username: '',
    password: '',
    label: '',
    topic: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (broker) {
      setFormData({
        brokerIp: broker.brokerip || '',
        portNumber: broker.port || '',
        username: broker.user || '',
        password: broker.rawPassword || '',
        label: broker.label || '',
        topic: broker.topic || '',
      });
    } else {
      setFormData({
        brokerIp: '',
        portNumber: '',
        username: '',
        password: '',
        label: '',
        topic: '',
      });
    }
    setErrors({});
  }, [broker, isOpen]);

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
    if (!formData.topic) {
      newErrors.topic = 'Topic Name is required.';
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
    <div className="edit-modal-overlay">
      <div className="edit-modal-content">
        <h2 className="edit-modal-title">{title}</h2>
        <div className="edit-modal-form">
          <div className="edit-modal-form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              value={formData.brokerIp}
              onChange={handleInputChange}
              placeholder="e.g., 192.168.1.100"
              className="edit-modal-input"
            />
            {errors.brokerIp && <p className="edit-modal-error">{errors.brokerIp}</p>}
          </div>
          <div className="edit-modal-form-group">
            <label htmlFor="portNumber">Port *:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              value={formData.portNumber}
              onChange={handleInputChange}
              min="1"
              max="65535"
              className="edit-modal-input"
            />
            {errors.portNumber && <p className="edit-modal-error">{errors.portNumber}</p>}
          </div>
          <div className="edit-modal-form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="edit-modal-input"
            />
          </div>
          <div className="edit-modal-form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="edit-modal-input"
            />
          </div>
          <div className="edit-modal-form-group">
            <label htmlFor="label">Label *:</label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleInputChange}
              className="edit-modal-input"
            />
            {errors.label && <p className="edit-modal-error">{errors.label}</p>}
          </div>
          <div className="edit-modal-form-group">
            <label htmlFor="topic">Topic Name *:</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              className="edit-modal-input"
            />
            {errors.topic && <p className="edit-modal-error">{errors.topic}</p>}
          </div>
        </div>
        <div className="edit-modal-buttons">
          <button className="edit-modal-button edit-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="edit-modal-button edit-modal-confirm"
            onClick={handleSubmit}
          >
            {title === "Add Broker" ? "Add" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;