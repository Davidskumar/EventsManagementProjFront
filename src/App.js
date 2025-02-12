import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Events from "./pages/Events";

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user")); // Get user info
  const token = localStorage.getItem("token");

  if (user?.id === "guest" || token) {
    return children; // ✅ Allow both guests and authenticated users
  } else {
    return <Navigate to="/login" />;
  }
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/events" element={<PrivateRoute><Events /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
