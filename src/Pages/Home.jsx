import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "./LogoutModel";
import DeleteModal from "../Authentication/DeleteModel";
import EditModal from "../Authentication/EditModal";
import socket from "../Pages/Socket";
import { toast } from "react-toastify";

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
      if (message.toLowerCase().includes("mqtt timed out") || message.toLowerCase().includes("etimedout")) {
        toast.error("Failed to connect to broker. Please check the details and try again.");
      } else {
        toast.error(message);
      }
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
        toast.success(`Broker ${brokerId} connected successfully!`);
        socketRef.current.emit("subscribe", { brokerId, topic: "default/topic" });
      } else if (status === "disconnected") {
        toast.error(`Broker ${brokerId} disconnected.`);
      }
    });

    socketRef.current.on("subscribed", ({ topic, brokerId }) => {
      toast.success(`Subscribed to topic ${topic} for broker ${brokerId}`);
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
      toast.success(`Broker ${broker._id} updated successfully!`);
    });

    socketRef.current.on("broker_deleted", ({ brokerId }) => {
      setTableData((prev) => prev.filter((row) => row.brokerId !== brokerId));
      toast.success(`Broker ${brokerId} deleted successfully!`);
    });

    return () => {
      socketRef.current.off("connect");
      socketRef.current.off("error");
      socketRef.current.off("disconnect");
      socketRef.current.off("broker_status");
      socketRef.current.off("subscribed");
      socketRef.current.off("broker_updated");
      socketRef.current.off("broker_deleted");
    };
  }, [navigate]);

  const fetchTableData = async () => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");

    if (!authToken || !userId) {
      toast.error("Authentication token or user ID is missing. Please log in again.");
      navigate("/");
      return [];
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
          toast.error("Session expired. Please log in again.");
          navigate("/");
          return [];
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
      return mappedData;
    } catch (err) {
      console.error("Error fetching table data:", err);
      toast.error(err.message || "An error occurred while fetching table data.");
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.brokerIp) {
      toast.error("Broker IP is required.");
      return false;
    }
    if (!isValidIPv4(formData.brokerIp)) {
      toast.error("Invalid IP address format.");
      return false;
    }
    if (!formData.portNumber) {
      toast.error("Port is required.");
      return false;
    }
    if (isNaN(formData.portNumber) || formData.portNumber < 1 || formData.portNumber > 65535) {
      toast.error("Port must be between 1 and 65535.");
      return false;
    }
    if (!formData.label) {
      toast.error("Label is required.");
      return false;
    }
    return true;
  };

  const testBrokerAvailability = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
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
        if (errorMessage.toLowerCase().includes("mqtt timed out") || errorMessage.toLowerCase().includes("etimedout")) {
          toast.error("Failed to connect to broker. Please check the details and try again.");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (err) {
      toast.error(err.message.toLowerCase().includes("mqtt timed out") || err.message.toLowerCase().includes("etimedout")
        ? "Failed to connect to broker. Please check the details and try again."
        : err.message || "Broker is not available. Please check the IP and port.");
      return false;
    }
  };

  const handleSubmit = async () => {
    toast.info("Testing broker availability...");

    if (!validateForm()) {
      return;
    }

    const isAvailable = await testBrokerAvailability();
    if (!isAvailable) {
      return;
    }

    toast.info("Connecting...");

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!authToken || !userId) {
      toast.error("Authentication token or user ID is missing. Please log in again.");
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
          toast.error("Session expired. Please log in again.");
          navigate("/");
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
        if (errorMessage.toLowerCase().includes("mqtt timed out") || errorMessage.toLowerCase().includes("etimedout")) {
          toast.error("Failed to connect to broker. Please check the details and try again.");
        } else {
          toast.error(errorMessage);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success(`Broker ${result._id} added successfully!`);

      socketRef.current.emit("connect_broker", { brokerId: result._id });

      const updatedTableData = await fetchTableData();
      navigate("/table", { state: { tableData: updatedTableData, connectionStatuses } });

      setFormData({
        brokerIp: "",
        portNumber: "",
        username: "",
        password: "",
        label: "",
      });
    } catch (err) {
      console.error("Connection error:", err);
      toast.error(err.message.toLowerCase().includes("mqtt timed out") || err.message.toLowerCase().includes("etimedout")
        ? "Failed to connect to broker. Please check the details and try again."
        : err.message || "An error occurred while connecting to the broker.");
    }
  };

  const handleGetGateway = async () => {
    const tableData = await fetchTableData();
    navigate("/table", { state: { tableData, connectionStatuses } });
  };

  const handleAssign = (row) => {
    const userId = localStorage.getItem("userId");
    toast.success("Broker assigned successfully.");
    socketRef.current.emit("connect_broker", { brokerId: row.brokerId });
    navigate("/dashboard", { state: { brokerId: row.brokerId, userId } });
  };

  const handleEditClick = (row) => {
    setBrokerToEdit(row);
    setShowEditModal(true);
  };

  const handleEdit = async (updatedData) => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
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
          toast.error("Session expired. Please log in again.");
          navigate("/");
          setShowEditModal(false);
          setBrokerToEdit(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to update broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const updatedBroker = await response.json();
      socketRef.current.emit("broker_updated", { broker: updatedBroker });
      setShowEditModal(false);
      setBrokerToEdit(null);
      const updatedTableData = await fetchTableData();
      navigate("/table", { state: { tableData: updatedTableData, connectionStatuses } });
    } catch (err) {
      console.error("Update error:", err);
      toast.error(err.message || "An error occurred while updating the broker.");
      setShowEditModal(false);
      setBrokerToEdit(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setBrokerToEdit(null);
  };

  const handleDeleteClick = (row) => {
    setBrokerToDelete(row.brokerId);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
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
          toast.error("Session expired. Please log in again.");
          navigate("/");
          setShowDeleteModal(false);
          setBrokerToDelete(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to delete broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      socketRef.current.emit("broker_deleted", { brokerId: brokerToDelete });
      setShowDeleteModal(false);
      setBrokerToDelete(null);
      const updatedTableData = await fetchTableData();
      navigate("/table", { state: { tableData: updatedTableData, connectionStatuses } });
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err.message || "An error occurred while deleting the broker.");
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
    <div className={`page-wrapper-left-side ${showModal || showDeleteModal || showEditModal ? "blur-background" : ""}`}>
      <div className="home-container">
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

          <button
            id="submitButton"
            type="button"
            onClick={handleSubmit}
            onKeyUp={(e) => e.key === "Enter" && handleSubmit()}
          >
            Connect
          </button>

          <button type="button" onClick={handleGetGateway}>
            GetGateway
          </button>
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
    </div>
  );
};

export default Home;