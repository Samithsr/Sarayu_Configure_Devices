import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../Pages/LogoutModel";
import RightSideTable from "../Pages/RightSideTable";
import io from "socket.io-client";

// Initialize socket outside component to ensure single instance
const socket = io("http://localhost:5000", {
  auth: { token: `Bearer ${localStorage.getItem("authToken")}` },
  autoConnect: false, // Prevent auto-connect until component mounts
});

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    brokerIp: "",
    portNumber: "",
    username: "",
    password: "",
    label: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [tableData, setTableData] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState({});
  const navigate = useNavigate();
  const socketRef = useRef(socket); // Use ref to maintain socket instance

  // Validate IPv4 address
  const isValidIPv4 = (ip) => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  useEffect(() => {
    // Update socket auth token in case it changes
    socketRef.current.auth.token = `Bearer ${localStorage.getItem("authToken")}`;

    // Connect socket only once on mount
    socketRef.current.connect();

    // Socket event handlers
    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected:", socketRef.current.id);
    });

    socketRef.current.on("error", ({ message }) => {
      console.error("Socket error:", message);
      setError(message);
      if (message.includes("Another session is active")) {
        // Stop further connection attempts and alert user
        socketRef.current.disconnect();
        alert("Another session is active. Please close other tabs or sessions and try again.");
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("Socket.IO disconnected");
    });

    socketRef.current.on("broker_status", ({ brokerId, status }) => {
      setConnectionStatuses((prev) => ({ ...prev, [brokerId]: status }));
      setTableData((prev) =>
        prev.map((row) =>
          row.brokerId === brokerId ? { ...row, connectionStatus: status } : row
        )
      );
      if (status === "connected") {
        setSuccess(`Broker ${brokerId} connected successfully!`);
        socketRef.current.emit("subscribe", { brokerId, topic: "default/topic" });
      } else if (status === "disconnected") {
        setError(`Broker ${brokerId} disconnected.`);
      }
    });

    socketRef.current.on("subscribed", ({ topic, brokerId }) => {
      setSuccess(`Subscribed to topic ${topic} for broker ${brokerId}`);
    });

    // Fetch table data
    const fetchTableData = async () => {
      const authToken = localStorage.getItem("authToken");
      const userId = localStorage.getItem("userId");
      const email = localStorage.getItem("userEmail");

      if (!authToken || !userId) {
        setError("Authentication token or user ID is missing. Please log in again.");
        navigate("/");
        return;
      }

      setUserEmail(email || "User");

      try {
        const response = await fetch("http://localhost:5000/api/brokers", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.clear();
            setError("Session expired. Please log in again.");
            navigate("/");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const mappedData = data.map((item) => ({
          brokerId: item._id,
          brokerip: item.brokerIp || "N/A",
          port: item.portNumber ? item.portNumber.toString() : "N/A",
          user: item.username || "N/A",
          password: item.password ? "*".repeat(item.password.length) : "N/A",
          rawPassword: item.password || "",
          label: item.label || "N/A",
          connectionStatus: item.connectionStatus || "disconnected",
        }));

        setTableData(mappedData);
      } catch (err) {
        console.error("Error fetching table data:", err);
        setError(err.message || "An error occurred while fetching table data.");
      }
    };

    fetchTableData();

    // Cleanup on unmount
    return () => {
      socketRef.current.off("connect");
      socketRef.current.off("error");
      socketRef.current.off("disconnect");
      socketRef.current.off("broker_status");
      socketRef.current.off("subscribed");
      socketRef.current.disconnect();
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    setError("");
    setSuccess("");
    setStatus("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.brokerIp) {
      setError("Broker IP is required.");
      return false;
    }
    if (!isValidIPv4(formData.brokerIp)) {
      setError("Invalid IP address format. Please enter a valid IPv4 address (e.g., 192.168.1.100).");
      return false;
    }
    if (!formData.portNumber) {
      setError("Port is required.");
      return false;
    }
    if (isNaN(formData.portNumber) || formData.portNumber < 1 || formData.portNumber > 65535) {
      setError("Port must be a number between 1 and 65535.");
      return false;
    }
    if (!formData.label) {
      setError("Label is required.");
      return false;
    }
    return true;
  };

  const testBrokerAvailability = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication token is missing. Please log in again.");
      return false;
    }

    try {
      const response = await fetch("http://localhost:5000/api/test-broker", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: formData.brokerIp,
          portNumber: parseInt(formData.portNumber, 10),
          username: formData.username || undefined,
          password: formData.password || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Broker is not available: ${errorData.error || "Unknown error"}`);
      }

      return true;
    } catch (err) {
      setError(err.message || "Broker is not available. Please check the IP and port.");
      return false;
    }
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setStatus("Testing broker availability...");

    if (!validateForm()) {
      setStatus("");
      return;
    }

    const isAvailable = await testBrokerAvailability();
    if (!isAvailable) {
      setStatus("");
      return;
    }

    setStatus("Connecting...");

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!authToken || !userId) {
      setError("Authentication token or user ID is missing. Please log in again.");
      setStatus("");
      navigate("/");
      return;
    }

    const payload = {
      brokerIp: formData.brokerIp,
      portNumber: parseInt(formData.portNumber, 10),
      username: formData.username || undefined,
      password: formData.password || undefined,
      label: formData.label,
    };

    try {
      const response = await fetch("http://localhost:5000/api/brokers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          setError("Session expired. Please log in again.");
          setStatus("");
          navigate("/");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStatus("");

      // Emit connect_broker event to initiate MQTT connection
      socketRef.current.emit("connect_broker", { brokerId: result._id });

      const dataResponse = await fetch("http://localhost:5000/api/brokers", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await dataResponse.json();
      const mappedData = data.map((item) => ({
        brokerId: item._id,
        brokerip: item.brokerIp || "N/A",
        port: item.portNumber ? item.portNumber.toString() : "N/A",
        user: item.username || "N/A",
        password: item.password ? "*".repeat(item.password.length) : "N/A",
        rawPassword: item.password || "",
        label: item.label || "N/A",
        connectionStatus: item.connectionStatus || "disconnected",
      }));
      setTableData(mappedData);

      navigate("/dashboard", { state: { brokerId: result._id, userId } });
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "An error occurred while connecting to the broker.");
      setStatus("");
    }
  };

  const handleAssign = (row) => {
    setFormData({
      brokerIp: row.brokerip !== "N/A" ? row.brokerip : "",
      portNumber: row.port !== "N/A" ? row.port : "",
      username: row.user !== "N/A" ? row.user : "",
      password: row.rawPassword,
      label: row.label !== "N/A" ? row.label : "",
    });
    // Emit connect_broker event for existing broker
    socketRef.current.emit("connect_broker", { brokerId: row.brokerId });
  };

  const handleLogoutClick = () => setShowModal(true);
  const handleLogout = () => {
    socketRef.current.disconnect();
    localStorage.clear();
    setShowModal(false);
    navigate("/");
  };
  const handleCancel = () => setShowModal(false);

  const handleKeyDown = (e, nextFieldId) => {
    if (e.key === "Enter") {
      document.getElementById(nextFieldId)?.focus();
    }
  };

  return (
    <div className="page-wrapper-left-side">
      <div className={`home-container ${showModal ? "blur-background" : ""}`}>
        <div className="broker-form">
          <div className="form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              value={formData.brokerIp}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "portNumber")}
              placeholder="e.g., 192.168.1.100"
            />
          </div>
          <div className="form-group">
            <label htmlFor="portNumber">Port *:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              value={formData.portNumber}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "username")}
              min="1"
              max="65535"
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "password")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "label")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="label">Label *:</label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "submitButton")}
            />
          </div>

          {status && <p className="status-message">{status}</p>}
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}

          <button
            id="submitButton"
            type="button"
            onClick={handleSubmit}
            onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
          >
            Connect
          </button>
        </div>
      </div>

      <LogoutModal isOpen={showModal} onConfirm={handleLogout} onCancel={handleCancel} />
      <RightSideTable
        tableData={tableData.map((row) => ({
          ...row,
          connectionStatus: connectionStatuses[row.brokerId] || row.connectionStatus,
        }))}
        onAssign={handleAssign}
      />
    </div>
  );
};

export default Home;