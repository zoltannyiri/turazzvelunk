import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from "./components/Navbar";

import HomeScreen from "./screens/homescreen/HomeScreen"; 
import TourDetailsScreen from "./screens/tourdetailsscreen/TourDetailsScreen";
import LoginScreen from "./screens/loginscreen/LoginScreen";
import RegisterScreen from "./screens/registerscreen/RegisterScreen";
import ToursScreen from "./screens/toursscreen/ToursScreen";
import ProfileScreen from "./screens/profilescreen/ProfileScreen";
import AdminDashboard from "./screens/adminscreen/AdminDashboard";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="/tours" element={<ToursScreen />} />
        <Route path="/tours/:id" element={<TourDetailsScreen />} />

        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
      </Routes>
      <ToastContainer position="bottom-right" theme="colored" />
    </Router>
  );
}

export default App;