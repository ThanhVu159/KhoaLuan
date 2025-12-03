import React, { useContext, useEffect } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Appointment from "./pages/Appointment";
import AboutUs from "./pages/AboutUs";
import Register from "./pages/Register";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { Context } from "./context";
import Login from "./pages/Login";
import XrayPage from "./pages/XrayPage";
import Profile from "./components/Profile";

const App = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token"); 
        if (!token) {
          setIsAuthenticated(false);
          setUser({});
          return;
        }

        // kiểm tra bệnh nhân
        try {
          const patientRes = await axios.get(
            "http://localhost:4000/api/v1/user/patient/me",
            {
              headers: { Authorization: `Bearer ${token}` }, 
              withCredentials: true,
            }
          );
          setIsAuthenticated(true);
          setUser(patientRes.data.user);
          return;
        } catch {
          // kiểm tra admin
          const adminRes = await axios.get(
            "http://localhost:4000/api/v1/user/admin/me",
            {
              headers: { Authorization: `Bearer ${token}` }, 
              withCredentials: true,
            }
          );
          setIsAuthenticated(true);
          setUser(adminRes.data.user);
        }
      } catch {
        setIsAuthenticated(false);
        setUser({});
      }
    };

    fetchUser();
  }, [setIsAuthenticated, setUser]);

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
        {/*  Không cần route /dashboard trong FE */}
      </Routes>
      <Footer />
      <ToastContainer position="top-center" />
    </>
  );
};

export default App;