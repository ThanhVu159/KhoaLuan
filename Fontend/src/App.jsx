import React, { useContext, useEffect } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Appointment from "./pages/Appointment";
import AboutUs from "./pages/AboutUs";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Context } from "./main";
import Login from "./pages/Login";
import XrayPage from "./pages/XrayPage";
import Profile from "./components/Profile";
import AdminLogin from "./pages/AdminLogin";


const AppContent = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const patientRes = await axios.get(
          "http://localhost:4000/api/v1/user/patient/me",
          { withCredentials: true }
        );
        setIsAuthenticated(true);
        setUser(patientRes.data.user);
      } catch (patientError) {
        try {
          const adminRes = await axios.get(
            "http://localhost:4000/api/v1/user/admin/me",
            { withCredentials: true }
          );
          setIsAuthenticated(true);
          setUser(adminRes.data.user);
          navigate("/dashboard"); 
        } catch (adminError) {
          setIsAuthenticated(false);
          setUser({});
        }
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/xray-diagnosis" element={<XrayPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminLogin />} />

      </Routes>
      <Footer />
      <ToastContainer position="top-center" />
    </>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;