import React, { useState, useEffect } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../Pages/LogoutModel";
import Navbar from "../Pages/Navbar";
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTableData = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setError("Authentication token is missing. Please log in again.");
        navigate("/");
        return;
      }

      try {
        const response = await fetch(
          "http://ec2-43-204-109-20.ap-south-1.compute.amazonaws.com:5000/api/brokers",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        let dataArray = [];
        if (Array.isArray(data)) {
          dataArray = data;
        } else if (data && typeof data === "object") {
          if (data.data && Array.isArray(data.data)) {
            dataArray = data.data;
          } else {
            dataArray = [data];
          }
        }

        const mappedData = dataArray.map((item) => ({
          brokerip: item.brokerIp || "N/A",
          port: item.portNumber ? item.portNumber.toString() : "N/A",
          user: item.username || "N/A",
          password: item.password ? "*".repeat(item.password.length) : "N/A",
          rawPassword: item.password || "",
          label: item.label || "N/A",
        }));

        const uniqueData = Array.from(
          new Map(
            mappedData.map((item) => [
              `${item.brokerip}:${item.port}`,
              item,
            ])
          ).values()
        );
        setTableData(uniqueData);
      } catch (err) {
        console.error("Error fetching table data:", err);
        setError(err.message || "An error occurred while fetching table data.");
      }
    };

    fetchTableData();
  }, [navigate]);

  const handleInputChange = (e) => {
    setError("");
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
    if (!authToken) {
      setError("Authentication token is missing. Please log in again.");
      navigate("/");
      return;
    }

    const payload = {
      ...formData,
      portNumber: formData.portNumber
        ? parseInt(formData.portNumber, 10)
        : undefined,
    };

    try {
      const response = await fetch(
        "http://ec2-43-204-109-20.ap-south-1.compute.amazonaws.com:5000/api/brokers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      setSuccess("Successfully connected to the broker!");

      // Immediately navigate to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error("Error connecting to broker:", err);
      setError(
        err.message || "An error occurred while connecting to the broker."
      );
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
