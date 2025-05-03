import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../Pages/LogoutModel";
import RightSideTable from "../Pages/RightSideTable";

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
  const [tableData, setTableData] = useState([]);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
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
            localStorage.removeItem("authToken");
            localStorage.removeItem("userId");
            localStorage.removeItem("userEmail");
            setError("Session expired. Please log in again.");
            navigate("/");
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const mappedData = data.map((item) => ({
          brokerip: item.brokerIp || "N/A",
          port: item.portNumber ? item.portNumber.toString() : "N/A",
          user: item.username || "N/A",
          password: item.password ? "*".repeat(item.password.length) : "N/A",
          rawPassword: item.password || "",
          label: item.label || "N/A",
        }));

        setTableData(mappedData);
      } catch (err) {
        console.error("Error fetching table data:", err);
        setError(err.message || "An error occurred while fetching table data.");
      }
    };

    fetchTableData();
  }, [navigate]);

  const handleInputChange = (e) => {
    setError("");
    setSuccess("");
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.brokerIp) {
      setError("Broker IP is required.");
      return false;
    }
    if (!formData.portNumber) {
      setError("Port is required.");
      return false;
    }
    if (!formData.label) {
      setError("Label is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");
    if (!authToken || !userId) {
      setError("Authentication token or user ID is missing. Please log in again.");
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
          localStorage.removeItem("authToken");
          localStorage.removeItem("userId");
          localStorage.removeItem("userEmail");
          setError("Session expired. Please log in again.");
          navigate("/");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSuccess("Successfully connected to the broker!");

      // Refresh table data
      const fetchTableData = async () => {
        try {
          const response = await fetch("http://localhost:5000/api/brokers", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const mappedData = data.map((item) => ({
            brokerip: item.brokerIp || "N/A",
            port: item.portNumber ? item.portNumber.toString() : "N/A",
            user: item.username || "N/A",
            password: item.password ? "*".repeat(item.password.length) : "N/A",
            rawPassword: item.password || "",
            label: item.label || "N/A",
          }));
          setTableData(mappedData);
        } catch (err) {
          console.error("Error refreshing table data:", err);
        }
      };

      await fetchTableData();
      navigate("/dashboard", { state: { brokerId: result._id, userId } });
    } catch (err) {
      console.error("Error connecting to broker:", err);
      setError(err.message || "An error occurred while connecting to the broker.");
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
  };

  const handleLogoutClick = () => {
    setShowModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    setShowModal(false);
    navigate("/");
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const handleKeyDown = (e, nextFieldId) => {
    if (e.key === "Enter") {
      document.getElementById(nextFieldId).focus();
    }
  };

  return (
    <div className="page-wrapper-left-side">
      <div className={`home-container ${showModal ? "blur-background" : ""}`}>
        <div className="user-info" style={{ marginBottom: '20px', textAlign: 'center' }}>
          {/* <h3>Welcome, {userEmail}</h3> */}
        </div>
        <div className="broker-form">
          <div className="form-group">
            <label htmlFor="brokerIp">Broker IP *:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              placeholder="Enter broker IP"
              value={formData.brokerIp}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "portNumber")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="portNumber">Port *:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              placeholder="Enter port number"
              value={formData.portNumber}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "username")}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
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
              placeholder="Enter password"
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
              placeholder="Enter Label"
              value={formData.label}
              onChange={handleInputChange}
              onKeyUp={(e) => handleKeyDown(e, "submitButton")}
            />
          </div>
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

      <LogoutModal
        isOpen={showModal}
        onConfirm={handleLogout}
        onCancel={handleCancel}
      />

      <RightSideTable tableData={tableData} onAssign={handleAssign} />
    </div>
  );
};

export default Home;