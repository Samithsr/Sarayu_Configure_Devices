import React, { useState, useEffect } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import API_CONFIG from '../Components/Config/apiConfig';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (token && userRole && userId) {
      console.log('useEffect: Found token, role, and userId', { userRole, userId });
      if (userRole === 'admin') {
        console.log('useEffect: Navigating to /table for admin');
        navigate('/table', { replace: true });
      } else if (userRole === 'user') {
        console.log('useEffect: Fetching assigned broker for user');
        fetchAssignedBroker(userId, token).then((broker) => {
          if (broker) {
            console.log('useEffect: Navigating to /dashboard for user');
            navigate('/dashboard', { state: { brokerId: broker.brokerId, userId }, replace: true });
          } else {
            console.error('useEffect: No brokers assigned');
            toast.error('No brokers assigned. Please contact an admin.');
            localStorage.clear();
            navigate('/', { replace: true });
          }
        });
      } else {
        console.error('useEffect: Unknown user role', userRole);
        toast.error('Unknown user role.');
        localStorage.clear();
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const fetchAssignedBroker = async (userId, token) => {
    try {
      console.log('fetchAssignedBroker: Fetching for userId', userId);
      const response = await axios.get('http://3.110.131.251:5000/api/brokers/assigned', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      console.log('fetchAssignedBroker: Success', data);
      return {
        brokerId: data.brokerId,
        connectionStatus: data.connectionStatus,
      };
    } catch (err) {
      console.error('fetchAssignedBroker: Error', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Error fetching assigned broker.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    try {
      console.log('handleSubmit: Sending login request', formData.email);
      const response = await axios.post('http://3.110.131.251:5000/api/auth/signin', formData);
      const { token, user } = response.data;

      if (token && user && user._id && user.email && user.roles) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', user._id);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userRole', user.roles);

        console.log('handleSubmit: Login successful, role:', user.roles);
        toast.success('Login successful!');

        if (user.roles === 'admin') {
          console.log('handleSubmit: Navigating to /table for admin');
          navigate('/table', { replace: true });
        } else if (user.roles === 'user') {
          console.log('handleSubmit: Fetching assigned broker for user');
          const broker = await fetchAssignedBroker(user._id, token);
          if (broker) {
            console.log('handleSubmit: Navigating to /dashboard for user');
            navigate('/dashboard', { state: { brokerId: broker.brokerId, userId: user._id }, replace: true });
          } else {
            console.error('handleSubmit: No brokers assigned');
            setError('No brokers assigned. Please contact an admin.');
            toast.error('No brokers assigned. Please contact an admin.');
            localStorage.clear();
            navigate('/', { replace: true });
          }
        } else {
          console.error('handleSubmit: Unknown user role', user.roles);
          setError('Unknown user role.');
          toast.error('Unknown user role.');
          localStorage.clear();
          navigate('/', { replace: true });
        }
      } else {
        console.error('handleSubmit: Invalid server response', response.data);
        setError('Invalid response from server.');
        toast.error('Invalid response from server.');
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'An error occurred during login. Please check your credentials or try again later.';
      console.error('handleSubmit: Login error', errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="main-container">
      <div className="container">
        <div className="heading">Sign In</div>
        {error && <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
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
          <label htmlFor="password" style={{ marginTop: '15px' }}>Password</label>
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
          <span className="forgot-password">
            {/* <a href="#">Forgot Password?</a> */}
          </span>
          <input className="login-button" type="submit" value="Sign In" />
        </form>

        <div className="social-account-container">
          <span className="title">Or Sign in with</span>
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
            Don't have an account? <Link to="/signup">Register</Link>
          </p>
        </span>
      </div>
    </div>
  );
};

export default Login;