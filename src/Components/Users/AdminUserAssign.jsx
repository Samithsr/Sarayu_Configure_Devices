import React, { useState, useEffect } from 'react';
import { FaUserPlus } from 'react-icons/fa';
import './AdminUserAssign.css';

const AdminUserAssign = ({
  brokerId,
  assignedUserId,
  assignedUserEmail,
  users,
  handleAssignUser,
  onConfirmationStateChange,
}) => {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Initialize selectedUserId with assignedUserId
  useEffect(() => {
    setSelectedUserId(assignedUserId || '');
  }, [assignedUserId]);

  // Notify parent about modal state changes
  useEffect(() => {
    onConfirmationStateChange(brokerId, showModal);
  }, [showModal, brokerId, onConfirmationStateChange]);

  const handleUserSelect = (e) => {
    const userId = e.target.value || null; // Use null for unassigning
    console.log(`[AdminUserAssign] Selected userId: ${userId} for broker ${brokerId}`);

    if (userId === assignedUserId) {
      console.log(`[AdminUserAssign] No change in user selection for broker ${brokerId}`);
      setShowModal(false);
      setSelectedUserId(userId);
      return;
    }

    setSelectedUserId(userId);
    setShowModal(true);
  };

  const handleModalConfirm = () => {
    console.log(`[AdminUserAssign] Confirming assignment: userId=${selectedUserId} to broker ${brokerId}`);
    handleAssignUser(brokerId, selectedUserId);
    setShowModal(false);
  };

  const handleModalCancel = () => {
    console.log(`[AdminUserAssign] Canceling assignment for broker ${brokerId}`);
    setShowModal(false);
    setSelectedUserId(assignedUserId || '');
  };

  return (
    <div className="users-container">
      <select
        className="user-assign-select"
        value={selectedUserId || ''} // Use selectedUserId for controlled component
        onChange={handleUserSelect}
        aria-label="Assign a user to broker"
        disabled={users.length === 0}
      >
        <option value="">Unassigned</option> {/* Allow unassigning */}
        {users.map((user) => (
          <option key={user._id} value={user._id}>
            {user.email}
          </option>
        ))}
      </select>

      {showModal && (
        <div className="user-assign-modal-overlay">
          <div className="user-assign-modal-content">
            <div className="user-assign-modal-title-container">
              <FaUserPlus className="user-assign-modal-icon" />
              <h2 className="user-assign-modal-title">Assign User to Broker</h2>
            </div>
            <p className="user-assign-modal-text">
              {selectedUserId
                ? `Are you sure you want to assign ${
                    users.find((user) => user._id === selectedUserId)?.email || 'Unknown User'
                  } to this broker?`
                : 'Are you sure you want to unassign the current user from this broker?'}
            </p>
            <div className="user-assign-modal-buttons">
              <button
                className="user-assign-modal-button user-assign-modal-confirm"
                onClick={handleModalConfirm}
              >
                Confirm
              </button>
              <button
                className="user-assign-modal-button user-assign-modal-cancel"
                onClick={handleModalCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserAssign;