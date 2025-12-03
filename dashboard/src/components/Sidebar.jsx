import React, { useContext, useState } from "react";
import { TiHome } from "react-icons/ti";
import { RiLogoutBoxFill } from "react-icons/ri";
import { AiFillMessage } from "react-icons/ai";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaUserDoctor } from "react-icons/fa6";
import { MdAddModerator } from "react-icons/md";
import { IoPersonAddSharp } from "react-icons/io5";
import axios from "axios";
import { toast } from "react-toastify";
import { Context } from "../main";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [show, setShow] = useState(false);

  const { isAuthenticated, setIsAuthenticated, admin, setAdmin } = useContext(Context); // ✅ lấy admin
  const navigateTo = useNavigate();

  const handleLogout = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/user/admin/logout", {
        withCredentials: true,
      });

      toast.success(res.data.message);

      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setIsAuthenticated(false);
      setAdmin(null); // ✅ reset admin về null

      navigateTo("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Logout failed");
    }
  };

  return (
    <>
      <nav
        style={!isAuthenticated ? { display: "none" } : { display: "flex" }}
        className={show ? "show sidebar" : "sidebar"}
      >
        <div className="links">
          <TiHome onClick={() => navigateTo("/")} />
          <FaUserDoctor onClick={() => navigateTo("/doctors")} />
          {/* ✅ chỉ hiển thị cho Admin */}
          {admin?.role === "Admin" && (
            <>
              <MdAddModerator onClick={() => navigateTo("/admin/addnew")} />
              <IoPersonAddSharp onClick={() => navigateTo("/doctor/addnew")} />
            </>
          )}
          <AiFillMessage onClick={() => navigateTo("/messages")} />
          <RiLogoutBoxFill onClick={handleLogout} />
        </div>
      </nav>
      <div
        className="wrapper"
        style={!isAuthenticated ? { display: "none" } : { display: "flex" }}
      >
        <GiHamburgerMenu className="hamburger" onClick={() => setShow(!show)} />
      </div>
    </>
  );
};

export default Sidebar;