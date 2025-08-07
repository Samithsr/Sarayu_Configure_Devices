import React, { useEffect, useState } from 'react';
import { RiLogoutCircleRLine } from 'react-icons/ri';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import LogoutModal from '../Pages/LogoutModel'; // adjust path if needed
import { Navbar as BootstrapNavbar, Button } from 'react-bootstrap';
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

  const handleLogoutClick = () => {
    setShowModal(true);
  };

  const handleLogout = async () => {
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');

    if (userRole === 'admin' && authToken) {
      try {
        const response = await fetch('http://13.201.135.43:5000/api/brokers/disconnect-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorMessage = await response.json().then((data) => data.message || 'Failed to disconnect all brokers');
          toast.error(errorMessage);
          console.error('Error disconnecting all brokers:', errorMessage);
        } else {
          toast.success('All brokers disconnected successfully!');
        }
      } catch (err) {
        console.error('Error during logout disconnection:', err);
        toast.error('An error occurred while disconnecting brokers.');
      }
    }

    // Clear local storage and navigate to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
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
      <BootstrapNavbar className="navbar">
        <h1 className="navbar-title">Broker Connection Settings</h1>
        <button className="logout-icon-button" onClick={handleLogoutClick}>
          <RiLogoutCircleRLine size={24} />
        </button>
      </BootstrapNavbar>

      <LogoutModal
        isOpen={showModal}
        onConfirm={handleLogout}
        onCancel={handleCancel}
      />
    </>
  );
};

export default Navbar;