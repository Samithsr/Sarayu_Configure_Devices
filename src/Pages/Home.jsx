import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../Pages/LogoutModel";
import DeleteModal from "../Authentication/DeleteModel";
import EditModal from "../Authentication/EditModal";
import RightSideTable from "../Pages/RightSideTable";
import socket from "../Pages/Socket";

const Home = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [brokerToDelete, setBrokerToDelete] = useState(null);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
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
  const socketRef = useRef(socket);

  const isValidIPv4 = (ip) => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  useEffect(() => {
    socketRef.current.auth = { token: `Bearer ${localStorage.getItem("authToken")}` };
    socketRef.current.connect();

    socketRef.current.on("connect", () => {
      console.log("Socket.IO connected:", socketRef.current.id);
    });

    socketRef.current.on("error", ({ message }) => {
      console.error("Socket error:", message);
      setError(message);
      if (message.includes("Another session is active")) {
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

    socketRef.current.on("broker_updated", ({ broker }) => {
      setTableData((prev) =>
        prev.map((row) =>
          row.brokerId === broker._id
            ? {
                brokerId: broker._id,
                brokerip: broker.brokerIp || "N/A",
                port: broker.portNumber ? broker.portNumber.toString() : "N/A",
                user: broker.username || "N/A",
                password: broker.password ? "*".repeat(broker.password.length) : "N/A",
                rawPassword: broker.password || "",
                label: broker.label || "N/A",
                connectionStatus: broker.connectionStatus || "disconnected",
              }
            : row
        )
      );
      setSuccess(`Broker ${broker._id} updated successfully!`);
    });

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
          const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
          throw new Error(errorMessage);
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

    return () => {
      socketRef.current.off("connect");
      socketRef.current.off("error");
      socketRef.current.off("disconnect");
      socketRef.current.off("broker_status");
      socketRef.current.off("subscribed");
      socketRef.current.off("broker_updated");
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
      setError("Invalid IP address format.");
      return false;
    }
    if (!formData.portNumber) {
      setError("Port is required.");
      return false;
    }
    if (isNaN(formData.portNumber) || formData.portNumber < 1 || formData.portNumber > 65535) {
      setError("Port must be between 1 and 65535.");
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
        const errorMessage = await response.json().then((data) => data.message || "Broker is not available.");
        throw new Error(errorMessage);
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
        const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setStatus("");

      socketRef.current.emit("connect_broker", { brokerId: result._id });

      const dataResponse = await fetch("http://localhost:5000/api/brokers", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!dataResponse.ok) {
        const errorMessage = await dataResponse.json().then((data) => data.message || `HTTP error! status: ${dataResponse.status}`);
        throw new Error(errorMessage);
      }

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
    socketRef.current.emit("connect_broker", { brokerId: row.brokerId });
  };

  const handleEditClick = (row) => {
    setBrokerToEdit(row);
    setShowEditModal(true);
    setError(""); // Clear any previous errors
    setSuccess(""); // Clear any previous success messages
  };

  const handleEdit = async (updatedData) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication token is missing. Please log in again.");
      navigate("/");
      setShowEditModal(false);
      setBrokerToEdit(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerToEdit.brokerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: updatedData.brokerIp,
          portNumber: parseInt(updatedData.portNumber, 10),
          username: updatedData.username || "",
          password: updatedData.password || "",
          label: updatedData.label,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          setError("Session expired. Please log in again.");
          navigate("/");
          setShowEditModal(false);
          setBrokerToEdit(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to update broker (Status: ${response.status})`);
        throw new Error(errorMessage);
      }

      const updatedBroker = await response.json();
      socketRef.current.emit("broker_updated", { broker: updatedBroker });
      setShowEditModal(false);
      setBrokerToEdit(null);
    } catch (err) {
      console.error("Update error:", err);
      setError(err.message || "An error occurred while updating the broker.");
      setShowEditModal(false);
      setBrokerToEdit(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setBrokerToEdit(null);
    setError(""); // Clear errors on cancel
    setSuccess(""); // Clear success messages on cancel
  };

  const handleDeleteClick = (brokerId) => {
    setBrokerToDelete(brokerId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setError("Authentication token is missing. Please log in again.");
      navigate("/");
      setShowDeleteModal(false);
      setBrokerToDelete(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerToDelete}`, {
        method: "DELETE",
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
          setShowDeleteModal(false);
          setBrokerToDelete(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to delete broker (Status: ${response.status})`);
        throw new Error(errorMessage);
      }

      setTableData((prev) => prev.filter((row) => row.brokerId !== brokerToDelete));
      setSuccess("Broker deleted successfully!");
      setShowDeleteModal(false);
      setBrokerToDelete(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "An error occurred while deleting the broker.");
      setShowDeleteModal(false);
      setBrokerToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBrokerToDelete(null);
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
      <div className={`home-container ${showModal || showDeleteModal || showEditModal ? "blur-background" : ""}`}>
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

          <button>GetGateway</button>
        </div>
      </div>

      <LogoutModal isOpen={showModal} onConfirm={handleLogout} onCancel={handleCancel} />
      <DeleteModal isOpen={showDeleteModal} onConfirm={handleDelete} onCancel={handleDeleteCancel} />
      <EditModal
        isOpen={showEditModal}
        onConfirm={handleEdit}
        onCancel={handleEditCancel}
        broker={brokerToEdit}
      />
      <RightSideTable
        tableData={tableData.map((row) => ({
          ...row,
          connectionStatus: connectionStatuses[row.brokerId] || row.connectionStatus,
        }))}
        onAssign={handleAssign}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />
    </div>
  );
};

export default Home;