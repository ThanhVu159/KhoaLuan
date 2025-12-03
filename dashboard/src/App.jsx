import React, { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./components/Dashboard";
import AddNewDoctor from "./components/AddNewDoctor";
import Messages from "./components/Messages";
import Doctors from "./components/Doctors";
import { Context } from "./context.jsx";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Sidebar from "./components/Sidebar";
import AddNewAdmin from "./components/AddNewAdmin";
import "./App.css";

// ✅ Route bảo vệ
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(Context);

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (user?.role !== "Admin") {
    return <Navigate to="/welcome" replace />;
  }

  return children;
};

// ✅ Trang Welcome công khai
const Welcome = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Chào mừng đến Dashboard</h2>
      <p>Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.</p>
    </div>
  );
};

// ✅ Trang NotFound
const NotFound = () => {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>404 - Không tìm thấy trang</h2>
      <p>Đường dẫn bạn nhập không tồn tại.</p>
    </div>
  );
};

const App = () => {
  const { setIsAuthenticated, setUser, isAuthenticated, user } =
    useContext(Context);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        const response = await axios.get(
          "http://localhost:4000/api/v1/user/admin/me",
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        setIsAuthenticated(true);
        setUser(response.data.user);
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    fetchUser();
  }, [setIsAuthenticated, setUser]);

  return (
    <Router>
      {/* ✅ Sidebar chỉ hiển thị khi là admin */}
      {isAuthenticated && user?.role === "Admin" && <Sidebar />}

      <Routes>
        {/* Trang Welcome công khai */}
        <Route path="/welcome" element={<Welcome />} />

        {/* Trang chủ */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Trang dashboard riêng */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Quản lý bác sĩ */}
        <Route
          path="/doctor/addnew"
          element={
            <ProtectedRoute>
              <AddNewDoctor />
            </ProtectedRoute>
          }
        />

        {/* Quản lý admin */}
        <Route
          path="/admin/addnew"
          element={
            <ProtectedRoute>
              <AddNewAdmin />
            </ProtectedRoute>
          }
        />

        {/* Tin nhắn */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* Danh sách bác sĩ */}
        <Route
          path="/doctors"
          element={
            <ProtectedRoute>
              <Doctors />
            </ProtectedRoute>
          }
        />

        {/* Route mặc định cho URL sai */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer position="top-center" />
    </Router>
  );
};

export default App;