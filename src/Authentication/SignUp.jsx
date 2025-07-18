import React, { useState, useEffect } from 'react';
import './Login.css'; // Assuming the same styling as Login is used
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_CONFIG from '../Components/Config/apiConfig';

const SignUp = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isSignupSuccess, setIsSignupSuccess] = useState(false); // State to track signup success
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // If already authenticated, redirect to a protected route (e.g., /table)
      navigate('/table');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.email) {
      setError('Email is required.');
      toast.error('Email is required.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      toast.error('Password is required.');
      return;
    }
    if (!formData.confirmPassword) {
      setError('Confirm password is required.');
      toast.error('Confirm password is required.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    try {
      const response = await axios.post('http://3.110.131.251:5000/api/auth/signup', {
        email: formData.email,
        password: formData.password,
      });

      const { token, user } = response.data;

      if (token && user && user._id && user.email && user.roles) {
        // Store user data in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user._id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.roles);

        toast.success('Signup successful!');
        setIsSignupSuccess(true); // Show confirmation popup
      } else {
        setError('Invalid response from server.');
        toast.error('Invalid response from server.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'An error occurred during signup. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleConfirmationOk = () => {
    setIsSignupSuccess(false); // Hide confirmation popup
    navigate('/table'); // Navigate to a protected route after confirmation
  };

  return (
    <div className="main-container">
      <div className={`container ${isSignupSuccess ? 'blurred' : ''}`}>
        <div className="heading">Sign Up</div>
        {error && (
          <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>
            {error}
          </p>
        )}
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            required
            className="input"
            type="email"
            name="email"
            id="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
          />
          <label htmlFor="password">Password</label>
          <input
            required
            className="input"
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            required
            className="input"
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
          />
          <input className="login-button" type="submit" value="Sign Up" />
        </form>

        <div className="social-account-container">
          <span className="title">Or Sign up with</span>
          <div className="social-accounts">
            <button className="social-button google">
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"></svg>
            </button>
            <button className="social-button apple">
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"></svg>
            </button>
            <button className="social-button twitter">
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"></svg>
            </button>
          </div>
        </div>

        <span className="agreement">
          <p>
            Already have an account? <Link to="/">Login</Link>
          </p>
        </span>
      </div>

      {isSignupSuccess && (
        <div className="signup-confirmation-overlay">
          <div className="signup-confirmation-content">
            <h2 className="signup-confirmation-title">User Registered Successfully</h2>
            <p className="signup-confirmation-message">
              Wait for a minute, admin will assign the user.
            </p>
            <button className="signup-confirmation-button" onClick={handleConfirmationOk}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignUp;