import React, { useState } from 'react';
import './Publish.css';

const Publish = () => {
  const [formData, setFormData] = useState({
    topic: '',
    qosLevel: '',
    payload: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTask = () => {
    console.log('Add Task Clicked:', formData);
    alert('Task Added: Topic - ' + formData.topic + ', QoS Level - ' + formData.qosLevel + ', Payload - ' + formData.payload);
  };

  const handlePublish = (e) => {
    e.preventDefault();
    console.log('Publish Submitted:', formData);
    alert('Published: Topic - ' + formData.topic + ', QoS Level - ' + formData.qosLevel + ', Payload - ' + formData.payload);
  };

  return (
    <div className="publish-container">
      <div className="publish-content">
        <h2 className="publish-title">Publish</h2>
        <form className="publish-form" onSubmit={handlePublish}>
          <div className="publish-form-group">
            <label htmlFor="topic" className="publish-form-label">Topic</label>
            <input
              required
              className="publish-form-input"
              type="text"
              name="topic"
              id="topic"
              placeholder="Enter Topic"
              value={formData.topic}
              onChange={handleChange}
            />
          </div>
          <div className="publish-form-group">
            <label htmlFor="qosLevel" className="publish-form-label">QoS Level</label>
            <input
              required
              className="publish-form-input"
              type="number"
              name="qosLevel"
              id="qosLevel"
              placeholder="Enter QoS Level (0-2)"
              min="0"
              max="2"
              value={formData.qosLevel}
              onChange={handleChange}
            />
          </div>
          <div className="publish-form-group">
            <label htmlFor="payload" className="publish-form-label">Payload</label>
            <textarea
              required
              className="publish-form-textarea"
              name="payload"
              id="payload"
              placeholder="Enter Payload (e.g., JSON data)"
              value={formData.payload}
              onChange={handleChange}
            />
          </div>
          <div className="publish-buttons-container">
            <button
              type="button"
              className="publish-add-task-button"
              onClick={handleAddTask}
            >
              + Add Task
            </button>
            <button
              type="submit"
              className="publish-submit-button"
            >
              Publish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Publish;