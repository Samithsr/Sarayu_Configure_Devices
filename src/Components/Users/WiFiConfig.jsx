import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// import "../../Pages/Dashboard.css";
// import './Dashboard.css';
// import Dashboard from './../../Pages/Dashboard';

const WiFiConfig = () => {
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [topicName, setTopicName] = useState('');
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { brokerId, userId, userRole, setError: setParentError } = useOutletContext();
  const navigate = useNavigate();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');

    if (!authToken || !storedUserId || storedUserId !== userId || !brokerId) {
      setError('Authentication token, user ID, or broker ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    const fetchBrokerStatus = async () => {
      try {
        console.log(`Fetching status for brokerId: ${brokerId}`);
        const response = await fetch(
          `http://localhost:5000/api/brokers/${brokerId}/status`,
          {
            method: 'GET',
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
          toast[status === 'connected' ? 'success' : 'error'](
            `Broker ${brokerId} is ${status}`,
            { toastId: brokerId }
          );
        }
      } catch (err) {
        console.error('Error fetching broker status:', err.message);
        toast.error(err.message || 'Error fetching broker status.');
      }
    };

    fetchBrokerStatus();
    const intervalId = setInterval(fetchBrokerStatus, 15 * 1000);

    return () => {
      clearInterval(intervalId);
      console.log('Polling stopped');
    };
  }, [brokerId, userId, navigate]);

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
      setParentError(error);
    }
  }, [error, setParentError]);

  useEffect(() => {
    if (success) {
      toast.success(success, {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
      });
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const authToken = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');

    if (!authToken || !storedUserId) {
      setError('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    if (userRole === 'admin') {
      setError('Admins are not allowed to publish.');
      return;
    }

    if (!ssid.trim() || !password.trim()) {
      setError('Please enter both SSID and Password.');
      return;
    }

    if (!topicName.trim()) {
      setError('Please enter a topic name before publishing.');
      return;
    }

    const publishData = {
      ssid: String(ssid),
      password: String(password),
    };

    try {
      const publishResponse = await fetch(
        `http://localhost:5000/api/brokers/${brokerId}/publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            topic: topicName.trim(),
            message: JSON.stringify(publishData),
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        const errorMessage = errorData.message || 'Failed to publish message.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setSuccess(`Published Wi-Fi configurations to topic ${topicName} successfully!`);
      setSsid('');
      setPassword('');
      setTopicName('');
    } catch (err) {
      console.error('Publish error:', err.message);
      setError(err.message || 'An error occurred while publishing.');
    }
  };

  const handleNavigation = (path) => {
    navigate(`/dashboard${path}`, { state: { brokerId, userId } });
  };

  return (
    <div className="dashboard-main window-effect">
      <form onSubmit={handleSubmit} className="wifi-config-form">
        <div className="form-row">
          <label>
            SSID:
            <input
              type="text"
              id="ssid"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              placeholder="Enter Wi-Fi SSID"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Password:
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Wi-Fi Password"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Topic Name:
            <input
              type="text"
              id="topicName"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Enter Topic Name"
            />
          </label>
        </div>
        <div className="dashboard-form-buttons">
          <button
            type="button"
            className="dashboard-action-button"
            onClick={() => handleNavigation('')}
          >
            Back
          </button>
          <button type="submit" className="dashboard-action-button" disabled={userRole === 'admin'}>
            Connect
          </button>
        </div>
      </form>
    </div>
  );
};

export default WiFiConfig;