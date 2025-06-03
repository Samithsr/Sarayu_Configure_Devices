
import React from "react";
import "./ComConfiguration.css";

const ComConfiguration = ({ formBlocks, formKey, handleChange }) => {
  return (
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
              <th>Delay</th>
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
                      110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200,
                      38400, 57600, 115200, 230400, 460800, 921600,
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
                <td>
                  <input
                    type="text"
                    id="Delay"
                    value={formData.Delay}
                    onChange={(e) => handleChange(index, e)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComConfiguration;
