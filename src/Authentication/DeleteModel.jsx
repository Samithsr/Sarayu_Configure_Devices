// src/Pages/DeleteModal.jsx
import React from 'react';
// import './Home.css';

const DeleteModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Confirm Deletion</h2>
        <p className="modal-text">Are you sure you want to delete this broker?</p>
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;