import React from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
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
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const App = () => {
  const ProtectedRoute = () => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
  };

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/addBrokerModal" element={<AddBrokerModal />} />
          <Route path="/table" element={<RightSideTable />}>
            <Route index element={<div />} /> {/* Placeholder for /table to show the table */}
            <Route path="publish" element={<Publish />} />
            <Route path="subscribe" element={<Subscribe />} />
          </Route>
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<ComConfiguration />} /> {/* Changed default to ComConfiguration */}
            <Route path="com-config" element={<ComConfiguration />} />
            <Route path="wifi-config" element={<WiFiConfig />} />
            <Route path="publish" element={<Publish />} />
            {/* <Route path="subscribe" element={<Subscribe />} /> */}
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