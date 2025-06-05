// Publish.js
import React, { useState } from 'react';
import './Publish.css';

const Publish = () => {
  const [inputSets, setInputSets] = useState([
    {
      topic: '',
      qosLevel: '0', // Default value for QoS Level
      payload: '',
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
        topic: '',
        qosLevel: '0',
        payload: '',
      },
    ]);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/pub/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputSets }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish');
      }

      const result = await response.json();
      console.log('Publish Response:', result);

      // Display summary in alert
      const summary = inputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Topic - ${set.topic}, QoS Level - ${set.qosLevel}, Payload - ${set.payload}`
        )
        .join('\n');
      alert('Published:\n' + summary);
    } catch (error) {
      console.error('Error publishing:', error.message);
      alert('Failed to publish: ' + error.message);
    }
  };

  const handleClear = () => {
    if (inputSets.length > 1) {
      setInputSets(inputSets.slice(0, -1));
    } else {
      setInputSets([
        {
          topic: '',
          qosLevel: '0',
          payload: '',
        },
      ]);
    }
  };

  return (
    <div className="publish-container">
      <div className="publish-content">
        <h2 className="publish-title">Publish</h2>
        <form className="publish-form" onSubmit={handlePublish}>
          <div className="publish-inputs-scroll-container">
            {inputSets.map((inputSet, index) => (
              <div key={index} className="publish-input-set">
                <div className="publish-form-group">
                  <label htmlFor={`topic-${index}`} className="publish-form-label">Topic {index + 1}</label>
                  <input
                    required
                    className="publish-form-input"
                    type="text"
                    name="topic"
                    id={`topic-${index}`}
                    placeholder="Enter Topic"
                    value={inputSet.topic}
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
                <div className="publish-form-group">
                  <label htmlFor={`qosLevel-${index}`} className="publish-form-label">QoS Level</label>
                  <select
                    required
                    className="publish-form-select"
                    name="qosLevel"
                    id={`qosLevel-${index}`}
                    value={inputSet.qosLevel}
                    onChange={(e) => handleChange(index, e)}
                  >
                    <option value="0">0 - At Most Once</option>
                    <option value="1">1 - At Least Once</option>
                    <option value="2">2 - Exactly Once</option>
                  </select>
                </div>
                <div className="publish-form-group">
                  <label htmlFor={`payload-${index}`} className="publish-form-label">Payload</label>
                  <textarea
                    required
                    className="publish-form-textarea"
                    name="payload"
                    id={`payload-${index}`}
                    placeholder="Enter Payload (e.g., JSON data)"
                    value={inputSet.payload}
                    onChange={(e) => handleChange(index, e)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="publish-buttons-container">
            <button
              type="button"
              className="publish-add-task-button"
              // onClick={handleAddTopic}
            >
              + Add Topic
            </button>
            <button
              type="submit"
              className="publish-submit-button"
            >
              Publish
            </button>
            <button
              type="button"
              className="publish-submit-button"
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

export default Publish;