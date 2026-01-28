import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import HomeScreen from "./screens/homescreen/HomeScreen"; 
import TourDetailsScreen from "./screens/tourdetailsscreen/TourDetailsScreen";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/tura/:id" element={<TourDetailsScreen />} />
      </Routes>
    </Router>
  );
}

export default App;