import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ComConfiguration.css';
import API_CONFIG from '../Config/apiConfig';

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
  Delay: '',
});

const ComConfiguration = () => {
  const [formBlocks, setFormBlocks] = useState([getDefaultFormData()]);
  const [formKey, setFormKey] = useState(0);
  const [topicName, setTopicName] = useState('');
  const [success, setSuccess] = useState('');
  const { brokerId, userId, userRole, setError } = useOutletContext();
  const navigate = useNavigate();

  const handleChange = (index, e) => {
    const { id, value } = e.target;
    const updatedForms = [...formBlocks];
    updatedForms[index][id] = value;
    setFormBlocks(updatedForms);
    setError('');
    setSuccess('');
  };

  const handleReset = () => {
    setError('');
    setSuccess('');
    const updatedForms = [...formBlocks];
    updatedForms[updatedForms.length - 1] = getDefaultFormData();
    setFormBlocks(updatedForms);
    toast.success('Last row cleared!');
  };

  const handlePrev = () => {
    setError('');
    setSuccess('');
    if (formBlocks.length > 1) {
      const updatedForms = formBlocks.slice(0, -1);
      setFormBlocks(updatedForms);
      toast.success('Last row removed!');
    } else {
      toast.error('Cannot remove the last row!');
    }
  };

  const handleAdd = () => {
    setError('');
    setSuccess('');
    setFormBlocks([...formBlocks, getDefaultFormData()]);
    toast.success('New input row added!');
  };

  const handlePublish = async (e) => {
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

    if (!topicName.trim()) {
      setError('Please enter a topic name before publishing.');
      return;
    }

    const isValid = formBlocks.every((block) =>
      Object.values(block).every((value) => value !== '')
    );

    if (!isValid) {
      setError('Please fill in all fields before publishing.');
      return;
    }

    const payload = formBlocks.map((formBlock) => ({
      tagname: formBlock.tag1,
      deviceId: formBlock.tag2,
      slaveId: formBlock.tag3,
      functionCode: formBlock.tag4,
      address: formBlock.tag5,
      length: formBlock.tag6,
      dataType: formBlock.tag7,
      scaling: formBlock.tag8,
      baudRate: formBlock.baudRate,
      dataBit: formBlock.dataBit,
      parity: formBlock.parity,
      stopBit: formBlock.stopBit,
      delay: formBlock.Delay,
    }));

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
            message: JSON.stringify(payload),
            label: 'Com Configuration',
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        const errorMessage = errorData.message || 'Failed to publish message.';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      const successMessage = `Published configurations to topic ${topicName} successfully!`;
      setSuccess(successMessage);
      toast.success(successMessage);
    } catch (err) {
      console.error('Publish error:', err.message);
      setError(err.message || 'An error occurred while publishing.');
      toast.error(err.message || 'Failed to publish Com configuration.');
    }
  };

  return (
    <div className="dashboard-main window-effect">
      <div className="form-scroll-area">
        <div className="table-wrapper">
          <table className="form-table">
            <thead>
              <tr>
                <th>Tagname</th>
                <th>Device Id</th>
                <th>Slave ID</th>
                <th>Function Code</th>
                <th>Address</th>
                <th>Length</th>
                <th>Data Type</th>
                <th>Scaling</th>
                <th>Baud Rate</th>
                <th>Data Bit</th>
                <th>Parity</th>
                <th>Stop Bit</th>
                <th>Delay</th>
              </tr>
            </thead>
            <tbody>
              {formBlocks.map((form, index) => (
                <tr key={`${formKey}-${index}`}>
                  <td><input id="tag1" value={form.tag1} onChange={(e) => handleChange(index, e)} /></td>
                  <td><input id="tag2" value={form.tag2} onChange={(e) => handleChange(index, e)} /></td>
                  <td><input id="tag3" value={form.tag3} onChange={(e) => handleChange(index, e)} /></td>
                  <td><input id="tag4" value={form.tag4} onChange={(e) => handleChange(index, e)} /></td>
                  <td><input id="tag5" value={form.tag5} onChange={(e) => handleChange(index, e)} /></td>
                  <td><input id="tag6" value={form.tag6} onChange={(e) => handleChange(index, e)} /></td>
                  <td>
                    <select id="tag7" value={form.tag7} onChange={(e) => handleChange(index, e)}>
                      <option value="int">int</option>
                      <option value="float">float</option>
                      <option value="string">string</option>
                    </select>
                  </td>
                  <td><input id="tag8" value={form.tag8} onChange={(e) => handleChange(index, e)} /></td>
                  <td>
                    <select id="baudRate" value={form.baudRate} onChange={(e) => handleChange(index, e)}>
                      <option value="9600">9600</option>
                      <option value="19200">19200</option>
                      <option value="38400">38400</option>
                      <option value="57600">57600</option>
                      <option value="115200">115200</option>
                    </select>
                  </td>
                  <td>
                    <select id="dataBit" value={form.dataBit} onChange={(e) => handleChange(index, e)}>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                    </select>
                  </td>
                  <td>
                    <select id="parity" value={form.parity} onChange={(e) => handleChange(index, e)}>
                      <option value="none">None</option>
                      <option value="even">Even</option>
                      <option value="odd">Odd</option>
                    </select>
                  </td>
                  <td>
                    <select id="stopBit" value={form.stopBit} onChange={(e) => handleChange(index, e)}>
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </td>
                  <td><input id="Delay" value={form.Delay} onChange={(e) => handleChange(index, e)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="fixed-buttons">
        <button className="dashboard-action-button" onClick={handlePrev}>
          Remove
        </button>
        <button className="dashboard-action-button" onClick={handleReset}>
          Reset
        </button>
        <button className="dashboard-action-button" onClick={handleAdd}>
          Add+
        </button>
      </div>
      <div className="dashboard-topic-name">
        <input
          type="text"
          id="topicName"
          placeholder="Enter Topic Name"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
        />
        <button onClick={handlePublish} disabled={userRole === 'admin'}>
          Publish
        </button>
        {/* <button>Read</button> */}
      </div>
    </div>
  );
};

export default ComConfiguration;