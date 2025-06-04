import React, { useState, useEffect } from 'react';
import './Subscribe.css';

const Subscribe = () => {
  const [inputSets, setInputSets] = useState([
    {
      topicFilter: '',
      qosLevel: '0', // Default value for QoS Level
    },
  ]);
  const [messages, setMessages] = useState([]); // Store received messages

  // Poll for messages every 5 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/messages');
        const result = await response.json();
        if (response.ok) {
          console.log('Fetched messages:', result.messages);
          setMessages(result.messages);
        } else {
          console.error('Failed to fetch messages:', result.error);
        }
      } catch (error) {
        console.error('Error fetching messages:', error.message);
      }
    };

    fetchMessages(); // Initial fetch
    const intervalId = setInterval(fetchMessages, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    console.log('Subscribe Topics Submitted:', inputSets);

    try {
      const response = await fetch('http://localhost:5000/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputSets }),
      });

      const result = await response.json();
      console.log('Subscribe Response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to subscribe');
      }

      const summary = inputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Topic Filter - ${set.topicFilter}, QoS Level - ${set.qosLevel}`
        )
        .join('\n');
      alert('Subscribed:\n' + summary);
    } catch (error) {
      console.error('Error subscribing:', error.message);
      alert('Failed to subscribe: ' + error.message);
    }
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
        <div className="subscribe-content-wrapper">
          <div className="subscribe-form-wrapper">
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
                        <option value="0">0 - At Most Once</option>
                        <option value="1">1 - At Least Once</option>
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
          <div className="messages-wrapper">
            <h3 className="messages-title">Received Messages</h3>
            <div className="messages-scroll-container">
              {messages.length === 0 ? (
                <p className="no-messages">No messages received yet.</p>
              ) : (
                <ul className="messages-list">
                  {messages.map((msg, index) => (
                    <li key={index} className="message-item">
                      <div className="message-content">
                        <strong>Topic:</strong> {msg.topic}
                      </div>
                      <div className="message-content">
                        <strong>Payload:</strong> {msg.payload}
                      </div>
                      <div className="message-content">
                        <strong>QoS:</strong> {msg.qos}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;