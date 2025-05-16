

import React from "react";
import "./DisconnectModel.css";

const DisconnectModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="disconnect-modal-overlay">
      <div className="disconnect-modal-content">
        <h2>Confirm Disconnection</h2>
        <p>Are you sure you want to disconnect this IP?</p>
        <div className="disconnect-modal-buttons">
          <button className="disconnect-modal-button disconnect-modal-disconnect" onClick={onConfirm}>
            Disconnect
          </button>
          <button className="disconnect-modal-button disconnect-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisconnectModal;