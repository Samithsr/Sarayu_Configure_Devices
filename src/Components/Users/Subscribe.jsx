import React, { useState } from 'react';
import './Subscribe.css';

const Subscribe = () => {
  const [formData, setFormData] = useState({
    topicFilter: '',
    qosLevel: '',
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
            <input
              required
              className="subscribe-form-input"
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
          <div className="subscribe-buttons-container">
            <button
              type="button"
              className="subscribe-add-task-button"
              onClick={handleAddTask}
            >
              + Add Task
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