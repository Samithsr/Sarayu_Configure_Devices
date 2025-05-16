import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DisconnectModal from "../Components/DisconnectModel";

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
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [isResetClear, setIsResetClear] = useState(true); // Track clear vs. remove
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
    setError("");
    setSuccess("");

    if (isResetClear) {
      // First click: Clear the latest row's data
      const updatedForms = [...formBlocks];
      updatedForms[formBlocks.length - 1] = getDefaultFormData();
      setFormBlocks(updatedForms);
      setIsResetClear(false);
      toast.success("Row cleared!");
    } else {
      // Second click: Remove the latest row
      if (formBlocks.length > 1) {
        const updatedForms = formBlocks.slice(0, -1);
        setFormBlocks(updatedForms);
        setIsResetClear(true);
        toast.success("Row removed!");
      } else {
        toast.error("Cannot remove the last row!");
      }
    }
  };

  const handleAdd = () => {
    setError("");
    setSuccess("");
    setFormBlocks([...formBlocks, getDefaultFormData()]);
    setIsResetClear(true); // Reset to clear mode after adding
    setSuccess("New input row added!");
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
    setShowDisconnectModal(true);
  };

  const handleDisconnect = async () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      toast.error("Authentication token is missing. Please log in again.");
      navigate("/");
      setShowDisconnectModal(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerId}/disconnect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || "Failed to disconnect broker.");
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Broker disconnected successfully!");
      setShowDisconnectModal(false);
      navigate("/table");
    } catch (err) {
      console.error("Disconnect error:", err);
      toast.error(err.message || "An error occurred while disconnecting the broker.");
      setShowDisconnectModal(false);
    }
  };

  const handleDisconnectCancel = () => {
    setShowDisconnectModal(false);
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button" onClick={handlePublishClick}>
          Publish
        </button>
        <button className="dashboard-button">Subscribe</button>
        <button className="dashboard-button">Com Configuration</button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      <div className="dashboard-main">
        {showMain && (
          <>
            <h2>Com Configuration</h2>
            <div className="form-scroll-area" key={formKey}>
              <div className="table-wrapper">
                <table className="form-table">
                  <thead>
                    <tr>
                      <th>Tagname</th>
                      <th>Device ID</th>
                      <th>Slave Id</th>
                      <th>Function Code</th>
                      <th>Address</th>
                      <th>Length</th>
                      <th>Data Type</th>
                      <th>Scaling</th>
                      <th>Baud Rate</th>
                      <th>Data Bit</th>
                      <th>Parity</th>
                      <th>Stop Bit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formBlocks.map((formData, index) => (
                      <tr key={index}>
                        <td>
                          <input
                            type="text"
                            id="tag1"
                            value={formData.tag1}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag2"
                            value={formData.tag2}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag3"
                            value={formData.tag3}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag4"
                            value={formData.tag4}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag5"
                            value={formData.tag5}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag6"
                            value={formData.tag6}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
                          <select
                            id="tag7"
                            value={formData.tag7}
                            onChange={(e) => handleChange(index, e)}
                          >
                            <option value="int">int</option>
                            <option value="float">float</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            id="tag8"
                            value={formData.tag8}
                            onChange={(e) => handleChange(index, e)}
                          />
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <select
                            id="dataBit"
                            value={formData.dataBit}
                            onChange={(e) => handleChange(index, e)}
                          >
                            <option value="7">7</option>
                            <option value="8">8</option>
                          </select>
                        </td>
                        <td>
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
                        </td>
                        <td>
                          <select
                            id="stopBit"
                            value={formData.stopBit}
                            onChange={(e) => handleChange(index, e)}
                          >
                            <option value="1">1</option>
                            <option value="2">2</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="dashboard-form-buttons fixed-buttons">
              <button className="dashboard-action-button" onClick={handleBack}>
                Back
              </button>
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

      <DisconnectModal
        isOpen={showDisconnectModal}
        onConfirm={handleDisconnect}
        onCancel={handleDisconnectCancel}
      />
    </div>
  );
};

export default Dashboard;
