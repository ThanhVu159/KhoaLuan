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
              name="firstName"
              placeholder="Họ"
              value={formData.firstName}
              onChange={handleChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Tên"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="number"
              name="phone"
              placeholder="Số điện thoại"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <input
              type="date"
              name="dob"
              placeholder="Ngày sinh"
              value={formData.dob}
              onChange={handleChange}
            />
          </div>

          <div>
            <select name="gender" value={formData.gender} onChange={handleChange}>
  <option value="">Chọn giới tính</option>
  <option value="Male">Nam</option>
  <option value="Female">Nữ</option>
</select>

            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
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
