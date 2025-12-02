import React, { useContext, useEffect } from "react";
import { Context } from "../context";

const Login = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");
    const tokenFromStorage = localStorage.getItem("adminToken");

    // 👉 Chỉ set khi chưa authenticated
    if (!isAuthenticated) {
      if (tokenFromUrl) {
        localStorage.setItem("adminToken", tokenFromUrl);
        setIsAuthenticated(true);
      } else if (tokenFromStorage) {
        setIsAuthenticated(true);
      }
    }
  }, [isAuthenticated, setIsAuthenticated]);

  // ❌ Không dùng <Navigate> ở đây nữa
  return (
    <section className="container form-component">
      <img src="/logo.png" alt="logo" className="logo" />
      <h1 className="form-title">CHÀO MỪNG</h1>
      <p>Chỉ quản trị viên (Admin) mới có quyền truy cập vào khu vực này!</p>
      <p style={{ color: "red" }}>
        Vui lòng đăng nhập từ trang chính để vào dashboard.
      </p>
    </section>
  );
};

export default Login;