import React, { useState, useEffect } from "react";
import "./Publish.css";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Subscribe = ({ brokerOptions }) => {
  const navigate = useNavigate();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribeInputSets, setSubscribeInputSets] = useState([
    {
      brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
      topicFilter: "",
      qosLevel: "0",
      mqttUsername: brokerOptions.length > 0 ? brokerOptions[0].username : "",
      mqttPassword: brokerOptions.length > 0 ? brokerOptions[0].password : "",
      messages: [],
    },
  ]);

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
          setSubscribeInputSets((prev) =>
            prev.map((set) => ({
              ...set,
              messages: result.messages,
            }))
          );
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
    const newInputSets = [...subscribeInputSets];
    const selectedBroker = brokerOptions.find((b) => b.value === e.target.value);
    newInputSets[index] = {
      ...newInputSets[index],
      [e.target.name]: e.target.value,
      mqttUsername: e.target.name === "brokerIp" && selectedBroker ? selectedBroker.username : newInputSets[index].mqttUsername,
      mqttPassword: e.target.name === "brokerIp" && selectedBroker ? selectedBroker.password : newInputSets[index].mqttPassword,
    };
    setSubscribeInputSets(newInputSets);
  };

  const handleAddTopic = () => {
    setSubscribeInputSets([
      ...subscribeInputSets,
      {
        brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
        topicFilter: "",
        qosLevel: "0",
        mqttUsername: brokerOptions.length > 0 ? brokerOptions[0].username : "",
        mqttPassword: brokerOptions.length > 0 ? brokerOptions[0].password : "",
        messages: [],
      },
    ]);
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    console.log("Subscribe Topics Submitted:", subscribeInputSets);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please log in to subscribe.");
      }

      for (const [index, set] of subscribeInputSets.entries()) {
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
        body: JSON.stringify({ inputSets: subscribeInputSets }),
      });

      const result = await response.json();
      console.log("Subscribe Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to subscribe");
      }

      setIsSubscribed(true);
      const summary = subscribeInputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Broker - ${set.brokerIp}, Topic Filter - ${set.topicFilter}, QoS Level - ${set.qosLevel}`
        )
        .join("\n");
      toast.success("Subscribed:\n" + summary);
    } catch (error) {
      console.error("Error subscribing:", error.message);
      toast.error(error.message);
    }
  };

  const handleUnsubscribe = async (e) => {
    e.preventDefault();
    console.log("Unsubscribe Topics Submitted:", subscribeInputSets);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Please log in to unsubscribe.");
      }

      for (const [index, set] of subscribeInputSets.entries()) {
        if (!set.brokerIp) {
          throw new Error(`Set ${index + 1}: Please select a broker IP`);
        }
        if (!set.topicFilter) {
          throw new Error(`Set ${index + 1}: Please enter a topic filter`);
        }
      }

      const response = await fetch("http://localhost:5000/api/unsubscribe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ inputSets: subscribeInputSets }),
      });

      const result = await response.json();
      console.log("Unsubscribe Response:", result);

      if (!response.ok) {
        throw new Error(result.message || "Failed to unsubscribe");
      }

      setIsSubscribed(false);
      setSubscribeInputSets((prev) =>
        prev.map((set) => ({
          ...set,
          messages: [], // Clear messages on unsubscribe
        }))
      );
      const summary = subscribeInputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Broker - ${set.brokerIp}, Topic Filter - ${set.topicFilter}`
        )
        .join("\n classy");
      toast.success("Unsubscribed:\n" + summary);
    } catch (error) {
      console.error("Error unsubscribing:", error.message);
      toast.error(error.message);
    }
  };

  const handleClear = () => {
    if (subscribeInputSets.length > 1) {
      setSubscribeInputSets(subscribeInputSets.slice(0, -1));
    } else {
      setSubscribeInputSets([
        {
          brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
          topicFilter: "",
          qosLevel: "0",
          mqttUsername: brokerOptions.length > 0 ? brokerOptions[0].username : "",
          mqttPassword: brokerOptions.length > 0 ? brokerOptions[0].password : "",
          messages: [],
        },
      ]);
    }
    setIsSubscribed(false);
  };
return (
    <div className="right-side-subscribe-page">
      <div className="subscribe-topics-container">
        <div className="subscribe-topics-content">
          <div className="subscribe-content-wrapper">
            <div className="subscribe-form-wrapper">
              <h2 className="subscribe-topics-title">Subscribe Topics</h2>
              <form className="subscribe-topics-form" onSubmit={isSubscribed ? handleUnsubscribe : handleSubscribe}>
                <div className="subscribe-inputs-container"> {/* Updated class name */}
                  {subscribeInputSets.map((inputSet, index) => (
                    <div key={index} className="subscribe-input-set">
                      <div className="subscribe-form-group">
                        <label className="exists-Broker-ip-header" htmlFor={`broker-${index}`}>
                          Broker IP
                        </label>
                        <select
                          required
                          className="subscribe-form-input"
                          id={`broker-${index}`}
                          name="brokerIp"
                          value={inputSet.brokerIp}
                          onChange={(e) => handleChange(index, e)}
                          disabled={isSubscribed}
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
                          disabled={isSubscribed}
                        />
                      </div>
                      <div className="subscribe-form-group">
                        <label htmlFor={`qosLevel-${index}`} className="subscribe-form-label">
                          QoS Level
                        </label>
                        <select
                          required
                          className="subscribe-form-input"
                          name="qosLevel"
                          id={`qosLevel-${index}`}
                          value={inputSet.qosLevel}
                          onChange={(e) => handleChange(index, e)}
                          disabled={isSubscribed}
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
                    disabled={brokerOptions[0]?.value === "" || isSubscribed}
                  >
                    Add Topic
                  </button>
                  <button
                    type="submit"
                    className={`subscribe-submit-button ${isSubscribed ? "unsubscribe" : ""}`}
                    disabled={brokerOptions[0]?.value === ""}
                  >
                    {isSubscribed ? "Unsubscribe" : "Subscribe Topics"}
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
              <h3 className="messages-title">Received Messages</h3> {/* Fixed typo */}
              <div className="messages-scroll-container">
                {subscribeInputSets.some((set) => set.messages?.length > 0) ? (
                  <ul className="messages-list">
                    {subscribeInputSets
                      .flatMap((set) => set.messages || [])
                      .map((msg, index) => (
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
                ) : (
                  <p className="no-messages">No messages received yet.</p>
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
          username: broker.username || "",
          password: broker.password || "",
        }));
        console.log("Broker Options:", options);

        setBrokerOptions(options);
        setInputSets((prev) =>
          prev.map((set) => ({
            ...set,
            brokerIp: set.brokerIp || (options.length > 0 ? options[0].value : ""),
            mqttUsername: set.mqttUsername || (options.length > 0 ? options[0].username : ""),
            mqttPassword: set.mqttPassword || (options.length > 0 ? options[0].password : ""),
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
    const selectedBroker = brokerOptions.find((b) => b.value === e.target.value);
    newInputSets[index] = {
      ...newInputSets[index],
      [e.target.name]: e.target.value,
      mqttUsername: e.target.name === "brokerIp" && selectedBroker ? selectedBroker.username : newInputSets[index].mqttUsername,
      mqttPassword: e.target.name === "brokerIp" && selectedBroker ? selectedBroker.password : newInputSets[index].mqttPassword,
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
        mqttUsername: brokerOptions.length > 0 ? brokerOptions[0].username : "",
        mqttPassword: brokerOptions.length > 0 ? brokerOptions[0].password : "",
      },
    ]);
    setPublishing([...publishing, false]);
    setPublishStatuses([...publishStatuses, ""]);
  };

  const handlePublish = async () => {
    let hasError = false;
    const newPublishStatuses = [...publishStatuses];
    const newPublishing = [...publishing];

    for (let index = 0; index < inputSets.length; index++) {
      const { brokerIp, topic, qosLevel, payload, mqttUsername, mqttPassword } = inputSets[index];

      if (!brokerIp) {
        newPublishStatuses[index] = "Please select a broker IP";
        toast.error(`Set ${index + 1}: Please select a broker IP`);
        hasError = true;
        continue;
      }
      if (!topic) {
        newPublishStatuses[index] = "Please enter a topic";
        toast.error(`Set ${index + 1}: Please enter a topic`);
        hasError = true;
        continue;
      }
      if (!payload) {
        newPublishStatuses[index] = "Please enter a payload";
        toast.error(`Set ${index + 1}: Please enter a payload`);
        hasError = true;
        continue;
      }

      newPublishing[index] = true;
      newPublishStatuses[index] = "";
    }

    setPublishing(newPublishing);
    setPublishStatuses(newPublishStatuses);

    if (hasError) {
      setPublishing(newPublishing.map(() => false));
      return;
    }

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setPublishStatuses(inputSets.map((_, index) => `Set ${index + 1}: Please log in to publish.`));
        toast.error("Please log in to publish.");
        navigate("/");
        return;
      }

      for (let index = 0; index < inputSets.length; index++) {
        const { brokerIp, topic, qosLevel, payload, mqttUsername, mqttPassword } = inputSets[index];

        const payloadData = {
          brokerIp,
          topic,
          qosLevel: parseInt(qosLevel, 10),
          payload,
          mqttUsername: mqttUsername || "",
          mqttPassword: mqttPassword || "",
        };
        console.log(`Publishing request payload for set ${index + 1}:`, payloadData);

        const response = await fetch("http://localhost:5000/api/pub/publish", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payloadData),
        });

        const result = await response.json();
        console.log(`Publish response for set ${index + 1}:`, result);

        if (!response.ok) {
          throw new Error(`Set ${index + 1}: ${result.message || "Failed to publish"}`);
        }

        newPublishStatuses[index] = `Published to topic "${topic}" on broker ${brokerIp}`;
        toast.success(`Set ${index + 1}: Published to topic "${topic}" on broker ${brokerIp}`);
      }

      setPublishStatuses(newPublishStatuses);
    } catch (error) {
      console.error("Publish error:", error.message);
      const errorMessage = error.message.includes("Unauthorized") || error.message.includes("Session expired")
        ? "Unauthorized: Please log in again."
        : error.message;
      setPublishStatuses(inputSets.map((_, index) => errorMessage));
      toast.error(errorMessage);
      if (error.message.includes("Unauthorized") || error.message.includes("Session expired")) {
        localStorage.clear();
        navigate("/");
      }
    } finally {
      setPublishing(inputSets.map(() => false));
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
          mqttUsername: brokerOptions.length > 0 ? brokerOptions[0].username : "",
          mqttPassword: brokerOptions.length > 0 ? brokerOptions[0].password : "",
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
                        className="publish-form-input"
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
                  </div>
                ))}
              </div>
              <div className="publish-buttons-container">
                <button
                  type="button"
                  className="publish-submit-button"
                  onClick={handlePublish}
                  disabled={publishing.some((status) => status) || inputSets.some((set) => !set.brokerIp)}
                >
                  {publishing.some((status) => status) ? "Publishing..." : "Publish"}
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
      <Subscribe brokerOptions={brokerOptions} />
    </div>
  );
};

export default Publish;