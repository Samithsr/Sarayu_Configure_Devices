// src/components/UsersContainer.js
import React from 'react';
import { FaUserPlus } from 'react-icons/fa';
import '../Users/UserAssign.css';

const UsersAssign = ({ brokerId, assignedUserId, assignedUserEmail, handleAssignClick }) => {
  return (
    <div className="users-container">
      <div className="assign-button-container" style={{ paddingLeft: '40px' }}>
        <button
          className="assign-button"
          onClick={() => handleAssignClick(brokerId, assignedUserId)}
          title="Assign User"
        >
          <FaUserPlus />
        </button>
      </div>
      <div className="email-container">
        <span className={`assigned-user-email ${assignedUserEmail ? 'assigned' : ''}`}>
          {assignedUserEmail ? assignedUserEmail : 'No User Assigned'}
        </span>
      </div>
    </div>
  );
};

export default UsersAssign;