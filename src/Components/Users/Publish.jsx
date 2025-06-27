import React, { useState, useEffect } from "react";
import "./Publish.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Subscribe = () => {
  const [inputSets, setInputSets] = useState([
    {
      brokerIp: "",
      topicFilter: "",
      qosLevel: "0",
      mqttUsername: "",
      mqttPassword: "",
    },
  ]);
  const [messages, setMessages] = useState([]);
  const [brokerOptions, setBrokerOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          console.error("No auth token found, redirecting to login");
          toast.error("Please log in to access brokers.");
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:5000/api/brokers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
          if (response.status === 401) {
            console.error("Unauthorized, clearing token and redirecting to login");
            localStorage.clear();
            toast.error("Session expired. Please log in again.");
            navigate("/");
            return;
          }
          throw new Error(errorMessage);
        }

        const brokers = await response.json();
        console.log("Fetched brokers:", brokers);

        if (!brokers || !Array.isArray(brokers) || brokers.length === 0) {
          console.warn("No brokers returned from the API or invalid data structure");
          toast.warn("No brokers available. Please add brokers in the admin page.");
          setBrokerOptions([{ value: "", label: "No Brokers Available" }]);
          return;
        }

        const options = brokers.map((broker) => ({
          value: broker.brokerIp,
          label: broker.brokerIp,
        }));
        console.log("Broker Options:", options);

        setBrokerOptions(options);
        setInputSets((prev) =>
          prev.map((set) => ({
            ...set,
            brokerIp: set.brokerIp || (options.length > 0 ? options[0].value : ""),
          }))
        );
      } catch (error) {
        console.error("Error fetching brokers:", error.message);
        toast.error("Failed to fetch brokers: " + error.message);
        setBrokerOptions([{ value: "", label: "Error Fetching Brokers" }]);
      }
    };

    fetchBrokers();
  }, [navigate]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          console.error("No auth token for fetching messages");
          toast.error("Please log in to fetch messages.");
          navigate("/");
          return;
        }
        const response = await fetch("http://localhost:5000/api/messages", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const result = await response.json();
        console.log("Fetched messages:", result.messages);
        if (response.ok) {
          setMessages(result.messages);
        } else {
          console.error("Failed to fetch messages:", result.message);
          toast.error("Failed to fetch messages: " + result.message);
        }
      } catch (error) {
        console.error("Error fetching messages:", error.message);
        toast.error("Error fetching messages: " + error.message);
      }
    };

    fetchMessages();
    const intervalId = setInterval(fetchMessages, 1000 * 60);
    return () => clearInterval(intervalId);
  }, [navigate]);

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
        brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
        topicFilter: "",
        qosLevel: "0",
        mqttUsername: "",
        mqttPassword: "",
      },
    ]);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    console.log("Subscribe Topics Submitted:", inputSets);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please log in to subscribe.");
      }

      for (const [index, set] of inputSets.entries()) {
        if (!set.brokerIp) {
          throw new Error(`Set ${index + 1}: Please select a broker IP`);
        }
        if (!set.topicFilter) {
          throw new Error(`Set ${index + 1}: Please enter a topic filter`);
        }
      }

      const response = await fetch("http://localhost:5000/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ inputSets }),
      });

      const result = await response.json();
      console.log("Subscribe Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to subscribe");
      }

      const summary = inputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Broker - ${set.brokerIp}, Topic Filter - ${set.topicFilter}, QoS Level - ${set.qosLevel}, Username - ${set.mqttUsername}, Password - ${set.mqttPassword ? "****" : ""}`
        )
        .join("\n");
      toast.success("Subscribed:\n" + summary);
    } catch (error) {
      console.error("Error subscribing:", error.message);
      toast.error(error.message);
    }
  };

  const handleClear = () => {
    if (inputSets.length > 1) {
      setInputSets(inputSets.slice(0, -1));
    } else {
      setInputSets([
        {
          brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
          topicFilter: "",
          qosLevel: "0",
          mqttUsername: "",
          mqttPassword: "",
        },
      ]);
    }
  };

  return (
    <div className="right-side-subscribe-page">
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
                          required
                          className="subscribe-broker-ip-select"
                          id={`broker-${index}`}
                          name="brokerIp"
                          value={inputSet.brokerIp}
                          onChange={(e) => handleChange(index, e)}
                        >
                          <option value="" disabled>
                            Select Broker IP
                          </option>
                          {brokerOptions.map((item) => (
                            <option key={item.value} value={item.value} disabled={item.value === ""}>
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
                      <div className="subscribe-form-group">
                        <label htmlFor={`mqttUsername-${index}`} className="subscribe-form-label">
                          MQTT Username
                        </label>
                        <input
                          className="subscribe-form-input"
                          type="text"
                          name="mqttUsername"
                          id={`mqttUsername-${index}`}
                          placeholder="Enter MQTT Username"
                          value={inputSet.mqttUsername}
                          onChange={(e) => handleChange(index, e)}
                        />
                      </div>
                      <div className="subscribe-form-group">
                        <label htmlFor={`mqttPassword-${index}`} className="subscribe-form-label">
                          MQTT Password
                        </label>
                        <input
                          className="subscribe-form-input"
                          type="password"
                          name="mqttPassword"
                          id={`mqttPassword-${index}`}
                          placeholder="Enter MQTT Password"
                          value={inputSet.mqttPassword}
                          onChange={(e) => handleChange(index, e)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="subscribe-buttons-container">
                  <button
                    type="button"
                    className="subscribe-add-task-button"
                    onClick={handleAddTopic}
                    disabled={brokerOptions[0]?.value === ""}
                  >
                    + Add Topic
                  </button>
                  <button
                    type="submit"
                    className="subscribe-submit-button"
                    disabled={brokerOptions[0]?.value === ""}
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
    </div>
  );
};

const Publish = () => {
  const [inputSets, setInputSets] = useState([
    {
      brokerIp: "",
      topic: "",
      qosLevel: "0",
      payload: "",
      mqttUsername: "",
      mqttPassword: "",
    },
  ]);
  const [publishing, setPublishing] = useState([]);
  const [publishStatuses, setPublishStatuses] = useState([]);
  const [brokerOptions, setBrokerOptions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          console.error("No auth token found, redirecting to login");
          toast.error("Please log in to access brokers.");
          navigate("/");
          return;
        }

        const response = await fetch("http://localhost:5000/api/brokers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
          if (response.status === 401) {
            console.error("Unauthorized, clearing token and redirecting to login");
            localStorage.clear();
            toast.error("Session expired. Please log in again.");
            navigate("/");
            return;
          }
          throw new Error(errorMessage);
        }

        const brokers = await response.json();
        console.log("Fetched brokers:", brokers);

        if (!brokers || !Array.isArray(brokers) || brokers.length === 0) {
          console.warn("No brokers returned from the API or invalid data structure");
          toast.warn("No brokers available. Please add brokers in the admin page.");
          setBrokerOptions([{ value: "", label: "No Brokers Available" }]);
          return;
        }

        const options = brokers.map((broker) => ({
          value: broker.brokerIp,
          label: broker.brokerIp,
        }));
        console.log("Broker Options:", options);

        setBrokerOptions(options);
        setInputSets((prev) =>
          prev.map((set) => ({
            ...set,
            brokerIp: set.brokerIp || (options.length > 0 ? options[0].value : ""),
          }))
        );
        setPublishing((prev) => (prev.length ? prev : Array(options.length).fill(false)));
        setPublishStatuses((prev) => (prev.length ? prev : Array(options.length).fill("")));
      } catch (error) {
        console.error("Error fetching brokers:", error.message);
        toast.error("Failed to fetch brokers: " + error.message);
        setBrokerOptions([{ value: "", label: "Error Fetching Brokers" }]);
      }
    };

    fetchBrokers();
  }, [navigate]);

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
        brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
        topic: "",
        qosLevel: "0",
        payload: "",
        mqttUsername: "",
        mqttPassword: "",
      },
    ]);
    setPublishing([...publishing, false]);
    setPublishStatuses([...publishStatuses, ""]);
  };

  const handlePublish = async (index) => {
    const { brokerIp, topic, qosLevel, payload, mqttUsername, mqttPassword } = inputSets[index];
    if (!brokerIp) {
      setPublishStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = "Please select a broker IP";
        return newStatuses;
      });
      toast.error("Please select a broker IP");
      return;
    }
    if (!topic) {
      setPublishStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = "Please enter a topic";
        return newStatuses;
      });
      toast.error("Please enter a topic");
      return;
    }
    if (!payload) {
      setPublishStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = "Please enter a payload";
        return newStatuses;
      });
      toast.error("Please enter a payload");
      return;
    }

    setPublishing((prev) => {
      const newPublishing = [...prev];
      newPublishing[index] = true;
      return newPublishing;
    });
    setPublishStatuses((prev) => {
      const newStatuses = [...prev];
      newStatuses[index] = "";
      return newStatuses;
    });

    try {
      const authToken = localStorage.getItem("authToken");
      console.log("Publishing with token:", authToken ? "Token present" : "No token");
      if (!authToken) {
        setPublishStatuses((prev) => {
          const newStatuses = [...prev];
          newStatuses[index] = "Please log in to publish.";
          return newStatuses;
        });
        toast.error("Please log in to publish.");
        navigate("/");
        return;
      }

      const payloadData = {
        brokerIp,
        topic,
        qosLevel: parseInt(qosLevel, 10),
        payload,
        mqttUsername: mqttUsername || "",
        mqttPassword: mqttPassword || "",
      };
      console.log("Publishing request payload:", payloadData);

      const response = await fetch("http://localhost:5000/api/pub/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payloadData),
      });

      const result = await response.json();
      console.log("Publish response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to publish");
      }

      const summary = `Published to topic "${topic}" on broker ${brokerIp}`;
      setPublishStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = summary;
        return newStatuses;
      });
      toast.success(summary);
    } catch (error) {
      console.error("Publish error:", error.message);
      const errorMessage = error.message.includes("Unauthorized") || error.message.includes("Session expired")
        ? "Unauthorized: Please log in again."
        : `Publish error: ${error.message}`;
      setPublishStatuses((prev) => {
        const newStatuses = [...prev];
        newStatuses[index] = errorMessage;
        return newStatuses;
      });
      toast.error(errorMessage);
      if (error.message.includes("Unauthorized") || error.message.includes("Session expired")) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setPublishing((prev) => {
        const newPublishing = [...prev];
        newPublishing[index] = false;
        return newPublishing;
      });
    }
  };

  const handleClear = () => {
    if (inputSets.length > 1) {
      setInputSets(inputSets.slice(0, -1));
      setPublishing(publishing.slice(0, -1));
      setPublishStatuses(publishStatuses.slice(0, -1));
    } else {
      setInputSets([
        {
          brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
          topic: "",
          qosLevel: "0",
          payload: "",
          mqttUsername: "",
          mqttPassword: "",
        },
      ]);
      setPublishing([false]);
      setPublishStatuses([""]);
    }
  };

  return (
    <div className="grid-container">
      <div className="left-side-publish-page">
        <div className="publish-container">
          <div className="publish-content">
            <h2 className="publish-title">Publish Page</h2>
            <form className="publish-form">
              <div className="publish-inputs-scroll-container">
                {inputSets.map((inputSet, index) => (
                  <div key={index} className="publish-input-set">
                    {publishStatuses[index] && <p className="publish-status">{publishStatuses[index]}</p>}
                    <div className="publish-form-group">
                      <label className="exists-Broker-ip-header" htmlFor={`broker-${index}`}>
                        Broker IP
                      </label>
                      <select
                        required
                        className="publish-broker-ip-selects"
                        id={`broker-${index}`}
                        name="brokerIp"
                        value={inputSet.brokerIp}
                        onChange={(e) => handleChange(index, e)}
                      >
                        <option value="" disabled>
                          Select Broker IP
                        </option>
                        {brokerOptions.map((item) => (
                          <option key={item.value} value={item.value} disabled={item.value === ""}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      <label htmlFor={`qosLevel-${index}`} className="publish-form-label">
                        QoS Level
                      </label>
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
                    <div className="publish-form-group">
                      <label htmlFor={`mqttUsername-${index}`} className="publish-form-label">
                        MQTT Username
                      </label>
                      <input
                        className="publish-form-input"
                        type="text"
                        name="mqttUsername"
                        id={`mqttUsername-${index}`}
                        placeholder="Enter MQTT Username"
                        value={inputSet.mqttUsername}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="publish-form-group">
                      <label htmlFor={`mqttPassword-${index}`} className="publish-form-label">
                        MQTT Password
                      </label>
                      <input
                        className="publish-form-input"
                        type="password"
                        name="mqttPassword"
                        id={`mqttPassword-${index}`}
                        placeholder="Enter MQTT Password"
                        value={inputSet.mqttPassword}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="publish-form-group">
                      <button
                        type="button"
                        className="publish-submit-button"
                        onClick={() => handlePublish(index)}
                        disabled={publishing[index] || inputSet.brokerIp === ""}
                      >
                        {publishing[index] ? "Publishing..." : "Publish"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="publish-buttons-container">
                <button
                  type="button"
                  className="publish-add-task-button"
                  onClick={handleAddTopic}
                  disabled={brokerOptions[0]?.value === ""}
                >
                  + Add Topic
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
      </div>
      <Subscribe />
    </div>
  );
};

export default Publish;