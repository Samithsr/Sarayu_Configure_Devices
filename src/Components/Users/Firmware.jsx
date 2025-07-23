import React, { useEffect, useState } from "react";
import "./Firmware.css";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Firmware = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [publishData, setPublishData] = useState([]);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishing, setPublishing] = useState([]);
  const [brokerOptions, setBrokerOptions] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const navigate = useNavigate();

  // Inline DeleteModal Component
  const DeleteModal = ({ isOpen, onConfirm, onCancel, filename }) => {
    if (!isOpen) return null;

    return (
      <div className="firmware-delete-modal-overlay">
        <div className="firmware-delete-modal-container">
          <h2 className="firmware-delete-modal-title">Confirm Deletion</h2>
          <p className="firmware-delete-modal-message">
            Are you sure you want to delete the file "{filename}"?
          </p>
          <div className="firmware-delete-modal-actions">
            <button className="firmware-delete-modal-btn firmware-cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="firmware-delete-modal-btn firmware-confirm-btn" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const getAllBrokers = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("Fetching brokers with token:", token ? "Token present" : "No token");
        if (!token) {
          toast.error("Please log in to access brokers.");
          navigate("/");
          return;
        }

        const res = await axios.get("http://localhost:5000/api/brokers", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const brokers = res?.data;

        if (!brokers || brokers.length === 0) {
          console.warn("No brokers returned from the API.");
          toast.warn("No brokers available. Please add brokers in the admin page.");
          const demoBrokers = [
            {
              value: "demo1",
              label: "Demo Company 1",
              brokerIp: "192.168.1.100",
              topic: "demo/topic1",
              username: "",
              password: "",
            },
            {
              value: "demo2",
              label: "Demo Company 2",
              brokerIp: "192.168.1.101",
              topic: "demo/topic2",
              username: "",
              password: "",
            },
          ];
          setBrokerOptions(demoBrokers);
          await fetchVersions(demoBrokers[0]?.brokerIp || "192.168.1.100");
          return;
        }

        const options = brokers.map((broker) => ({
          value: broker._id,
          label: broker.label || broker.brokerIp,
          brokerIp: broker.brokerIp,
          topic: broker.topic || "",
          username: broker.username || "",
          password: broker.password || "",
        }));
        console.log("Broker Options:", options);
        setBrokerOptions(options);
        // Fetch versions for the first broker's IP
        await fetchVersions(options[0]?.brokerIp || "192.168.1.100");
      } catch (error) {
        console.error("Error fetching brokers:", error.message, error.response?.data);
        toast.error("Failed to fetch brokers: " + (error.response?.data?.message || error.message));
        if (error.response?.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/");
        }
        const demoBrokers = [];
        setBrokerOptions(demoBrokers);
        await fetchVersions("192.168.1.100");
      }
    };

    getAllBrokers();
  }, [navigate]);

  // Save publishData to localStorage whenever it changes
  useEffect(() => {
    if (publishData.length > 0) {
      localStorage.setItem("publishData", JSON.stringify(publishData));
    }
  }, [publishData]);

  const fetchVersions = async (brokerIp) => {
    try {
      const response = await fetch(`http://localhost:5000/api/get-all-versions?ip=${brokerIp}`);
      const data = await response.json();
      console.log("Fetched versions:", data);
      if (data.success) {
        setApiData(data.result);

        const savedPublishData = JSON.parse(localStorage.getItem("publishData")) || [];
        const newPublishData = data.result.map((url) => {
          const savedItem = savedPublishData.find((item) => item.url === url);
          const selectedBroker = brokerOptions.find((b) => b.brokerIp === brokerIp) || brokerOptions[0];
          return {
            url,
            brokerId: savedItem?.brokerId || selectedBroker?.value || "",
            brokerIp: savedItem?.brokerIp || brokerIp,
            topic: savedItem?.topic || selectedBroker?.topic || "",
            mqttUsername: savedItem?.mqttUsername || selectedBroker?.username || "",
            mqttPassword: savedItem?.mqttPassword || selectedBroker?.password || "",
            label: savedItem?.label || selectedBroker?.label || "",
          };
        });

        setPublishData(newPublishData);
        setPublishing(data.result.map(() => false));
      } else {
        setUploadStatus(data.message || "Failed to fetch versions");
        console.error("Failed to fetch versions:", data.message);
      }
    } catch (err) {
      setUploadStatus("Error fetching versions");
      console.error("Error fetching versions:", err.message);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.name.toLowerCase().endsWith(".bin")) {
      setSelectedFile(file);
      setUploadStatus("");
    } else {
      setSelectedFile(null);
      setUploadStatus("Please select a .bin file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus(`File uploaded successfully: ${selectedFile.name}`);
        setSelectedFile(null);
        const selectedBroker = brokerOptions.find((b) => b.value === publishData[0]?.brokerId) || brokerOptions[0];
        await fetchVersions(selectedBroker?.brokerIp || "192.168.1.100");
      } else {
        setUploadStatus(`Upload failed: ${data.message}`);
      }
    } catch (err) {
      setUploadStatus(`Upload error: ${err.message}`);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (index) => {
    setDeleteIndex(index);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const url = apiData[deleteIndex];
    const filename = url.split("/").pop();

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        toast.error("Please log in to delete files.");
        navigate("/");
        setIsDeleteModalOpen(false);
        return;
      }

      const response = await axios.delete(`http://localhost:5000/api/delete/${filename}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setUploadStatus(`File ${filename} deleted successfully`);
        toast.success(`File ${filename} deleted successfully`);
        const selectedBroker = brokerOptions.find((b) => b.value === publishData[deleteIndex]?.brokerId) || brokerOptions[0];
        await fetchVersions(selectedBroker?.brokerIp || "192.168.1.100");
      } else {
        setUploadStatus(`Delete failed: ${response.data.message}`);
        toast.error(`Delete failed: ${response.data.message}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Delete error:", errorMessage);
      setUploadStatus(`Delete error: ${errorMessage}`);
      toast.error(`Delete error: ${errorMessage}`);
      if (error.response?.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/");
      }
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteIndex(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteIndex(null);
  };

  const handleBrokerChange = (index, value) => {
    const selectedBroker = brokerOptions.find((b) => b.value === value);
    setPublishData((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              brokerId: value,
              brokerIp: selectedBroker ? selectedBroker.brokerIp : "",
              topic: selectedBroker ? selectedBroker.topic : "",
              mqttUsername: selectedBroker ? selectedBroker.username : "",
              mqttPassword: selectedBroker ? selectedBroker.password : "",
              label: selectedBroker ? selectedBroker.label : "",
              url: selectedBroker ? `http://${selectedBroker.brokerIp}:5000/api/updates/${item.url.split("/").pop()}` : item.url,
            }
          : item
      )
    );
    // Refresh versions for the selected broker's IP
    if (selectedBroker) {
      fetchVersions(selectedBroker.brokerIp);
    }
  };

  const handleTopicChange = (index, value) => {
    setPublishData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, topic: value } : item))
    );
  };

  const handlePublish = async (index) => {
    const { url, brokerIp, topic, mqttUsername, mqttPassword, label } = publishData[index];
    if (!brokerIp) {
      setPublishStatus("Please select a company name");
      toast.error("Please select a company name");
      return;
    }
    if (!topic) {
      setPublishStatus("Please enter a topic");
      toast.error("Please enter a topic");
      return;
    }
    if (!mqttUsername || !mqttPassword) {
      setPublishStatus("MQTT credentials are missing");
      toast.error("MQTT credentials are missing");
      return;
    }
    if (!url) {
      setPublishStatus("Firmware URL is missing");
      toast.error("Firmware URL is missing");
      return;
    }

    setPublishing((prev) => {
      const newPublishing = [...prev];
      newPublishing[index] = true;
      return newPublishing;
    });

    try {
      const token = localStorage.getItem("authToken");
      console.log("Publishing with token:", token ? "Token present" : "No token");
      if (!token) {
        setPublishStatus("Please log in to publish.");
        toast.error("Please log in to publish.");
        navigate("/");
        return;
      }

      console.log("Publishing request:", { brokerIp, topic, url, mqttUsername });
      const response = await axios.post(
        `http://localhost:5000/api/publish`,
        {
          brokerIp,
          topic,
          message: url,
          mqttUsername,
          mqttPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data) {
        throw new Error("No data returned from the server");
      }

      const data = response.data;
      if (data.success) {
        const filename = url.split("/").pop();
        setPublishStatus(`Published URL "${url}" to topic "${topic}" for company ${label}`);
        toast.success(`Published "${filename}" to topic "${topic}" for company ${label}`);
      } else {
        setPublishStatus(`Publish failed: ${data.message || "Unknown error"}`);
        toast.error(`Publish failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error("Publish error:", {
        message: errorMessage,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack,
      });
      if (error.response?.status === 401) {
        setPublishStatus("Unauthorized: Please log in again.");
        toast.error("Unauthorized: Please log in again.");
        localStorage.removeItem("authToken");
        navigate("/");
      } else {
        setPublishStatus(`Publish error: ${errorMessage}`);
        toast.error(`Publish error: ${errorMessage}`);
      }
    } finally {
      setPublishing((prev) => {
        const newPublishing = [...prev];
        newPublishing[index] = false;
        return newPublishing;
      });
    }
  };

  console.log("Api data: ", apiData);
  console.log("Publish data: ", publishData);

  return (
    <div className="firmware">
      <div className="firmware__top">
        <div className="firmware__card">
          <header className="firmware__header">
            <h3 className="firmware__title">Drag and drop a file or browse to upload</h3>
          </header>

          <section className="firmware__upload">
            <input
              type="file"
              accept=".bin"
              id="firmware-file"
              className="firmware__file-input"
              onChange={handleFileChange}
            />
            <label htmlFor="firmware-file" className="firmware__button">
              Choose File
            </label>
            <p className="firmware__info">File must be .bin</p>
            {selectedFile && (
              <div className="firmware__file-loader">
                <div className="firmware__file-loader-bar"></div>
                <p className="firmware__filename">Selected: {selectedFile.name}</p>
              </div>
            )}
            {uploadStatus && <p className="firmware__status">{uploadStatus}</p>}
          </section>

          <button
            className="firmware__upload-button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      <div className="firmware__bottom">
        {publishStatus && <p className="firmware__published">{publishStatus}</p>}
        <table className="firmware__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Firmware File</th>
              <th>Company Name</th>
              <th>Topic</th>
              <th>Publish</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {apiData.length > 0 ? (
              apiData.map((url, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  </td>
                  <td>
                    <select
                      className="publish-broker-ip-select"
                      id={`broker-${index}`}
                      value={publishData[index]?.brokerId || ""}
                      onChange={(e) => handleBrokerChange(index, e.target.value)}
                    >
                      <option value="" disabled>
                        Select Company Name
                      </option>
                      {brokerOptions.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={publishData[index]?.topic || ""}
                      onChange={(e) => handleTopicChange(index, e.target.value)}
                      placeholder="Enter MQTT topic"
                      className="firmware__input"
                    />
                  </td>
                  <td>
                    <button
                      className="url-section-button"
                      onClick={() => handlePublish(index)}
                      disabled={
                        !publishData[index]?.brokerId ||
                        !publishData[index]?.topic ||
                        !publishData[index]?.mqttUsername ||
                        !publishData[index]?.mqttPassword ||
                        publishing[index]
                      }
                    >
                      {publishing[index] ? "Sending..." : "Publish"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="url-section-button delete-button"
                      onClick={() => handleDeleteClick(index)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No firmware versions available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        filename={deleteIndex !== null ? apiData[deleteIndex]?.split("/").pop() : ""}
      />
    </div>
  );
};

export default Firmware;