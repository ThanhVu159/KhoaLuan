// src/components/AdminLogin.jsx
import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Link, useNavigate, Navigate } from "react-router-dom";

const AdminLogin = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigateTo = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios
        .post(
          "http://localhost:4000/api/v1/user/login",
          { email, password, role: "Admin" },
          {
            withCredentials: true,
            headers: { "Content-Type": "application/json" },
          }
        )
        .then((res) => {
          toast.success(res.data.message);
          setIsAuthenticated(true);
          // ✅ Điều hướng đến trang dashboard cho Admin
          navigateTo("/dashboard");
          setEmail("");
          setPassword("");
        });
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  if (isAuthenticated) {
    // ✅ Nếu đã đăng nhập Admin thì tự động chuyển đến dashboard
    return <Navigate to={"/dashboard"} />;
  }

  return (
    <>
      <div className="container form-component login-form">
        <h2>🔐 Đăng nhập Admin</h2>
        <p>Quản lý hệ thống Medical AI</p>
        <p>
          Chỉ dành cho quản trị viên. Vui lòng đăng nhập bằng tài khoản Admin để
          truy cập hệ thống quản lý.
        </p>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div
            style={{
              gap: "10px",
              justifyContent: "center",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Link
              to={"/login"}
              style={{
                textDecoration: "none",
                color: "#718096",
                fontSize: "0.95rem",
              }}
            >
              ← Quay lại đăng nhập Patient
            </Link>
          </div>

          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit">Đăng nhập</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AdminLogin;