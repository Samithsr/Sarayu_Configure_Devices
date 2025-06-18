import React, { useEffect, useState } from "react";
import "./Firmware.css";
import { toast } from "react-toastify";
import axios from "axios";

const Firmware = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [publishData, setPublishData] = useState([]);
  const [publishStatus, setPublishStatus] = useState("");
  const [publishing, setPublishing] = useState([]);
  const [brokerOptions, setBrokerOptions] = useState([]);

  useEffect(() => {
    const getAllBrokers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await axios.get("http://localhost:5000/api/pub/get-all-brokers", {
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        });
        const brokers = res?.data?.data;

        if (!brokers || brokers.length === 0) {
          console.warn("No brokers returned from the API.");
          toast.warn("No brokers available. Please add brokers in the admin page.");

          const demoBrokers = [
            { value: "demo1", label: "192.168.1.100" },
            { value: "demo2", label: "192.168.1.101" },
          ];
          setBrokerOptions(demoBrokers);
          return;
        }

        const options = brokers.map((broker) => ({
          value: broker._id,
          label: broker.brokerIp,
        }));
        console.log("Broker Options:", options);
        setBrokerOptions(options);
      } catch (error) {
        console.error("Error fetching brokers:", error.message);
        toast.error("Failed to fetch brokers: " + (error.response?.data?.message || error.message));

        const demoBrokers = [
          { value: "demo1", label: "192.168.1.100" },
          { value: "demo2", label: "192.168.1.101" },
        ];
        setBrokerOptions(demoBrokers);
      }
    };

    getAllBrokers();
    fetchVersions();
  }, []);

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

  const fetchVersions = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/get-all-versions");
      const data = await response.json();
      console.log("Fetched versions:", data);
      if (data.success) {
        setApiData(data.result);
        setPublishData(
          data.result.map((url) => ({
            url,
            brokerIp: brokerOptions.length > 0 ? brokerOptions[0].value : "",
            topic: "",
          }))
        );
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

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setUploadStatus(`File uploaded successfully: ${selectedFile.name}`);
        setSelectedFile(null);
        await fetchVersions();
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

  const handleBrokerChange = (index, value) => {
    setPublishData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, brokerIp: value } : item
      )
    );
  };

  const handleTopicChange = (index, value) => {
    setPublishData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, topic: value } : item))
    );
  };

  const handlePublish = async (index) => {
    const { url, brokerIp, topic } = publishData[index];
    if (!brokerIp) {
      setPublishStatus("Please select a broker IP");
      toast.error("Please select a broker IP");
      return;
    }
    if (!topic) {
      setPublishStatus("Please enter a topic");
      toast.error("Please enter a topic");
      return;
    }

    setPublishing((prev) => {
      const newPublishing = [...prev];
      newPublishing[index] = true;
      return newPublishing;
    });

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `http://localhost:5000/api/publish`,
        {
          brokerIp: brokerOptions.find(b => b.value === brokerIp)?.label || brokerIp,
          topic,
          message: url,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      if (!response.data) {
        throw new Error("No data returned from the server");
      }

      const data = response.data;
      if (data.success) {
        setPublishStatus(`Published successfully: ${url.split("/").pop()}`);
        toast.success(`Published successfully: ${url.split("/").pop()}`);
      } else {
        setPublishStatus(`Publish failed: ${data.message || "Unknown error"}`);
        toast.error(`Publish failed: ${data.message || "Unknown error"}`);
      }
    } catch (error) {
      let errorMessage = "Publish error: " + (error.response?.data?.message || error.message);
      if (error.response && error.response.status >= 400) {
        errorMessage = `Publish error: Server responded with status ${error.response.status}`;
      }
      setPublishStatus(errorMessage);
      toast.error(errorMessage);
      console.error("Publish error:", error);
    } finally {
      setPublishing((prev) => {
        const newPublishing = [...prev];
        newPublishing[index] = false;
        return newPublishing;
      });
    }
  };

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
        {publishStatus && <p className="firmware__status">{publishStatus}</p>}
        <table className="firmware__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Firmware File</th>
              <th>Broker IP</th>
              <th>Topic</th>
              <th>Publish</th>
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
                      value={publishData[index]?.brokerIp || ""}
                      onChange={(e) => handleBrokerChange(index, e.target.value)}
                    >
                      <option value="" disabled>
                        Select Broker IP
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
                      disabled={!publishData[index]?.brokerIp || !publishData[index]?.topic || publishing[index]}
                    >
                      {publishing[index] ? "Sending..." : "Publish"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No firmware versions available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Firmware;