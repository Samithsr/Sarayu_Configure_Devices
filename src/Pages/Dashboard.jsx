import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import { useLocation, useNavigate } from 'react-router-dom';

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
  const [showMain, setShowMain] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerId } = location.state || {};

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');
    const authToken = localStorage.getItem('authToken');

    if (!authToken || !userId) {
      setError('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    setUserEmail(email || 'User');
  }, [navigate]);

  const handleChange = (index, e) => {
    setError('');
    setSuccess('');
    const { id, value } = e.target;
    const updatedForms = [...formBlocks];
    updatedForms[index][id] = value;
    setFormBlocks(updatedForms);
  };

  const handleReset = () => {
    const updatedForms = [...formBlocks];
    updatedForms[formBlocks.length - 1] = getDefaultFormData();
    setFormBlocks(updatedForms);
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    if (!authToken || !userId) {
      setError('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    const payload = {
      configurations: formBlocks,
      userId,
      brokerId,
    };

    try {
      const response = await fetch('http://localhost:5000/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('userEmail');
          setError('Session expired. Please log in again.');
          navigate('/');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess('Configurations saved successfully!');
      setFormBlocks([getDefaultFormData()]);
    } catch (err) {
      console.error('Error saving configurations:', err);
      setError(err.message || 'An error occurred while saving configurations.');
    }
  };

  const handleAdd = () => {
    setFormBlocks([...formBlocks, getDefaultFormData()]);
  };

  const handlePublishClick = () => {
    setShowMain(true);
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
        <div className="user-info" style={{ marginBottom: '20px', textAlign: 'center' }}>
          {/* <h3>Welcome, {userEmail}</h3> */}
        </div>
        {showMain && (
          <>
            <h2>Com Configuration</h2>
            {error && (
              <p className="error-message" style={{ color: 'red', textAlign: 'center' }}>
                {error}
              </p>
            )}
            {success && (
              <p className="success-message" style={{ color: 'green', textAlign: 'center' }}>
                {success}
              </p>
            )}

            <div className="form-scroll-area">
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
                        {[110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((rate) => (
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
                        {['none', 'even', 'odd', 'mark', 'space'].map((val) => (
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
              <button className="dashboard-action-button" onClick={handleSubmit}>Submit</button>
              <button className="dashboard-action-button" onClick={handleAdd}>Add</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;