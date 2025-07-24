import React, { useState, useEffect } from "react";
import "./Publish.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";

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
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Please log in to connect.");
      navigate("/");
      return;
    }

    const newSocket = io("http://3.110.131.251:5000", {
      query: { token: authToken },
    });

    setSocket(newSocket);

    newSocket.on("error", (error) => {
      console.error("Socket.IO error:", error.message);
      toast.error(error.message || "Socket.IO connection error");
      if (error.message === "Unauthorized") {
        localStorage.clear();
        navigate("/");
      }
    });

    newSocket.on("mqtt_message", (message) => {
      console.log("Received MQTT message via Socket.IO:", message);
      setSubscribeInputSets((prev) =>
        prev.map((set) => {
          if (
            message.topic === set.topicFilter ||
            message.topic.startsWith(set.topicFilter.replace("#", ""))
          ) {
            return {
              ...set,
              messages: [...set.messages, message],
            };
          }
          return set;
        })
      );
    });

    return () => {
      newSocket.disconnect();
      console.log("Socket.IO disconnected");
    };
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
        const response = await fetch("http://3.110.131.251:5000/api/messages", {
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
              messages: result.messages.filter(
                (msg) =>
                  msg.topic === set.topicFilter ||
                  msg.topic.startsWith(set.topicFilter.replace("#", ""))
              ),
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
  }, [navigate]);

  const handleChange = (index, e) => {
    const newInputSets = [...subscribeInputSets];
    const selectedBroker = brokerOptions.find((b) => b.value === e.target.value);
    newInputSets[index] = {
      ...newInputSets[index],
      [e.target.name]: e.target.value,
      mqttUsername:
        e.target.name === "brokerIp" && selectedBroker
          ? selectedBroker.username
          : newInputSets[index].mqttUsername,
      mqttPassword:
        e.target.name === "brokerIp" && selectedBroker
          ? selectedBroker.password
          : newInputSets[index].mqttPassword,
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

      const response = await fetch("http://3.110.131.251:5000/api/subscribe", {
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

      const response = await fetch("http://3.110.131.251:5000/api/unsubscribe", {
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
          messages: [],
        }))
      );
      const summary = subscribeInputSets
        .map(
          (set, index) =>
            `Set ${index + 1}: Broker - ${set.brokerIp}, Topic Filter - ${set.topicFilter}`
        )
        .join("\n");
      toast.success("Unsubscribed:\n" + summary);
    } catch (error) {
      console.error("Error unsubscribing:", error.message);
      toast.error(error.message);
    }
  };

  const handleClear = () => {
    setSubscribeInputSets((prev) =>
      prev.map((set) => ({
        ...set,
        messages: [],
        topicFilter: "",
        qosLevel: "0",
      }))
    );
    setIsSubscribed(false);
  };

  return (
    <Col md={6} className="right-side-subscribe-page">
      <Card className="subscribe-topics-content">
        <Card.Header className="card-header" style={{ backgroundColor: "#4a5568", display: "flex", justifyContent: "center" }}>
          <h2 style={{color: "white"}} className="card-title">Subscribe Topics</h2>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="subscribe-content-wrapper">
            <div className="subscribe-form-wrapper">
              <Form
                className="subscribe-topics-form"
                onSubmit={isSubscribed ? handleUnsubscribe : handleSubscribe}
              >
                <div className="subscribe-inputs-container p-3">
                  {subscribeInputSets.map((inputSet, index) => (
                    <div key={index} className="subscribe-input-set mb-3">
                      <Form.Group className="mb-3">
                        <Form.Label>Broker IP</Form.Label>
                        <Form.Control
                          as="select"
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
                        </Form.Control>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Topic Filter {index + 1}</Form.Label>
                        <Form.Control
                          type="text"
                          name="topicFilter"
                          placeholder="Enter Topic Filter"
                          value={inputSet.topicFilter}
                          onChange={(e) => handleChange(index, e)}
                          disabled={isSubscribed}
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>QoS Level</Form.Label>
                        <Form.Control
                          as="select"
                          name="qosLevel"
                          value={inputSet.qosLevel}
                          onChange={(e) => handleChange(index, e)}
                          disabled={isSubscribed}
                        >
                          <option value="0">0 - At Most Once</option>
                          <option value="1">1 - At Least Once</option>
                          <option value="2">2 - Exactly Once</option>
                        </Form.Control>
                      </Form.Group>
                    </div>
                  ))}
                </div>
                <div className="subscribe-buttons-container px-4 d-flex justify-content-end">
                  <Button
                    type="submit"
                    variant={isSubscribed ? "secondary" : "primary"}
                    disabled={brokerOptions[0]?.value === ""}
                    className="mx-2"
                  >
                    {isSubscribed ? "Unsubscribe" : "Subscribe Topics"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </Form>
            </div>
            <div className="messages-wrapper" style={{padding: "14px"}}>
              <h3 style={{ color: "white" }} className="messages-title">Received Messages</h3>
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
        </Card.Body>
      </Card>
    </Col>
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

        const response = await fetch("http://3.110.131.251:5000/api/brokers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          const errorMessage = await response
            .json()
            .then((data) => data.message || `HTTP error! status: ${response.status}`);
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
            brokerIp: "",
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
      mqttUsername:
        e.target.name === "brokerIp" && selectedBroker
          ? selectedBroker.username
          : newInputSets[index].mqttUsername,
      mqttPassword:
        e.target.name === "brokerIp" && selectedBroker
          ? selectedBroker.password
          : newInputSets[index].mqttPassword,
    };
    setInputSets(newInputSets);
  };

  const handleAddTopic = () => {
    setInputSets([
      ...inputSets,
      {
        brokerIp: "",
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

        const response = await fetch("http://3.110.131.251:5000/api/pub/publish", {
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
          brokerIp: "",
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
    <Col md={6} className="left-side-publish-page">
      <Card className="publish-content">
        <Card.Header className="card-header" style={{ backgroundColor: "#4a5568", display: "flex", justifyContent: "center" }}>
          <h2 style={{color: "white"}} className="card-title style">Publish Page</h2>
        </Card.Header>
        <Card.Body className="p-0">
          <Form className="publish-form">
            <div className="publish-inputs-container p-3">
              {inputSets.map((inputSet, index) => (
                <div key={index} className="publish-input-set mb-3">
                  {publishStatuses[index] && (
                    <div className="alert alert-warning" role="alert">
                      {publishStatuses[index]}
                    </div>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>Broker IP</Form.Label>
                    <Form.Control
                      as="select"
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
                    </Form.Control>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Topic {index + 1}</Form.Label>
                    <Form.Control
                      type="text"
                      name="topic"
                      placeholder="Enter Topic"
                      value={inputSet.topic}
                      onChange={(e) => handleChange(index, e)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>QoS Level</Form.Label>
                    <Form.Control
                      as="select"
                      name="qosLevel"
                      value={inputSet.qosLevel}
                      onChange={(e) => handleChange(index, e)}
                    >
                      <option value="0">0 - At Most Once</option>
                      <option value="1">1 - At Least Once</option>
                      <option value="2">2 - Exactly Once</option>
                    </Form.Control>
                  </Form.Group>
                  <div className="publish-buttons-container p-2 d-flex justify-content-end">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handlePublish}
                      disabled={publishing.some((status) => status)}
                      className="mx-2"
                    >
                      {publishing.some((status) => status) ? "Publishing..." : "Publish"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={handleClear}>
                      Clear
                    </Button>
                  </div>
                  <Form.Group className="mb-3" style={{ marginTop: "30px", }}>
                    <Form.Label style={{ color: "white" }}>Payload</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="payload"
                      className="Payload-message py-5"
                      placeholder="Enter Payload (e.g., JSON data)"
                      value={inputSet.payload}
                      onChange={(e) => handleChange(index, e)}
                      style={{ backgroundColor: "#4a5568", color: "#ffffff", border: "none" }}
                    />
                  </Form.Group>
                </div>
              ))}
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Col>
  );
};

export default function App() {
  const [brokerOptions, setBrokerOptions] = useState([]);

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) {
          console.error("No auth token found");
          return;
        }

        const response = await fetch("http://3.110.131.251:5000/api/brokers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch brokers");
        }

        const brokers = await response.json();
        const options = brokers.map((broker) => ({
          value: broker.brokerIp,
          label: broker.brokerIp,
          username: broker.username || "",
          password: broker.password || "",
        }));
        setBrokerOptions(options);
      } catch (error) {
        console.error("Error fetching brokers:", error.message);
      }
    };

    fetchBrokers();
  }, []);

  return (
    <Container fluid className="grid-container p-0">
      <Row>
        <Publish />
        <Subscribe brokerOptions={brokerOptions} />
      </Row>
    </Container>
  );
}