
import React, { useState, useEffect } from "react";
import "./Dashboard.css";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DisconnectModal from "../Components/DisconnectModel";
import ComConfiguration from "../Components/Users/ComConfiguration";

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
  Delay: "",
});

const Dashboard = () => {
  const [formBlocks, setFormBlocks] = useState([getDefaultFormData()]);
  const [formKey, setFormKey] = useState(0);
  const [isResetClear, setIsResetClear] = useState(true);
  const [showMain, setShowMain] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [topicName, setTopicName] = useState("");
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole"));
  const location = useLocation();
  const navigate = useNavigate();
  const { brokerId: initialBrokerId, userId } = location.state || {};
  const [brokerId, setBrokerId] = useState(initialBrokerId);

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const storedUserId = localStorage.getItem("userId");
    const email = localStorage.getItem("userEmail");
    const storedUserRole = localStorage.getItem("userRole");

    if (
      !authToken ||
      !storedUserId ||
      storedUserId !== userId ||
      !storedUserRole
    ) {
      setError(
        "Authentication token, user ID, or role is missing. Please log in again."
      );
      navigate("/");
      return;
    }

    setUserRole(storedUserRole);
    setUserEmail(email || "User");

    // Fetch assigned broker
    fetchAssignedBroker(storedUserId, authToken).then((broker) => {
      if (broker) {
        if (initialBrokerId && broker.brokerId !== initialBrokerId) {
          setError("Assigned broker does not match provided broker ID.");
          navigate("/");
          return;
        }
        console.log("Assigned broker:", broker);
        setBrokerId(broker.brokerId);
        setBrokerStatus(broker.connectionStatus || "unknown");
      } else {
        if (storedUserRole === "admin") {
          setError("Admins cannot publish; please assign a user.");
          navigate("/table");
        } else {
          setError("No brokers assigned. Please contact an admin.");
          navigate("/");
        }
      }
    });

    // Polling for broker status (non-admins only)
    let intervalId;
    if (storedUserRole !== "admin" && brokerId) {
      const fetchBrokerStatus = async () => {
        try {
          console.log(`Fetching status for brokerId: ${brokerId}`);
          const response = await fetch(
            `http://localhost:5000/api/brokers/${brokerId}/status`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || `Failed to fetch broker status (HTTP ${response.status})`
            );
          }

          const data = await response.json();
          console.log("Broker status response:", data);

          // Adjust based on actual API response structure
          const status = data.status || data.connectionStatus || "unknown";

          if (status === "undefined" || status == null) {
            console.warn(`Invalid status for broker ${brokerId}: ${status}`);
            return;
          }

          if (status !== brokerStatus) {
            console.log(`Broker ${brokerId} status updated to: ${status}`);
            setBrokerStatus(status);
            toast[status === "connected" ? "success" : "error"](
              `Broker ${brokerId} is ${status}`,
              { toastId: brokerId }
            );
          }
        } catch (err) {
          console.error("Error fetching broker status:", err.message);
          toast.error(err.message || "Error fetching broker status.");
        }
      };

      fetchBrokerStatus(); // Initial fetch
      intervalId = setInterval(fetchBrokerStatus, 15*5000);
    }

    // Cleanup polling
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Polling stopped");
      }
    };
  }, [brokerId, userRole, navigate, userId]);

  const fetchAssignedBroker = async (userId, token) => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/brokers/assigned",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to fetch assigned broker (HTTP ${errorData.status})`
        );
      }

      const data = await response.json();
      console.log("Assigned broker response:", data);
      return {
        brokerId: data.brokerId,
        connectionStatus: data.connectionStatus || "unknown",
      };
    } catch (err) {
      console.error("Error fetching assigned broker:", err.message);
      toast.error(err.message || "Error fetching assigned broker.");
      return null;
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
      });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      toast.success(success, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
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
      const updatedForms = [...formBlocks];
      updatedForms[formBlocks.length - 1] = getDefaultFormData();
      setFormBlocks(updatedForms);
      setIsResetClear(false);
      toast.success("Row cleared!");
    } else {
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

  const handlePrev = () => {
    setError("");
    setSuccess("");
    if (formBlocks.length > 1) {
      const updatedForms = formBlocks.slice(0, -1);
      setFormBlocks(updatedForms);
      toast.success("Row removed!");
    } else {
      toast.error("Cannot remove the last row!");
    }
  };

  const handleAdd = () => {
    setError("");
    setSuccess("");
    setFormBlocks([...formBlocks, getDefaultFormData()]);
    setIsResetClear(true);
    toast.success("New input row added!");
  };

  const handlePublish = async (e) => {
    e.stopPropagation();
    console.log("handlePublish called");
    setError("");
    setSuccess("");

    const authToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userId");

    if (!authToken || !userId) {
      setError(
        "Authentication token or user ID is missing. Please log in again."
      );
      navigate("/");
      return;
    }

    if (userRole === "admin") {
      setError("Admins are not allowed to publish.");
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
        String(formBlock.tag1),
        String(formBlock.tag2),
        String(formBlock.tag3),
        String(formBlock.tag4),
        String(formBlock.tag5),
        String(formBlock.tag6),
        String(formBlock.tag7),
        String(formBlock.tag8),
        String(formBlock.baudRate),
        String(formBlock.dataBit),
        String(formBlock.parity),
        String(formBlock.stopBit),
        String(formBlock.Delay),
      ],
      []
    );

    try {
      const publishResponse = await fetch(
        `http://localhost:5000/api/brokers/${brokerId}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            topic: topicName.trim(),
            message: JSON.stringify(publishData),
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        const errorMessage = errorData.message || "Failed to publish message.";
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      setSuccess(
        `Published configurations to topic ${topicName} successfully!`
      );
    } catch (err) {
      console.error("Publish error:", err.message);
      setError(err.message || "An error occurred while publishing.");
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
      const response = await fetch(
        `http://localhost:5000/api/brokers/${brokerId}/disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || "Failed to disconnect broker.";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success("Broker disconnected successfully!");
      setShowDisconnectModal(false);
      setBrokerStatus("disconnected");
      navigate("/table");
    } catch (err) {
      console.error("Disconnect error:", err.message);
      toast.error(err.message || "An error occurred while disconnecting.");
      setShowDisconnectModal(false);
    }
  };

  const handleDisconnectCancel = () => {
    setShowDisconnectModal(false);
  };

  return (
    <div className="dashboard-layout">
      <div className="dashboard-sidebar">
        <button className="dashboard-button">Publish</button>
        <button className="dashboard-button">Subscribe</button>
        <button
          className="dashboard-button"
          onClick={handlePublishClick}
          disabled={userRole === "admin"}
        >
          Com Configuration
        </button>
        <button className="dashboard-button">Wi-Fi</button>
      </div>

      <div className="dashboard-main">
        {showMain && (
          <>
            <h2>Com Configuration (Broker Status: {brokerStatus || "Unknown"})</h2>
            <ComConfiguration
              formBlocks={formBlocks}
              formKey={formKey}
              handleChange={handleChange}
            />
            <div className="dashboard-form-buttons fixed-buttons">
              <button className="dashboard-action-button" onClick={handleBack}>
                Back
              </button>
              <button className="dashboard-action-button" onClick={handlePrev}>
                Prev
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
              <button onClick={handlePublish} disabled={userRole === "admin"}>
                Publish
              </button>
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
