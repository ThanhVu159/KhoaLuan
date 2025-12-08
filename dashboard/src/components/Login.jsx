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


    if (!email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    
    if (!password) {
      toast.error("Vui lòng nhập mật khẩu!");
      return;
    }
    
    if (!confirmPassword) {
      toast.error("Vui lòng xác nhận mật khẩu!");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    console.log(" Đang đăng nhập...");

    try {
      const res = await axios.post(
        "http://localhost:4000/api/v1/user/login",
        { email, password, confirmPassword, role: "Admin" },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log(" Phản hồi đăng nhập:", res.data);

   
      localStorage.setItem("token", res.data.token);

     
      setAdmin(res.data.user);


      setIsAuthenticated(true);


      toast.success(res.data.message || "Đăng nhập thành công!");
      

      setEmail("");
      setPassword("");
      setConfirmPassword("");
      

      navigateTo("/");
    } catch (error) {
      console.error(" Lỗi đăng nhập:", error);
      

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message;
        
        if (status === 404) {
          toast.error("Email không tồn tại trong hệ thống!");
        } else if (status === 401) {
          toast.error("Mật khẩu không chính xác!");
        } else if (status === 403) {
          toast.error("Bạn không có quyền truy cập!");
        } else if (message) {
          toast.error(message);
        } else {
          toast.error("Đăng nhập thất bại. Vui lòng thử lại!");
        }
      } else if (error.request) {
        toast.error("Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối!");
      } else {
        toast.error("Đã xảy ra lỗi. Vui lòng thử lại!");
      }
    }
  };

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <section className="container form-component">
      <img src="/logo.png" alt="logo" className="logo" />
      <h1 className="form-title">Chào mừng</h1>
      <p>Chỉ có Quản trị viên mới được phép truy cập!</p>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
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
        <input
          type="password"
          placeholder="Xác nhận mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div style={{ justifyContent: "center", alignItems: "center" }}>
          <button type="submit">Đăng Nhập</button>
        </div>
      </form>
    </section>
  );
};

export default Login;