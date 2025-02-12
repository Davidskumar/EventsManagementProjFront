import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleGuestLogin = () => {
    localStorage.setItem("user", JSON.stringify({ id: "guest", name: "Guest" })); // Store guest session
    navigate("/events"); // Redirect to events page
  };

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <button onClick={() => navigate("/login")}>Go to Login</button>
      <button onClick={handleGuestLogin} style={{ marginLeft: "10px" }}>Continue as Guest</button>
    </div>
  );
};

export default Home;
