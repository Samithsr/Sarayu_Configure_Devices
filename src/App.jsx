import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/SignUp';
import { Route, Routes } from 'react-router-dom';
import Navbar from "./Pages/Navbar";
import Dashboard from './Pages/Dashboard';
import RightSideTable from './Pages/RightSideTable';
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
          <Route path="/table" element={<RightSideTable />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Routes>
      <ToastContainer 
        position="top-right"
        className="custom-toast-container"
        autoClose={5000}
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