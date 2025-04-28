import React, { useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";
import LogoutModal from "../Pages/LogoutModel";
import Navbar from "../Pages/Navbar";
import Table from "../Components/Table";

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
  const navigate = useNavigate();

  // Table data and pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const tableData = [
    { id: "01", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "02", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "03", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "04", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "05", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "06", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "07", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "08", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "09", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "10", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "11", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "12", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "13", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "14", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
    { id: "15", name: "Samith S R", email: "samithrgowda@gmail.com", phone: "987654321", visit: "Yes" },
  ];

  // Calculate pagination
  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

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
      setFormData({
        brokerIp: "",
        portNumber: "",
        username: "",
        password: "",
        label: "",
      });

      setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      console.error("Error connecting to broker:", err);
      setError(
        err.message || "An error occurred while connecting to the broker."
      );
    }
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

      <div className="unique-table-container">
        <div className="unique-table-scrollable">
          <table className="unique-table" style={{ marginTop: "30px" }}>
            <thead>
              <tr>
                <th>Broker IP</th>
                <th>Port Number</th>
                <th>Username</th>
                <th>Password</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((row, index) => (
                <tr key={index}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.visit}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="pagination-button"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`pagination-button ${currentPage === page ? "active" : ""}`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="pagination-button"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;