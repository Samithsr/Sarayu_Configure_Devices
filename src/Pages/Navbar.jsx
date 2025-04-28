// src/components/Navbar.js
import React, { useEffect, useState } from 'react';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutModal from '../Pages/LogoutModel'; // adjust path if needed
import './Navbar.css';

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token); // true if token exists, else false
  }, [location]); 
  // Re-check token whenever the route (page) changes

  const handleLogoutClick = () => {
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setShowModal(false);
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  // Don't show Navbar on login page
  if (location.pathname === '/') {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <nav className="navbar">
        <h1>MQTT Connection Settings</h1>
        <button className="logout-icon-button" onClick={handleLogoutClick}>
          <RiLogoutCircleRLine size={24} />
        </button>
      </nav>

      <LogoutModal
        isOpen={showModal}
        onConfirm={handleLogout}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Navbar;
