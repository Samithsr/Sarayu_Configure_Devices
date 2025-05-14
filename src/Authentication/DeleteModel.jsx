import React from 'react';
import '../Pages/DeleteModal.css';

const DeleteModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-modal-overlay">
      <div className="delete-modal-container">
        <h2 className="delete-modal-title">Confirm Deletion</h2>
        <p className="delete-modal-message">
          Are you sure you want to delete this broker?
        </p>
        <div className="delete-modal-actions">
          <button className="delete-modal-btn cancel-btn"  onClick={onCancel}>
            Cancel
          </button>
          <button className="delete-modal-btn confirm-btn" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
