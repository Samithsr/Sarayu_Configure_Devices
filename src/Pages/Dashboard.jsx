import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DisconnectModal from '../Components/DisconnectModel';
import API_CONFIG from '../Components/Config/apiConfig';

const Dashboard = () => {
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerId: initialBrokerId, userId } = location.state || {};
  const [brokerId, setBrokerId] = useState(initialBrokerId);

  // Determine active route
  const getActiveClass = (path) => {
    return location.pathname === `/dashboard${path}` || (path === '' && location.pathname === '/dashboard')
      ? 'dashboard-button active'
      : 'dashboard-button';
  };

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const storedUserRole = localStorage.getItem('userRole');

    if (
      !authToken ||
      !storedUserId ||
      storedUserId !== userId ||
      !storedUserRole
    ) {
      setError('Authentication token, user ID, or role is missing. Please log in again.');
      navigate('/');
      return;
    }

    setUserRole(storedUserRole);
    setUserEmail(email || 'User');

    fetchAssignedBroker(storedUserId, authToken).then((broker) => {
      if (broker) {
        if (initialBrokerId && broker.brokerId !== initialBrokerId) {
          setError('Assigned broker does not match provided broker ID.');
          navigate('/');
          return;
        }
        setBrokerId(broker.brokerId);
        setBrokerStatus(broker.connectionStatus || 'unknown');
      } else {
        if (storedUserRole === 'admin') {
          setError('Admins cannot publish; please assign a user.');
          navigate('/table');
        } else {
          setError('No brokers assigned. Please contact an admin.');
          navigate('/');
        }
      }
    });

    let intervalId;
    if (storedUserRole !== 'admin' && brokerId) {
      const fetchBrokerStatus = async () => {
        try {
          console.log(`Fetching status for brokerId: ${brokerId}`);
          const response = await API_CONFIG.get(
            `/api/brokers/${brokerId}/status`,
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `Failed to fetch broker status (HTTP ${response.status})`
            );
          }

          const data = await response.json();
          const status = data.status || data.connectionStatus || 'unknown';

          if (status === 'undefined' || status == null) {
            console.warn(`Invalid status for broker ${brokerId}: ${status}`);
            return;
          }

          if (status !== brokerStatus) {
            console.log(`Broker ${brokerId} status updated to: ${status}`);
            setBrokerStatus(status);
            // toast[status === 'connected' ? 'success' : 'error'](
            //   `Broker ${brokerId} is ${status}`,
            //   { toastId: brokerId }
            // );
          }
        } catch (err) {
          console.error('Error fetching broker status:', err.message);
          toast.error(err.message || 'Error fetching broker status.');
        }
      };

      fetchBrokerStatus();
      intervalId = setInterval(fetchBrokerStatus, 15 * 60 * 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('Polling stopped');
      }
    };
  }, [brokerId, userRole, navigate, userId]);

  const fetchAssignedBroker = async (userId, token) => {
    try {
      const response = await API_CONFIG.get('/api/brokers/assigned', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to fetch assigned broker (HTTP ${response.status})`
        );
      }

      const data = await response.json();
      return {
        brokerId: data.brokerId,
        connectionStatus: data.connectionStatus || 'unknown',
      };
    } catch (err) {
      console.error('Error fetching assigned broker:', err.message);
      toast.error(err.message || 'Error fetching assigned broker.');
      return null;
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
      });
    }
  }, [error]);

  const handleDisconnect = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      setShowDisconnectModal(false);
      return;
    }

    try {
      const response = await API_CONFIG.post(
        `/api/brokers/${brokerId}/disconnect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Failed to disconnect broker.';
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success('Broker disconnected successfully!');
      setShowDisconnectModal(false);
      setBrokerStatus('disconnected');
      navigate('/table');
    } catch (err) {
      console.error('Disconnect error:', err.message);
      toast.error(err.message || 'An error occurred while disconnecting.');
      setShowDisconnectModal(false);
    }
  };

  const handleDisconnectCancel = () => {
    setShowDisconnectModal(false);
  };

  const handleNavigation = (path) => {
    navigate(`/dashboard${path}`, { state: { brokerId, userId } });
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button
          className={getActiveClass('/com-config') || getActiveClass('')}
          onClick={() => handleNavigation('/com-config')}
          disabled={userRole === 'admin'}
        >
          Com Configuration
        </button>
        <button
          className={getActiveClass('/wifi-config')}
          onClick={() => handleNavigation('/wifi-config')}
          disabled={userRole === 'admin'}
        >
          Wi-Fi
        </button>
        <button
          className={getActiveClass('/subscribe')}
          onClick={() => handleNavigation('/subscribe')} // Add navigation handler
        >
          Location
        </button>
      </div>
      <div className="dashboard-main">
        <Outlet context={{ brokerId, userId, userRole, setError }} />
      </div>
      <DisconnectModal
        isOpen={showDisconnectModal}
        onConfirm={handleDisconnect}
        onCancel={handleDisconnectCancel}
      />
    </div>
  );
};

export default Dashboard;