// App.js
import React from 'react';
// import { Route, Routes } from 'react-router-dom';
import { Navigate, Outlet } from 'react-router-dom';
import Login from './Authentication/Login';
import Signup from './Authentication/SignUp';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Pages/Home';
import Navbar from "./Pages/Navbar";


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
      <Route element={<ProtectedRoute />} >
      
      <Route path="/home" element={<Home />} />
      </Route>
    </Routes>
    </>
  );
};

export default App;
