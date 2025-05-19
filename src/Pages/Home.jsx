import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "./LogoutModel";
import DeleteModal from "../Authentication/DeleteModel";
import EditModal from "../Authentication/EditModal";
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
  const navigate = useNavigate();

  const isValidIPv4 = (ip) => {
    const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Regex.test(ip);
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    // Restrict access to admins only
    if (!authToken || !userId || !userRole) {
      toast.error("Authentication token, user ID, or role is missing. Please log in again.");
      navigate("/");
      return;
    }

    if (userRole !== "admin") {
      // If the user is not an admin, redirect to dashboard
      fetchFirstBroker(userId, authToken).then((broker) => {
        if (broker) {
          navigate("/dashboard", { state: { brokerId: broker.brokerId, userId } });
        } else {
          toast.error("No brokers found. Please contact an admin to add a broker.");
          localStorage.clear();
          navigate("/");
        }
      });
      return;
    }

    setUserEmail(localStorage.getItem("userEmail") || "User");
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

  // Helper function to fetch the first available broker for the user
  const fetchFirstBroker = async (userId, token) => {
    try {
      const response = await fetch("http://localhost:5000/api/brokers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch brokers");
      }

      const brokers = await response.json();
      if (brokers.length > 0) {
        return {
          brokerId: brokers[0]._id,
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching brokers:", err);
      toast.error("Error fetching brokers: " + err.message);
      return null;
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
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      return true;
    } catch (err) {
      toast.error(err.message || "Broker is not available. Please check the IP and port.");
      return false;
    }
  };

  const handleSubmit = async () => {
  toast.info('Testing broker availability...');

  if (!validateForm()) {
    return;
  }

  const isAvailable = await testBrokerAvailability();
  if (!isAvailable) {
    return;
  }

  toast.info('Connecting...');

  const authToken = localStorage.getItem('authToken');
  const userId = localStorage.getItem('userId');
  if (!authToken || !userId) {
    toast.error('Authentication token or user ID is missing. Please log in again.');
    navigate('/');
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
    const response = await fetch('http://localhost:5000/api/brokers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    toast.success(`Broker ${result._id} added successfully!`);

    // Fetch updated table data and navigate to RightSideTable
    const updatedTableData = await fetchTableData();
    navigate('/table', { state: { tableData: updatedTableData } });

    // Reset form
    setFormData({
      brokerIp: '',
      portNumber: '',
      username: '',
      password: '',
      label: '',
    });
  } catch (err) {
    console.error('Connection error:', err);
    toast.error(err.message || 'An error occurred while connecting to the broker.');
  }
};

const handleGetGateway = async () => {
  const tableData = await fetchTableData();
  navigate('/table', { state: { tableData } });
};
  const handleAssign = (row) => {
    const userId = localStorage.getItem("userId");
    toast.success("Broker assigned successfully.");
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
        if (response.status === 403) {
          const errorMessage = await response.json().then((data) => data.message || "Access denied: Insufficient permissions");
          toast.error(errorMessage);
          setShowEditModal(false);
          setBrokerToEdit(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to update broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerToEdit.brokerId} updated successfully!`);
      setShowEditModal(false);
      setBrokerToEdit(null);
      const updatedTableData = await fetchTableData();
      navigate("/table", { state: { tableData: updatedTableData } });
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
        if (response.status === 403) {
          const errorMessage = await response.json().then((data) => data.message || "Access denied: Insufficient permissions");
          toast.error(errorMessage);
          setShowDeleteModal(false);
          setBrokerToDelete(null);
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `Failed to delete broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerToDelete} deleted successfully!`);
      setShowDeleteModal(false);
      setBrokerToDelete(null);
      const updatedTableData = await fetchTableData();
      navigate("/table", { state: { tableData: updatedTableData } });
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