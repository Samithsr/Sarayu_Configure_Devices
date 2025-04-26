import React from 'react'
import './Home.css'
import { RiLogoutCircleRLine } from "react-icons/ri";

const Home = () => {
  const handleLogout = () => {
    alert("Logged out!");
  }

  return (
    <div className="page-wrapper">
      <nav className="navbar">
        <h1>MQTT Connection Settings</h1>
        <button className="logout-icon-button" onClick={handleLogout}>
          <RiLogoutCircleRLine size={24} />
        </button>
      </nav>
      
      <div className="home-container">
        <form className="broker-form">
          <div className="form-group">
            <label htmlFor="broker">Broker:</label>
            <input type="text" id="broker" name="broker" placeholder="Enter broker address" />
          </div>
          <div className="form-group">
            <label htmlFor="port">Port:</label>
            <input type="number" id="port" name="port" placeholder="Enter port number" />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" name="username" placeholder="Enter username" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" placeholder="Enter password" />
          </div>
          <button type="submit">Connect</button>
        </form>
      </div>
    </div>
  )
}

export default Home
