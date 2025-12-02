import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";

const Navbar = () => {
  const [show, setShow] = useState(false);
  const { isAuthenticated, setIsAuthenticated, setUser, user } = useContext(Context);
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/user/patient/logout", {
        withCredentials: true,
      });
      toast.success(res.data.message);
    } catch (err1) {
      try {
        const res = await axios.get("http://localhost:4000/api/v1/user/admin/logout", {
          withCredentials: true,
        });
        toast.success(res.data.message);
      } catch (err2) {
        toast.error("Lỗi đăng xuất");
      }
    }

    setIsAuthenticated(false);
    setUser({});
    navigateTo("/login");
  };

  const goToLogin = () => navigateTo("/login");

  return (
    <nav className="container">
      <div className="logo">
        <img src="/logo.png" alt="logo" className="logo-img" />
      </div>

      <div className={show ? "navLinks showmenu" : "navLinks"}>
        <div className="links">
          <Link to="/" onClick={() => setShow(false)}>Trang chủ</Link>
          <Link to="/appointment" onClick={() => setShow(false)}>Đặt lịch khám</Link>
          <Link to="/about" onClick={() => setShow(false)}>Giới thiệu</Link>

          {isAuthenticated && (
            <Link to="/profile" onClick={() => setShow(false)}>Hồ sơ</Link>
          )}
        </div>

        {isAuthenticated ? (
          <button className="logoutBtn" onClick={handleLogout}>ĐĂNG XUẤT</button>
        ) : (
          <button className="loginBtn" onClick={goToLogin}>ĐĂNG NHẬP</button>
        )}
      </div>

      <div className="hamburger" onClick={() => setShow(!show)}>
        <GiHamburgerMenu />
      </div>
    </nav>
  );
};

export default Navbar;