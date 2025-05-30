import React from 'react';
import './SignupSuccess.css'; // CSS for styling

const SignupSuccess = () => {
  return (
    <div className="signup-success-container">
      <div className="signup-success-content">
        <h2 className="signup-success-title">User Registered Successfully</h2>
        <p className="signup-success-message">Wait for a minute, admin will assign the user.</p>
      </div>
    </div>
  );
};

export default SignupSuccess;