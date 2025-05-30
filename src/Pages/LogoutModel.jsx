import React from 'react';
import './Home.css';

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Logout</h2>
        <p className="modal-text">Are you sure you want to log out?</p>
        <div className="modal-buttons">
          <button
            className="modal-button cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="modal-button confirm-button"
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;