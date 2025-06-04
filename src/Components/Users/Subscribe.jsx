import React, { useState } from 'react';
import './Subscribe.css';

const Subscribe = () => {
  const [formData, setFormData] = useState({
    topicFilter: '',
    qosLevel: '0', // Default value set to '0'
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTask = () => {
    console.log('Add Task Clicked:', formData);
    alert('Task Added: Topic Filter - ' + formData.topicFilter + ', QoS Level - ' + formData.qosLevel);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribe Topics Submitted:', formData);
    alert('Subscribed: Topic Filter - ' + formData.topicFilter + ', QoS Level - ' + formData.qosLevel);
  };

  return (
    <div className="subscribe-topics-container">
      <div className="subscribe-topics-content">
        <h2 className="subscribe-topics-title">Subscribe Topics</h2>
        <form className="subscribe-topics-form" onSubmit={handleSubscribe}>
          <div className="subscribe-form-group">
            <label htmlFor="topicFilter" className="subscribe-form-label">Topic Filter</label>
            <input
              required
              className="subscribe-form-input"
              type="text"
              name="topicFilter"
              id="topicFilter"
              placeholder="Enter Topic Filter"
              value={formData.topicFilter}
              onChange={handleChange}
            />
          </div>
          <div className="subscribe-form-group">
            <label htmlFor="qosLevel" className="subscribe-form-label">QoS Level</label>
            <select
              required
              className="subscribe-form-select" // New class for specific styling
              name="qosLevel"
              id="qosLevel"
              value={formData.qosLevel}
              onChange={handleChange}
            >
              <option value="0">0 - Almost Once</option>
              <option value="1">1 - At least Once</option>
              <option value="2">2 - Exactly Once</option>
            </select>
          </div>
          <div className="subscribe-buttons-container">
            <button
              type="button"
              className="subscribe-add-task-button"
              onClick={handleAddTask}
            >
              + Add Topic
            </button>
            <button
              type="submit"
              className="subscribe-submit-button"
            >
              Subscribe Topics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Subscribe;