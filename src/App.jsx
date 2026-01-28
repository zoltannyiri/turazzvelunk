import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomeScreen from "./screens/homescreen/HomeScreen"; 
import TourDetailsScreen from "./screens/tourdetailsscreen/TourDetailsScreen";
import LoginScreen from "./screens/loginscreen/LoginScreen";
import RegisterScreen from "./screens/registerscreen/RegisterScreen";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/bejelentkezes" element={<LoginScreen />} />
        <Route path="/regisztracio" element={<RegisterScreen />} />
        <Route path="/" element={<HomeScreen />} />
        <Route path="/tura/:id" element={<TourDetailsScreen />} />
      </Routes>
    </Router>
  );
}

export default App;