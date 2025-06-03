import React, { useState } from 'react';
import "./WiFiConfig.css";

const WiFiConfig = () => {
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ssid.trim() || !password.trim()) {
      alert("Please enter both SSID and Password.");
      return;
    }
    console.log("Wi-Fi Config:", { ssid, password });
    // Add API call to save Wi-Fi settings if needed
  };

  return (
    <div className="wifi-config">
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="ssid">SSID:</label>
          <input
            type="text"
            id="ssid"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
            placeholder="Enter Wi-Fi SSID"
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Wi-Fi Password"
          />
        </div>
        <button type="submit">Connect</button>
      </form>
    </div>
  );
};

export default WiFiConfig;