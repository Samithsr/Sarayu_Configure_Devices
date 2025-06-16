import React, { useState } from 'react';
import './Firmware.css';

const Firmware = () => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      alert(`Uploading: ${selectedFile.name}`);
    }
  };

  return (
    <div className="firmware">
      {/* Top: Firmware Upload Card */}
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
            <p className="firmware__info">File must be .bin, up to 40MB</p>

            {selectedFile && (
              <div className="firmware__file-loader">
                <div className="firmware__file-loader-bar"></div>
                <p className="firmware__filename">Selected: {selectedFile.name}</p>
              </div>
            )}
          </section>

          <button
            className="firmware__upload-button"
            onClick={handleUpload}
            disabled={!selectedFile}
          >
            Upload
          </button>
        </div>
      </div>

      {/* Bottom: Table */}
      <div className="firmware__bottom">
        <table className="firmware__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th>Publish</th>
              {/* <th>Role</th> */}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>John Doe</td>
              <td>john@example.com</td>
              {/* <td>Admin</td> */}
            </tr>
            <tr>
              <td>2</td>
              <td>Jane Smith</td>
              <td>jane@example.com</td>
              {/* <td>User</td> */}
            </tr>
            <tr>
              <td>3</td>
              <td>Mike Johnson</td>
              <td>mike@example.com</td>
              {/* <td>Editor</td> */}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Firmware;
