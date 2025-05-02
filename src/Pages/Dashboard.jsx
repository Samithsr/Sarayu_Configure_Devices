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

  const [formData, setFormData] = useState(defaultValues);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleReset = () => {
    setFormData({
      ...defaultValues,
    });
  };

  const handleSubmit = () => {
    console.log('Submitting:', formData);
    // Add your submit logic here
  };

  const handleAdd = () => {
    console.log('Add clicked');
    // Add your "Add row" logic here
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button">Publish</button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Com Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      <div className="dashboard-main">
        <h2>Com Configuration</h2>

        {/* Row 1 */}
        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="tag1">Tagname:</label>
            <input type="text" id="tag1" value={formData.tag1} onChange={handleChange} />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag2">Device ID</label>
            <input type="text" id="tag2" value={formData.tag2} onChange={handleChange} />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag3">Slave Id</label>
            <input type="text" id="tag3" value={formData.tag3} onChange={handleChange} />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag4">Function Code</label>
            <input type="text" id="tag4" value={formData.tag4} onChange={handleChange} />
          </div>
        </div>

        {/* Row 2 */}
        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="tag5">Address</label>
            <input type="text" id="tag5" value={formData.tag5} onChange={handleChange} />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag6">Length</label>
            <input type="text" id="tag6" value={formData.tag6} onChange={handleChange} />
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag7">Data Type</label>
            <select id="tag7" value={formData.tag7} onChange={handleChange}>
              <option value="int">int</option>
              <option value="float">float</option>
            </select>
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="tag8">Scaling</label>
            <input type="text" id="tag8" value={formData.tag8} onChange={handleChange} />
          </div>
        </div>

        {/* Row 3 */}
        <div className="dashboard-form-horizontal">
          <div className="dashboard-form-group">
            <label htmlFor="baudRate">Baud Rate</label>
            <select id="baudRate" value={formData.baudRate} onChange={handleChange}>
              <option value="110">110</option>
              <option value="300">300</option>
              <option value="600">600</option>
              <option value="1200">1200</option>
              <option value="2400">2400</option>
              <option value="4800">4800</option>
              <option value="9600">9600</option>
              <option value="14400">14400</option>
              <option value="19200">19200</option>
              <option value="38400">38400</option>
              <option value="57600">57600</option>
              <option value="115200">115200</option>
              <option value="230400">230400</option>
              <option value="460800">460800</option>
              <option value="921600">921600</option>
            </select>
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="dataBit">Data Bit</label>
            <select id="dataBit" value={formData.dataBit} onChange={handleChange}>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="parity">Parity</label>
            <select id="parity" value={formData.parity} onChange={handleChange}>
              <option value="none">none</option>
              <option value="even">even</option>
              <option value="odd">odd</option>
              <option value="mark">mark</option>
              <option value="space">space</option>
            </select>
          </div>
          <div className="dashboard-form-group">
            <label htmlFor="stopBit">Stop Bit</label>
            <select id="stopBit" value={formData.stopBit} onChange={handleChange}>
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="dashboard-form-buttons">
          <button className="dashboard-action-button" onClick={handleReset}>Reset</button>
          <button className="dashboard-action-button" onClick={handleSubmit}>Submit</button>
          <button className="dashboard-action-button" onClick={handleAdd}>Add</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
