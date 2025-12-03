import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // ✅ thêm useNavigate
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../context.jsx";

const Login = () => {
  const { setIsAuthenticated, setUser } = useContext(Context);
  const navigate = useNavigate(); // ✅ hook điều hướng

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    axios.defaults.withCredentials = true;
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password }, // ✅ bỏ role
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(res.data.message);
      setIsAuthenticated(true);

      const token = res.data?.token;
      if (token) {
        localStorage.setItem("token", token);

        // ✅ gọi API /me chung
        const userRes = await axios.get(
          "http://localhost:4000/api/v1/user/me",
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        setUser(userRes.data.user);
      }

      if (rememberMe) {
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("savedEmail");
      }

      setPassword("");

      // ✅ điều hướng về trang chủ
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại!");
    }
  };

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

        {/* ❌ bỏ dropdown role */}

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

        <div
          style={{
            gap: "10px",
            justifyContent: "flex-end",
            flexDirection: "row",
          }}
        >
          <p style={{ marginBottom: 0 }}>Chưa có tài khoản?</p>
          <Link
            to="/register"
            style={{ textDecoration: "none", color: "#271776ca" }}
          >
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