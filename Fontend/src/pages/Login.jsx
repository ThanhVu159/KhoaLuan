import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main.jsx"; // ✅ import từ main.jsx

const Login = () => {
  const { isAuthenticated, setIsAuthenticated, setUser } = useContext(Context);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Patient");
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  // ✅ Tự động điền email nếu đã lưu
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, role },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(res.data.message);
      setIsAuthenticated(true);

      // Lấy thông tin user
      const userRes = await axios.get(
        role === "Admin"
          ? "http://localhost:4000/api/v1/user/admin/me"
          : "http://localhost:4000/api/v1/user/patient/me",
        { withCredentials: true }
      );

      setUser(userRes.data.user);

      // ✅ Lưu email nếu chọn "Nhớ tài khoản"
      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      // 👉 Điều hướng theo vai trò
      if (role === "Admin") {
        window.location.href = "http://localhost:5174/"; // sang dashboard
      } else {
        navigate("/"); // về trang chính
      }

      setPassword("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <div className="container form-component login-form">
      <h2>Đăng nhập</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email của bạn"
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

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="Patient">Bệnh nhân</option>
          <option value="Admin">Quản trị viên</option>
        </select>

        <div style={{ margin: "10px 0" }}>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />{" "}
            Nhớ tài khoản
          </label>
        </div>

        <div style={{ gap: "10px", justifyContent: "flex-end", flexDirection: "row" }}>
          <p style={{ marginBottom: 0 }}>Chưa có tài khoản?</p>
          <Link to="/register" style={{ textDecoration: "none", color: "#271776ca" }}>
            Đăng ký ngay
          </Link>
        </div>

        <div style={{ justifyContent: "center", alignItems: "center" }}>
          <button type="submit">Đăng nhập</button>
        </div>
      </form>
    </div>
  );
};

export default Login;