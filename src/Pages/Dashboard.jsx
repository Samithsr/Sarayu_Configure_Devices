import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const getDefaultFormData = () => ({
  tag1: "",
  tag2: "",
  tag3: "",
  tag4: "",
  tag5: "",
  tag6: "",
  tag7: "int",
  tag8: "",
  baudRate: "115200",
  dataBit: "8",
  parity: "none",
  stopBit: "1",
});

const Dashboard = () => {
  const [formBlocks, setFormBlocks] = useState([getDefaultFormData()]);
  const [formKey, setFormKey] = useState(0);
  const [showMain, setShowMain] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [topicName, setTopicName] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerId, userId } = location.state || {};

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const storedUserId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");

    if (!authToken || !storedUserId || !brokerId || storedUserId !== userId) {
      setError("Authentication token, user ID, or broker ID is missing. Please log in again.");
      navigate("/");
      return;
    }

    setUserEmail(email || "User");
  }, [navigate, brokerId, userId]);

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [success]);

  const handleChange = (index, e) => {
    const { id, value } = e.target;
    const updatedForms = [...formBlocks];
    updatedForms[index][id] = value;
    setFormBlocks(updatedForms);
    setError("");
    setSuccess("");
  };

  const handleReset = () => {
    const updatedForms = [...formBlocks];
    updatedForms[formBlocks.length - 1] = getDefaultFormData();
    setFormBlocks(updatedForms);
    setError("");
    setSuccess("");
  };

  const handleAdd = () => {
    setError("");
    setSuccess("");
    setFormBlocks([...formBlocks, getDefaultFormData()]);
    setSuccess("New form block added!");
  };

  const handlePublish = async (e) => {
    e.stopPropagation();
    console.log("handlePublish called");

    setError("");
    setSuccess("");

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!authToken || !userId) {
      setError("Authentication token or user ID is missing. Please log in again.");
      navigate("/");
      return;
    }

    if (!topicName.trim()) {
      setError("Please enter a topic name before publishing.");
      return;
    }

    const isValid = formBlocks.every((block) =>
      Object.values(block).every((value) => value !== "")
    );

    if (!isValid) {
      setError("Please fill in all fields before publishing.");
      return;
    }

    const publishData = formBlocks.reduce(
      (acc, formBlock) => [
        ...acc,
        formBlock.tag1,
        formBlock.tag2,
        formBlock.tag3,
        formBlock.tag4,
        formBlock.tag5,
        formBlock.tag6,
        formBlock.tag7,
        formBlock.tag8,
        formBlock.baudRate,
        formBlock.dataBit,
        formBlock.parity,
        formBlock.stopBit,
      ],
      []
    );

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          topic: topicName.trim(),
          message: JSON.stringify(publishData),
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || "Failed to publish message.");
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setSuccess(`Published configurations to topic ${topicName}`);
    } catch (err) {
      console.error("Publish error:", err);
      setError(err.message || "An error occurred while publishing the message.");
    }
  };

  const handlePublishClick = (e) => {
    e.stopPropagation();
    console.log("handlePublishClick called");
    setShowMain(true);
    setError("");
    setSuccess("");
  };

  const handleBack = (e) => {
    e.stopPropagation();
    console.log("handleBack called");
    navigate("/table");
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button" onClick={handlePublishClick}>
          Publish
        </button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Con Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      <div className="dashboard-main">
        <div className="status-bar">
          <button className="back-button" onClick={handleBack}>
            Back
          </button>
        </div>
        {showMain && (
          <>
            <h2>Com Configuration</h2>
            <div className="form-scroll-area" key={formKey}>
              {formBlocks.map((formData, index) => (
                <div key={index} className={`form-block ${index !== 0 ? "form-block-margin" : ""}`}>
                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="tag1">Tagname:</label>
                      <input
                        type="text"
                        id="tag1"
                        value={formData.tag1}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag2">Device ID</label>
                      <input
                        type="text"
                        id="tag2"
                        value={formData.tag2}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag3">Slave Id</label>
                      <input
                        type="text"
                        id="tag3"
                        value={formData.tag3}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag4">Function Code</label>
                      <input
                        type="text"
                        id="tag4"
                        value={formData.tag4}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="tag5">Address</label>
                      <input
                        type="text"
                        id="tag5"
                        value={formData.tag5}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag6">Length</label>
                      <input
                        type="text"
                        id="tag6"
                        value={formData.tag6}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag7">Data Type</label>
                      <select
                        id="tag7"
                        value={formData.tag7}
                        onChange={(e) => handleChange(index, e)}
                      >
                        <option value="int">int</option>
                        <option value="float">float</option>
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="tag8">Scaling</label>
                      <input
                        type="text"
                        id="tag8"
                        value={formData.tag8}
                        onChange={(e) => handleChange(index, e)}
                      />
                    </div>
                  </div>

                  <div className="dashboard-form-horizontal">
                    <div className="dashboard-form-group">
                      <label htmlFor="baudRate">Baud Rate</label>
                      <select
                        id="baudRate"
                        value={formData.baudRate}
                        onChange={(e) => handleChange(index, e)}
                      >
                        {[
                          110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600,
                          115200, 230400, 460800, 921600,
                        ].map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="dataBit">Data Bit</label>
                      <select
                        id="dataBit"
                        value={formData.dataBit}
                        onChange={(e) => handleChange(index, e)}
                      >
                        <option value="7">7</option>
                        <option value="8">8</option>
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="parity">Parity</label>
                      <select
                        id="parity"
                        value={formData.parity}
                        onChange={(e) => handleChange(index, e)}
                      >
                        {["none", "even", "odd", "mark", "space"].map((val) => (
                          <option key={val} value={val}>
                            {val}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="dashboard-form-group">
                      <label htmlFor="stopBit">Stop Bit</label>
                      <select
                        id="stopBit"
                        value={formData.stopBit}
                        onChange={(e) => handleChange(index, e)}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-form-buttons fixed-buttons">
              <button className="dashboard-action-button" onClick={handleReset}>
                Reset
              </button>
              <button className="dashboard-action-button" onClick={handleAdd}>
                Add+
              </button>
            </div>

            <div className="dashboard-topic-name">
              <input
                type="text"
                id="topicName"
                placeholder="Enter Topic Name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
              />
              <button onClick={handlePublish}>Publish</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;