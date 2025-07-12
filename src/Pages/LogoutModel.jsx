import React from 'react';
import '../Pages/LogoutModel.css'

const LogoutModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay">
      <div className="logout-modal-content">
        <h2 className="logout-modal-title">Confirm Logout</h2>
        <p className="logout-modal-text">Are you sure you want to log out?</p>
        <div className="logout-modal-buttons">
          <button
            className="logout-modal-button logout-modal-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="logout-modal-button logout-modal-confirm"
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