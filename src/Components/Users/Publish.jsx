import React, { useState, useEffect } from 'react';
import './Publish.css';
import { toast } from 'react-toastify';
import axios from "axios";

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
    <div className="publish-container">
      <div className="publish-content">
        <h2 className="publish-title">Publish Page</h2>
        <form className="publish-form" onSubmit={handlePublish}>
          {/* Container for input sets; no longer scrollable, grows dynamically */}
          <div className="publish-inputs-scroll-container">
            {inputSets.map((inputSet, index) => (
              <div key={index} className="publish-input-set">
                <label className="exists-Broker-ip-header" htmlFor={`broker-${index}`}>
                  Broker IP
                </label>
                <select
                  className="exists-Broker-ip"
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
            <button type="button" className="publish-add-task-button" onClick={handleAddTopic}>
              + Add Topic
            </button>
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
  );
};

export default Publish;