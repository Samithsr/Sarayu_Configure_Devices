import React, { useState } from 'react';
import './Subscribe.css';

const Subscribe = () => {
  const [inputSets, setInputSets] = useState([
    {
      topicFilter: '',
      qosLevel: '0', // Default value for QoS Level
    },
  ]);

  const handleChange = (index, e) => {
    const newInputSets = [...inputSets];
    newInputSets[index] = {
      ...newInputSets[index],
      [e.target.name]: e.target.value,
    };
    setInputSets(newInputSets);
  };

  const handleAddTopic = () => {
    setInputSets([
      ...inputSets,
      {
        topicFilter: '',
        qosLevel: '0',
      },
    ]);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    console.log('Subscribe Topics Submitted:', inputSets);
    const summary = inputSets.map(
      (set, index) =>
        `Set ${index + 1}: Topic Filter - ${set.topicFilter}, QoS Level - ${set.qosLevel}`
    ).join('\n');
    alert('Subscribed:\n' + summary);
  };

  const handleClear = () => {
    if (inputSets.length > 1) {
      setInputSets(inputSets.slice(0, -1));
    } else {
      setInputSets([
        {
          topicFilter: '',
          qosLevel: '0',
        },
      ]);
    }
  };

  return (
    <div className="subscribe-topics-container">
      <div className="subscribe-topics-content">
        <h2 className="subscribe-topics-title">Subscribe Topics</h2>
        <form className="subscribe-topics-form" onSubmit={handleSubscribe}>
          <div className="subscribe-inputs-scroll-container">
            {inputSets.map((inputSet, index) => (
              <div key={index} className="subscribe-input-set">
                <div className="subscribe-form-group">
                  <label htmlFor={`topicFilter-${index}`} className="subscribe-form-label">Topic Filter {index + 1}</label>
                  <input
                    required
                    className="subscribe-form-input"
                    type="text"
                    name="topicFilter"
                    id={`topicFilter-${index}`}
                    placeholder="Enter Topic Filter"
                    value={inputSet.topicFilter}
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
                <div className="subscribe-form-group">
                  <label htmlFor={`qosLevel-${index}`} className="subscribe-form-label">QoS Level</label>
                  <select
                    required
                    className="subscribe-form-select"
                    name="qosLevel"
                    id={`qosLevel-${index}`}
                    value={inputSet.qosLevel}
                    onChange={(e) => handleChange(index, e)}
                  >
                    <option value="0">0 - Almost Once</option>
                    <option value="1">1 - At least Once</option>
                    <option value="2">2 - Exactly Once</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="subscribe-buttons-container">
            <button
              type="button"
              className="subscribe-add-task-button"
              onClick={handleAddTopic}
            >
              + Add Topic
            </button>
            <button
              type="submit"
              className="subscribe-submit-button"
            >
              Subscribe Topics
            </button>
            <button
              type="button"
              className="subscribe-submit-button"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Subscribe;