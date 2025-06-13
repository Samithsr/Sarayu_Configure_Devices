import React, { useState, useEffect } from 'react';
import './Publish.css';
import { toast } from 'react-toastify';
import axios from "axios";

const Subscribe = () => {
  const [inputSets, setInputSets] = useState([
    {
      brokerId: '',
      topicFilter: '',
      qosLevel: '0',
    },
  ]);
  const [messages, setMessages] = useState([]);
  const [brokerOptions, setBrokerOptions] = useState([]);

  useEffect(() => {
    const getAllBrokers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await axios.get("http://localhost:5000/api/pub/get-all-brokers", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        const brokers = res?.data?.data;
        
        if (!brokers || brokers.length === 0) {
          console.warn('No brokers returned from the API.');
          toast.warn('No brokers available. Please add brokers in the admin page.');

          const demoBrokers = [
            { value: 'demo1', label: '192.168.1.100' },
            { value: 'demo2', label: '192.168.1.101' },
          ];
          setBrokerOptions(demoBrokers);
          if (demoBrokers.length > 0) {
            setInputSets((prev) =>
              prev.map((set) => ({
                ...set,
                brokerId: set.brokerId || demoBrokers[0].value,
              }))
            );
          }
          return;
        }

        const options = brokers.map((broker) => ({
          value: broker._id,
          label: broker.brokerIp,
        }));
        console.log('Broker Options:', options);
        setBrokerOptions(options);

        if (options.length > 0) {
          setInputSets((prev) =>
            prev.map((set) => ({
              ...set,
              brokerId: set.brokerId || options[0].value,
            }))
          );
        }
      } catch (error) {
        console.error('Error fetching brokers:', error.message);
        toast.error('Failed to fetch brokers: ' + (error.response?.data?.message || error.message));

        const demoBrokers = [
          { value: 'demo1', label: '192.168.1.100' },
          { value: 'demo2', label: '192.168.1.101' },
        ];
        setBrokerOptions(demoBrokers);
        if (demoBrokers.length > 0) {
          setInputSets((prev) =>
            prev.map((set) => ({
              ...set,
              brokerId: set.brokerId || demoBrokers[0].value,
            }))
          );
        }
      }
    };

    getAllBrokers();
  }, []);

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

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 5000);

    return () => clearInterval(intervalId);
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
        brokerId: brokerOptions.length > 0 ? brokerOptions[0].value : '',
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
            `Set ${index + 1}: Broker - ${
              brokerOptions.find((opt) => opt.value === set.brokerId)?.label || 'Unknown Broker'
            }, Topic Filter - ${set.topicFilter}, QoS Level - ${set.qosLevel}`
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
          brokerId: brokerOptions.length > 0 ? brokerOptions[0].value : '',
          topicFilter: '',
          qosLevel: '0',
        },
      ]);
    }
  };

  return (
    <div className='right-side-subscribe-page'>
      <div className="subscribe-topics-container">
        <div className="subscribe-topics-content">
          <div className="subscribe-content-wrapper">
            <div className="subscribe-form-wrapper">
              <h2 className="subscribe-topics-title">Subscribe Topics</h2>
              <form className="subscribe-topics-form" onSubmit={handleSubscribe}>
                <div className="subscribe-inputs-scroll-container">
                  {inputSets.map((inputSet, index) => (
                    <div key={index} className="subscribe-input-set">
                      <div className="subscribe-form-group">
                        <label className="exists-Broker-ip-header" htmlFor={`broker-${index}`}>
                          Broker IP
                        </label>
                        <select
                          className="subscribe-broker-ip-select" // Changed class name
                          id={`broker-${index}`}
                          name="brokerId"
                          value={inputSet.brokerId}
                          onChange={(e) => handleChange(index, e)}
                        >
                          <option value="" disabled>
                            Select Broker IP
                          </option>
                          {brokerOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="subscribe-form-group">
                        <label htmlFor={`topicFilter-${index}`} className="subscribe-form-label">
                          Topic Filter {index + 1}
                        </label>
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
                        <label htmlFor={`qosLevel-${index}`} className="subscribe-form-label">
                          QoS Level
                        </label>
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
                  <button type="submit" className="subscribe-submit-button">
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
    </div>
  );
};

const Publish = () => {
  const [inputSets, setInputSets] = useState([
    {
      brokerId: '',
      topic: '',
      qosLevel: '0',
      payload: '',
    },
  ]);
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState({});
  const [allBrokers, setAllBrokers] = useState(null);

  useEffect(() => {
    getAllBrokers();
  }, []);

  const getAllBrokers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get("http://localhost:5000/api/pub/get-all-brokers", {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      const brokers = res?.data?.data;
      setAllBrokers(brokers);

      if (!brokers || brokers.length === 0) {
        console.warn('No brokers returned from the API.');
        toast.warn('No brokers available. Please add brokers in the admin page.');

        const demoBrokers = [
          { value: 'demo1', label: '192.168.1.100' },
          { value: 'demo2', label: '192.168.1.101' },
        ];
        setBrokerOptions(demoBrokers);
        if (demoBrokers.length > 0 && !inputSets[0].brokerId) {
          setInputSets((prev) => {
            const newInputSets = [...prev];
            newInputSets[0].brokerId = demoBrokers[0].value;
            return newInputSets;
          });
        }
        return;
      }

      const options = brokers.map((broker) => ({
        value: broker._id,
        label: broker.brokerIp,
      }));
      console.log('Broker Options:', options);
      setBrokerOptions(options);

      if (options.length > 0 && !inputSets[0].brokerId) {
        setInputSets((prev) => {
          const newInputSets = [...prev];
          newInputSets[0].brokerId = options[0].value;
          return newInputSets;
        });
      }
    } catch (error) {
      console.error('Error fetching brokers:', error.message);
      toast.error('Failed to fetch brokers: ' + (error.response?.data?.message || error.message));

      const demoBrokers = [
        { value: 'demo1', label: '192.168.1.100' },
        { value: 'demo2', label: '192.168.1.101' },
      ];
      setBrokerOptions(demoBrokers);
      if (demoBrokers.length > 0 && !inputSets[0].brokerId) {
        setInputSets((prev) => {
          const newInputSets = [...prev];
          newInputSets[0].brokerId = demoBrokers[0].value;
          return newInputSets;
        });
      }
    }
  };

  console.log("Fetched broker IPs:", allBrokers);

  const toggleDropdown = (index, field) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [`${index}-${field}`]: !prev[`${index}-${field}`],
    }));
  };

  const handleChange = (index, e) => {
    const newInputSets = [...inputSets];
    newInputSets[index] = {
      ...newInputSets[index],
      [e.target.name]: e.target.value,
    };
    setInputSets(newInputSets);
  };

  const handleSelect = (index, field, value) => {
    const newInputSets = [...inputSets];
    newInputSets[index][field] = value;
    setInputSets(newInputSets);
    if (field === 'qosLevel') {
      setDropdownOpen((prev) => ({
        ...prev,
        [`${index}-${field}`]: false,
      }));
    }
  };

  const handleAddTopic = () => {
    setInputSets([
      ...inputSets,
      {
        brokerId: brokerOptions.length > 0 ? brokerOptions[0].value : '',
        topic: '',
        qosLevel: '0',
        payload: '',
      },
    ]);
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      for (const inputSet of inputSets) {
        const { brokerId, topic, qosLevel, payload } = inputSet;

        if (!brokerId) {
          throw new Error('Please select a broker for all sets.');
        }

        console.log(`Publishing to broker ${brokerId}, topic ${topic}, QoS ${qosLevel}`);
        const response = await axios.post(
          `http://localhost:5000/api/brokers/${brokerId}/publish`,
          {
            topic,
            message: payload,
            qos: parseInt(qosLevel, 10),
          },
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );

        if (!response.data) {
          throw new Error('Failed to publish');
        }

        console.log('Publish Response:', response.data);
      }

      const summary = inputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Broker - ${
              brokerOptions.find((opt) => opt.value === set.brokerId)?.label || 'Unknown Broker'
            }, Topic - ${set.topic}, QoS Level - ${set.qosLevel}, Payload - ${set.payload}`
        )
        .join('\n');
      toast.success('Published:\n' + summary);
    } catch (error) {
      console.error('Error publishing:', error.response || error.message);
      toast.error('Failed to publish: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleClear = () => {
    if (inputSets.length > 1) {
      setInputSets(inputSets.slice(0, -1));
    } else {
      setInputSets([
        {
          brokerId: brokerOptions.length > 0 ? brokerOptions[0].value : '',
          topic: '',
          qosLevel: '0',
          payload: '',
        },
      ]);
    }
  };

  const qosLevelOptions = [
    { value: '0', label: '0 - At Most Once' },
    { value: '1', label: '1 - At Least Once' },
    { value: '2', label: '2 - Exactly Once' },
  ];

  return (
    <div className="grid-container">
      <div className='left-side-publish-page'>
        <div className="publish-container">
          <div className="publish-content">
            <h2 className="publish-title">Publish Page</h2>
            <form className="publish-form" onSubmit={handlePublish}>
              <div className="publish-inputs-scroll-container">
                {inputSets.map((inputSet, index) => (
                  <div key={index} className="publish-input-set">
                    <label className="exists-Broker-ip-header" htmlFor={`broker-${index}`}>
                      Broker IP
                    </label>
                    <select
                      className="publish-broker-ip-select" // Changed class name
                      id={`broker-${index}`}
                      value={inputSet.brokerId}
                      onChange={(e) => handleSelect(index, 'brokerId', e.target.value)}
                    >
                      <option value="" disabled>
                        Select Broker IP
                      </option>
                      {brokerOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <div className="publish-form-group">
                      <label htmlFor={`topic-${index}`} className="publish-form-label">
                        Topic {index + 1}
                      </label>
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
                      <label className="publish-form-label">QoS Level</label>
                      <div className="custom-dropdown">
                        <div
                          className="custom-dropdown-selected"
                          onClick={() => toggleDropdown(index, 'qosLevel')}
                        >
                          {qosLevelOptions.find((opt) => opt.value === inputSet.qosLevel)?.label || 'Select QoS Level'}
                          <span className="dropdown-arrow"></span>
                        </div>
                        {dropdownOpen[`${index}-qosLevel`] && (
                          <div className="custom-dropdown-options">
                            {qosLevelOptions.map((option) => (
                              <div
                                key={option.value}
                                className={`custom-dropdown-option ${
                                  option.value === inputSet.qosLevel ? 'selected-option' : ''
                                }`}
                                onClick={() => handleSelect(index, 'qosLevel', option.value)}
                              >
                                {option.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="publish-form-group">
                      <label htmlFor={`payload-${index}`} className="publish-form-label">
                        Payload
                      </label>
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
                <button type="submit" className="publish-submit-button">
                  Publish
                </button>
                <button type="button" className="publish-submit-button" onClick={handleClear}>
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Subscribe />
    </div>
  );
};

export default Publish;