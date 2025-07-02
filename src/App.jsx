// App.js
import React, { useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/Signup';
import AddBrokerModal from './Pages/AddBrokerModal';
import Navbar from './Pages/Navbar';
import Dashboard from './Pages/Dashboard';
import RightSideTable from './Pages/RightSideTable';
import WiFiConfig from './Components/Users/WiFiConfig';
import ComConfiguration from './Components/Users/ComConfiguration';
import Publish from './Components/Users/Publish';
import Subscribe from './Components/Users/Subscribe';
import Firmware from './Components/Users/Firmware';
import Location from './Components/Users/Location/Location'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { jwtDecode } from "jwt-decode";
import './App.css';

const App = () => {
  const location = useLocation();

  const ProtectedRoute = () => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
  };

  useEffect(() => {
    const jwt = localStorage.getItem("authToken");
    try {
      const jwtUser = jwtDecode(jwt);
      if (Date.now() >= jwtUser.exp * 1000) {
        localStorage.removeItem("authToken");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  }, [location]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/addBrokerModal" element={<AddBrokerModal />} />
          <Route path="/table" element={<RightSideTable />}>
            <Route index element={<div />} />
            <Route path="publish" element={<Publish />} />
            <Route path="subscribe" element={<Subscribe />} />
            <Route path="firmware" element={<Firmware />} /> {/* Moved Firmware here */}
          </Route>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ComConfiguration />} />
            <Route path="com-config" element={<ComConfiguration />} />
            <Route path="wifi-config" element={<WiFiConfig />} />
            <Route path="publish" element={<Publish />} />
            <Route path="subscribe" element={<Location/>}  />
            </Route>       
            </Route>       
      </Routes>
      <ToastContainer
        position="top-right"
        className="custom-toast-container"
        autoClose={500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default App;