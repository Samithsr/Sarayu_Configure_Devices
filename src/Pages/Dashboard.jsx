import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const defaultValues = {
    tag1: '',
    tag2: '',
    tag3: '',
    tag4: '',
    tag5: '',
    tag6: '',
    tag7: 'int',         // Data Type
    tag8: '',
    baudRate: '115200',
    dataBit: '8',
    parity: 'none',
    stopBit: '1',
  };

  const [formBlocks, setFormBlocks] = useState([defaultValues]);
  const [showMain, setShowMain] = useState(false); // Initially hidden
  const [brokerId, setBrokerId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (index, e) => {
    const { name, value } = e.target;
    setFormBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], [name]: value };
      return newBlocks;
    });
  };

  const handleReset = () => {
    setFormBlocks((prev) => {
      if (prev.length > 1) {
        // Remove the last form block if there are multiple
        return prev.slice(0, -1);
      } else {
        // Clear the only form block to default values
        return [{ ...defaultValues }];
      }
    });
    setSuccess('');
    setError('');
  };

  const handleSubmit = () => {
    // Validate that all text input fields in all form blocks are non-empty
    const requiredFields = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag8'];
    const isValid = formBlocks.every((block, blockIndex) => {
      const isBlockValid = requiredFields.every(field => {
        const isFieldValid = block[field] !== '';
        if (!isFieldValid) {
          console.log(`Validation failed: Block ${blockIndex}, Field ${field} is empty`);
        }
        return isFieldValid;
      });
      return isBlockValid;
    });

    if (!isValid) {
      setError('Please fill in all fields before submitting.');
      setSuccess('');
      return;
    }

    console.log('Submitting:', formBlocks);
    setSuccess('Form submitted successfully!');
    setError('');
    // Add your API submission logic here if needed
  };

  const handleAdd = () => {
    console.log('Add clicked');
    setFormBlocks((prev) => [...prev, { ...defaultValues }]);
  };

  const handlePublishClick = () => {
    console.log('Publish clicked');
    setShowMain(true); // Show dashboard-main on Publish click
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button" onClick={handlePublishClick}>Publish</button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Com Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      {showMain && (
        <div className="dashboard-main">
          <h2>Com Configuration {brokerId ? `for Broker ${brokerId}` : ''}</h2>

          <div className="form-scroll-area">
            {formBlocks.map((formData, index) => (
              <div key={index} className={`form-block ${index !== 0 ? 'form-block-margin' : ''}`}>
                {/* Row 1 */}
                <div className="dashboard-form-horizontal">
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag1-${index}`}>Tagname:</label>
                    <input
                      type="text"
                      id={`tag1-${index}`}
                      name="tag1"
                      value={formData.tag1}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag2-${index}`}>Device ID</label>
                    <input
                      type="text"
                      id={`tag2-${index}`}
                      name="tag2"
                      value={formData.tag2}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag3-${index}`}>Slave Id</label>
                    <input
                      type="text"
                      id={`tag3-${index}`}
                      name="tag3"
                      value={formData.tag3}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag4-${index}`}>Function Code</label>
                    <input
                      type="text"
                      id={`tag4-${index}`}
                      name="tag4"
                      value={formData.tag4}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                </div>

                {/* Row 2 */}
                <div className="dashboard-form-horizontal">
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag5-${index}`}>Address</label>
                    <input
                      type="text"
                      id={`tag5-${index}`}
                      name="tag5"
                      value={formData.tag5}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag6-${index}`}>Length</label>
                    <input
                      type="text"
                      id={`tag6-${index}`}
                      name="tag6"
                      value={formData.tag6}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag7-${index}`}>Data Type</label>
                    <select
                      id={`tag7-${index}`}
                      name="tag7"
                      value={formData.tag7}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="int">int</option>
                      <option value="float">float</option>
                    </select>
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`tag8-${index}`}>Scaling</label>
                    <input
                      type="text"
                      id={`tag8-${index}`}
                      name="tag8"
                      value={formData.tag8}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="dashboard-form-horizontal">
                  <div className="dashboard-form-group">
                    <label htmlFor={`baudRate-${index}`}>Baud Rate</label>
                    <select
                      id={`baudRate-${index}`}
                      name="baudRate"
                      value={formData.baudRate}
                      onChange={(e) => handleChange(index, e)}
                    >
                      {[110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((rate) => (
                        <option key={rate} value={rate}>{rate}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`dataBit-${index}`}>Data Bit</label>
                    <select
                      id={`dataBit-${index}`}
                      name="dataBit"
                      value={formData.dataBit}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`parity-${index}`}>Parity</label>
                    <select
                      id={`parity-${index}`}
                      name="parity"
                      value={formData.parity}
                      onChange={(e) => handleChange(index, e)}
                    >
                      {['none', 'even', 'odd', 'mark', 'space'].map((val) => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dashboard-form-group">
                    <label htmlFor={`stopBit-${index}`}>Stop Bit</label>
                    <select
                      id={`stopBit-${index}`}
                      name="stopBit"
                      value={formData.stopBit}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-form-buttons fixed-buttons">
            <div className="button-group">
              <button className="dashboard-action-button" onClick={handleReset}>Reset</button>
              <button className="dashboard-action-button" onClick={handleSubmit}>Submit</button>
              <button className="dashboard-action-button" onClick={handleAdd}>Add</button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;