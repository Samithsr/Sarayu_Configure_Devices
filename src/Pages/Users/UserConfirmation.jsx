import React from 'react';
import { FaUserPlus } from 'react-icons/fa';
import './UserConfirmation.css';

const UserConfirmation = ({ isOpen, onConfirm, onCancel, users, selectedUserId }) => {
  if (!isOpen) return null;

  const handleUserSelect = (e) => {
    const userId = e.target.value;
    onConfirm(userId);
  };

  return (
    <div className="user-confirmation-overlay">
      <div className="user-confirmation-content">
        <div className="user-confirmation-title-container">
          <FaUserPlus className="user-confirmation-icon" />
          <h2 className="user-confirmation-title">Assign User to Broker</h2>
        </div>
        <p className="user-confirmation-text">Select a user to assign to this broker.</p>
        <select
          className="user-confirmation-select"
          value={selectedUserId || ''}
          onChange={handleUserSelect}
        >
          <option value="">Select a user</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.email}
            </option>
          ))}
        </select>
        <div className="user-confirmation-buttons">
          <button className="user-confirmation-button user-confirmation-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConfirmation;