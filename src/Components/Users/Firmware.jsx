import React, { useEffect, useState } from "react";
import "./Firmware.css";

const Firmware = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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
      console.log(data);
      if (data.success) {
        setApiData(data.result);
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
        await fetchVersions(); // Refresh the table data
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

  useEffect(() => {
    fetchVersions();
  }, []);

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
        <table className="firmware__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Firmware File</th>
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
                    <button className="url-section-button">Send</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No firmware versions available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Firmware;