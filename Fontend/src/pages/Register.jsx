import axios from "axios";
import React, { useContext, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../context";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Register = () => {
  const { isAuthenticated, setIsAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");

  const navigateTo = useNavigate();

  const handleRegistration = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!lastName.trim()) {
      toast.error("Vui lòng nhập họ!");
      return;
    }
    if (!firstName.trim()) {
      toast.error("Vui lòng nhập tên!");
      return;
    }
    if (!email.trim()) {
      toast.error("Vui lòng nhập email!");
      return;
    }
    if (!phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại!");
      return;
    }
    if (!dob) {
      toast.error("Vui lòng chọn ngày sinh!");
      return;
    }
    if (!gender) {
      toast.error("Vui lòng chọn giới tính!");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Mật khẩu phải có ít nhất 8 ký tự!");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/user/register",
        { firstName, lastName, email, phone, dob, gender, password },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data.message || "Đăng ký thành công!");
      setIsAuthenticated(true);
      navigateTo("/");
      
      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setPassword("");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Đăng ký thất bại!";
      toast.error(errorMessage);
    }
  };

  if (isAuthenticated) {
    return <Navigate to={"/"} />;
  }

  return (
    <>
      <div className="container form-component register-form">
        <h2>Đăng ký</h2>
        <p>Hãy tạo tài khoản để tiếp tục sử dụng dịch vụ của Medical AI.</p>
        <form onSubmit={handleRegistration}>
          <div>
            <input
              type="text"
              placeholder="Họ và tên đệm"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Tên"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="tel"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              pattern="[0-9]{10,11}"
              title="Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số)"
              required
            />
          </div>
          <div>
            <input
              type="date"
              placeholder="Ngày sinh"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
            />
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Chọn giới tính</option>
              <option value="Male">Nam</option>
              <option value="Female">Nữ</option>
            </select>
          </div>
          <div>
            <input
              type="password"
              placeholder="Mật khẩu (tối thiểu 8 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div
            style={{
              gap: "10px",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}
          >
            <p style={{ marginBottom: 0 }}>Đã có tài khoản?</p>
            <Link
              to={"/login"}
              style={{ textDecoration: "none", color: "#271776ca" }}
            >
              Đăng nhập ngay
            </Link>
          </div>
          <div
            style={{ justifyContent: "center", alignItems: "center" }}
          >
            <button type="submit">Đăng ký</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;