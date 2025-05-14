import React, { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../Pages/Socket'; // Import shared socket

const getDefaultFormData = () => ({
  tag1: '',
  tag2: '',
  tag3: '',
  tag4: '',
  tag5: '',
  tag6: '',
  tag7: 'int',
  tag8: '',
  baudRate: '115200',
  dataBit: '8',
  parity: 'none',
  stopBit: '1',
});

const Dashboard = () => {
  const [formBlocks, setFormBlocks] = useState([getDefaultFormData()]);
  const [formKey, setFormKey] = useState(0);
  const [showMain, setShowMain] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [topicName, setTopicName] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerId } = location.state || {};
  const socketRef = useRef(socket);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    if (!authToken || !userId || !brokerId) {
      setError('Authentication token, user ID, or broker ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    setUserEmail(email || 'User');

    // Update socket auth token
    socketRef.current.auth = { token: `Bearer ${authToken}`, userId, brokerId };

    // Ensure socket is connected
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    // Socket.IO event listeners
    socketRef.current.on('connect', () => {
      console.log(`Socket.IO connected for user ${userId}, broker ${brokerId}:`, socketRef.current.id);
      socketRef.current.emit('connect_broker', { brokerId, userId });
    });

    socketRef.current.on('error', ({ message, brokerId: receivedBrokerId }) => {
      if (receivedBrokerId === brokerId) {
        console.error(`Socket error for user ${userId}, broker ${brokerId}: ${message}`);
        setError(message);
        setConnectionError(message);
        if (message.includes('Another session is active')) {
          socketRef.current.disconnect();
          alert('Another session is active for this user. Please close other tabs or sessions.');
          navigate('/');
        }
      }
    });

    socketRef.current.on('disconnect', () => {
      console.log(`Socket.IO disconnected for user ${userId}, broker ${brokerId}`);
      setConnectionStatus('disconnected');
      setConnectionError('Socket connection lost. Please check your network.');
    });

    socketRef.current.on('mqtt_status', ({ brokerId: receivedBrokerId, status }) => {
      if (receivedBrokerId === brokerId) {
        console.log(`MQTT status update for user ${userId}, broker ${brokerId}: ${status}`);
        setConnectionStatus(status);
        if (status === 'connected') {
          setConnectionError('');
          // setSuccess('MQTT broker connected successfully!');
        } else if (status === 'disconnected') {
          // setConnectionError('MQTT broker disconnected. Please try reconnecting.');
        } else if (status === 'connecting') {
          // setConnectionError('Attempting to connect to MQTT broker...');
        }
      }
    });

    socketRef.current.on('subscribed', ({ topic, brokerId: receivedBrokerId }) => {
      if (receivedBrokerId === brokerId) {
        console.log(`Subscribed to topic ${topic} for user ${userId}, broker ${brokerId}`);
        setSuccess(`Subscribed to topic ${topic}`);
      }
    });

    socketRef.current.on('published', ({ topic, brokerId: receivedBrokerId }) => {
      if (receivedBrokerId === brokerId) {
        console.log(`Published to topic ${topic} for user ${userId}, broker ${brokerId}`);
        setSuccess(`Published configurations to topic ${topic}`);
      }
    });

    socketRef.current.on('mqtt_message', ({ topic, message, brokerId: receivedBrokerId }) => {
      if (receivedBrokerId === brokerId) {
        console.log(`Received MQTT message on topic ${topic} for user ${userId}, broker ${brokerId}: ${message}`);
        setSuccess(`Received message on topic ${topic}: ${message}`);
      }
    });

    return () => {
      socketRef.current.off('connect');
      socketRef.current.off('error');
      socketRef.current.off('disconnect');
      socketRef.current.off('mqtt_status');
      socketRef.current.off('subscribed');
      socketRef.current.off('published');
      socketRef.current.off('mqtt_message');
    };
  }, [navigate, brokerId]);

  const handleChange = (index, e) => {
    const { id, value } = e.target;
    const updatedForms = [...formBlocks];
    updatedForms[index][id] = value;
    setFormBlocks(updatedForms);
    setError('');
    setSuccess('');
  };

  const handleReset = () => {
    const updatedForms = [...formBlocks];
    updatedForms[formBlocks.length - 1] = getDefaultFormData();
    setFormBlocks(updatedForms);
    setError('');
    setSuccess('');
  };

  const handleAdd = () => {
    setError('');
    setSuccess('');
    setFormBlocks([...formBlocks, getDefaultFormData()]);
    setSuccess('New form block added!');
  };

  const handleRetryConnection = () => {
    const userId = localStorage.getItem('userId');
    setError('');
    setSuccess('');
    setConnectionError('Attempting to reconnect to MQTT broker...');
    socketRef.current.emit('connect_broker', { brokerId, userId });
  };

  const handlePublish = () => {
    setError('');
    setSuccess('');

    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
      setError('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    if (!topicName.trim()) {
      setError('Please enter a topic name before publishing.');
      return;
    }

    // Validate form blocks
    const isValid = formBlocks.every(block =>
      Object.values(block).every(value => value !== '')
    );

    if (!isValid) {
      setError('Please fill in all fields before publishing.');
      return;
    }

    if (connectionStatus !== 'connected') {
      setError('MQTT broker is not connected. Please wait until the connection is established or try reconnecting.');
      return;
    }

    // Create a single flat array with all fields from all form blocks
    const publishData = formBlocks.reduce((acc, formBlock) => [
      ...acc,
      formBlock.tag1,
      formBlock.tag2,
      formBlock.tag3,
      formBlock.tag4,
      formBlock.tag5,
      formBlock.tag6,
      formBlock.tag7,
      formBlock.tag8,
      formBlock.baudRate,
      formBlock.dataBit,
      formBlock.parity,
      formBlock.stopBit,
    ], []);

    // Publish the flat array to MQTT topic
    console.log(`Emitting publish for user ${userId}, broker ${brokerId}, topic ${topicName}`);
    socketRef.current.emit('publish', {
      brokerId,
      topic: topicName.trim(),
      message: JSON.stringify(publishData),
      userId,
    });
  };

  const handlePublishClick = () => {
    setShowMain(true); // Show the form
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    navigate('/table');
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button" onClick={handlePublishClick}>Publish</button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Com Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      <div className="dashboard-main">
        <div className="status-bar">
          <button className="back-button" onClick={handleBack}>Back</button>
          {/* <p>MQTT Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span></p> */}
          {/* {connectionStatus !== 'connected' && (
            <button className="retry-button" onClick={handleRetryConnection}>Retry Connection</button>
          )} */}
        </div>
        {connectionError && <p style={{ color: 'red', textAlign: 'center' }}>{connectionError}</p>}
        {showMain && (
          <>
            <h2>Com Configuration</h2>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {success && <p style={{ color: 'green', textAlign: 'center' }}>{success}</p>}

            <div className="form-scroll-area" key={formKey}>
              {formBlocks.map((formData, index) => (
                <div key={index} className={`form-block ${index !== 0 ? 'form-block-margin' : ''}`}>
                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="tag1">Tagname:</label>
                      <input type="text" id="tag1" value={formData.tag1} onChange={(e) => handleChange(index, e)} />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag2">Device ID</label>
                      <input type="text" id="tag2" value={formData.tag2} onChange={(e) => handleChange(index, e)} />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag3">Slave Id</label>
                      <input type="text" id="tag3" value={formData.tag3} onChange={(e) => handleChange(index, e)} />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag4">Function Code</label>
                      <input type="text" id="tag4" value={formData.tag4} onChange={(e) => handleChange(index, e)} />
                    </div>
                  </div>

                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="tag5">Address</label>
                      <input type="text" id="tag5" value={formData.tag5} onChange={(e) => handleChange(index, e)} />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag6">Length</label>
                      <input type="text" id="tag6" value={formData.tag6} onChange={(e) => handleChange(index, e)} />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag7">Data Type</label>
                      <select id="tag7" value={formData.tag7} onChange={(e) => handleChange(index, e)}>
                        <option value="int">int</option>
                        <option value="float">float</option>
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag8">Scaling</label>
                      <input type="text" id="tag8" value={formData.tag8} onChange={(e) => handleChange(index, e)} />
                    </div>
                  </div>

                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="baudRate">Baud Rate</label>
                      <select id="baudRate" value={formData.baudRate} onChange={(e) => handleChange(index, e)}>
                        {[110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map(rate => (
                          <option key={rate} value={rate}>{rate}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="dataBit">Data Bit</label>
                      <select id="dataBit" value={formData.dataBit} onChange={(e) => handleChange(index, e)}>
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="parity">Parity</label>
                      <select id="parity" value={formData.parity} onChange={(e) => handleChange(index, e)}>
                        {['none', 'even', 'odd', 'mark', 'space'].map(val => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="stopBit">Stop Bit</label>
                      <select id="stopBit" value={formData.stopBit} onChange={(e) => handleChange(index, e)}>
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-form-buttons fixed-buttons">
              <button className="dashboard-action-button" onClick={handleReset}>Reset</button>
              <button className="dashboard-action-button" onClick={handleAdd}>Add+</button>
            </div>

            <div className="dashboard-topic-name">
              <label htmlFor="topicName">Topics</label>
              <input
                type="text"
                id="topicName"
                placeholder="Enter Topic Name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
              />
              <button onClick={handlePublish}>Publish</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;