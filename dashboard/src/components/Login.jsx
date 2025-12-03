import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { isAuthenticated, setIsAuthenticated, setAdmin } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🔘 Login button clicked");

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, confirmPassword, role: "Admin" },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("✅ Login response:", res.data);

      // lưu token vào localStorage
      localStorage.setItem("token", res.data.token);

      // cập nhật Context với user
      setAdmin(res.data.user);

      // đánh dấu đã đăng nhập
      setIsAuthenticated(true);

      toast.success(res.data.message);
      navigateTo("/");

      // reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("❌ Login error:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="container form-component">
      <img src="/logo.png" alt="logo" className="logo" />
      <h1 className="form-title">WELCOME</h1>
      <p>Only Admins Are Allowed To Access These Resources!</p>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <div style={{ justifyContent: "center", alignItems: "center" }}>
          <button type="submit">Login</button>
        </div>
      </form>
    </section>
  );
};

export default Login;