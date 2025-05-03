// Pages/Login.js
import React, { useEffect, useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';

import axios from 'axios';

const Login = () => {
  
const [formData, setFormData] = useState({
  email: '',
  password: '',
});


const [error, setError] = useState('');
const navigate = useNavigate(' '); // Initialize useNavigate


useEffect(() => {
  const token = localStorage.getItem('authToken');
  if (token) {
    navigate ('/Home');
  }
}, [navigate]);


const handleChange = (e) => {
  setFormData({
    ...formData, [e.target.name]: e.target.value
  });
};



const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await axios.post("http://localhost:5000/api/auth/signin", formData);
    console.log("response", response.data);

    if (response.data.token || response.data.user){
      localStorage.setItem('authToken', response.data.token || JSON.stringify(Response.data.user));


      // set a timer to clear token
      navigate('/Home');
    }
  } catch (error) {
    console.log("error sending data", error);
  }
};


  return (
    <div className="main-container">
      <div className="container">
        <div className="heading">Sign In</div>
        <form className="form" onSubmit={handleSubmit}>
          <label htmlFor="">Email</label>
          <input required className="input" type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} />
          <input required className="input" type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
          <span className="forgot-password">
            {/* <a href="#">Forgot Password?</a> */}
          </span>
          <input className="login-button" type="submit" value="Sign In" />
        </form>

        <div className="social-account-container">
          <span className="title">Or Sign in with</span>
          <div className="social-accounts">
            <button className="social-button google">
              {/* Google SVG */}
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path d="M488 261.8C488 403.3..."></path>
              </svg>
            </button>
            <button className="social-button apple">
              {/* Apple SVG */}
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                <path d="M318.7 268.7c-.2-36.7..."></path>
              </svg>
            </button>
            <button className="social-button twitter">
              {/* Twitter SVG */}
              <svg className="svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                <path d="M389.2 48h70.6..."></path>
              </svg>
            </button>
          </div>
        </div>

        <span className="agreement">
          <p>Don't have an account? <Link to="/signup">Register</Link></p>
        </span>
      </div>
    </div>
  );
};

export default Login;
