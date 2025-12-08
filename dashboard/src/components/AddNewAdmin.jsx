import React, { useContext, useState } from "react";
import { Context } from "../main";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";

const AddNewAdmin = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);
  const navigateTo = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewAdmin = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.lastName.trim()) {
      toast.error("Vui lòng nhập họ!");
      return;
    }
    if (!formData.firstName.trim()) {
      toast.error("Vui lòng nhập tên!");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!formData.dob) {
      toast.error("Vui lòng chọn ngày sinh!");
      return;
    }
    if (!formData.gender) {
      toast.error("Vui lòng chọn giới tính!");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/admin/addnew",
        formData,
        { withCredentials: true }
      );

      toast.success(data.message);
      setIsAuthenticated(true);
      navigateTo("/");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dob: "",
        gender: "",
        password: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <section className="page">
      <section className="container form-component add-admin-form">
        <img src="/logo.png" alt="logo" className="logo" />
        <h1 className="form-title">Thêm Quản Trị Viên</h1>

        <form onSubmit={handleAddNewAdmin}>
          <div>
            <input
              type="text"
              name="lastName"
              placeholder="Họ"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="firstName"
              placeholder="Tên"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10,11}"
              title="Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số)"
              required
            />
          </div>

          <div>
            <input
              type="date"
              name="dob"
              placeholder="Ngày sinh"
              value={formData.dob}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange}
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>

            <input
              type="password"
              name="password"
              placeholder="Mật khẩu (tối thiểu 8 ký tự)"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
          </div>

          <div style={{ justifyContent: "center", alignItems: "center" }}>
            <button type="submit">Thêm Admin</button>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewAdmin;