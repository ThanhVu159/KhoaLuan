import React, { useContext, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Context } from "../main";
import axios from "axios";

const AddNewDoctor = () => {
  const { isAuthenticated } = useContext(Context);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("");
  const [doctorDepartment, setDoctorDepartment] = useState("");
  const [docAvatar, setDocAvatar] = useState("");
  const [docAvatarPreview, setDocAvatarPreview] = useState("");

  const navigateTo = useNavigate();

  const departmentsArray = [
    { value: "Pediatrics", label: "Nhi" },
    { value: "Orthopedics", label: "Chỉnh hình" },
    { value: "Cardiology", label: "Tim mạch" },
    { value: "Neurology", label: "Thần kinh" },
    { value: "Oncology", label: "Ung bướu" },
    { value: "Radiology", label: "Chẩn đoán hình ảnh" },
    { value: "Physical Therapy", label: "Vật lý trị liệu" },
    { value: "Dermatology", label: "Da liễu" },
    { value: "ENT", label: "Tai - Mũi - Họng" },
  ];

  const handleAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setDocAvatarPreview(reader.result);
      setDocAvatar(file);
    };
  };

  const handleAddNewDoctor = async (e) => {
    e.preventDefault();

    if (!docAvatar) {
      toast.error("Vui lòng chọn ảnh đại diện bác sĩ!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("password", password);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("doctorDepartment", doctorDepartment);
      formData.append("docAvatar", docAvatar);

      const { data } = await axios.post(
        "http://localhost:4000/api/v1/doctor/addnew", // ✅ endpoint đúng
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      toast.success(data.message);
      navigateTo("/doctors"); // ✅ điều hướng về danh sách bác sĩ

      // reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setPassword("");
      setDoctorDepartment("");
      setDocAvatar("");
      setDocAvatarPreview("");
    } catch (error) {
      console.error(error.response?.data); // ✅ log chi tiết lỗi
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi!");
    }
  };

  if (!isAuthenticated) return <Navigate to={"/login"} />;

  return (
    <section className="page">
      <section className="container add-doctor-form">
        <img src="/logo.png" alt="logo" className="logo" />
        <h1 className="form-title">ĐĂNG KÝ BÁC SĨ MỚI</h1>

        <form onSubmit={handleAddNewDoctor}>
          <div className="first-wrapper">
            <div>
              <img
                src={docAvatarPreview || "/docHolder.jpg"}
                alt="Doctor Avatar"
              />
              <input type="file" onChange={handleAvatar} />
            </div>

            <div>
              <input
                type="text"
                placeholder="Tên"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Họ"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="number"
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <input
                type="date"
                placeholder="Ngày sinh"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />

             
<select value={gender} onChange={(e) => setGender(e.target.value)}>
  <option value="">Chọn giới tính</option>
  <option value="Male">Nam</option>
  <option value="Female">Nữ</option>
</select>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <select
                value={doctorDepartment}
                onChange={(e) => setDoctorDepartment(e.target.value)}
              >
                <option value="">Chọn chuyên khoa</option>
                {departmentsArray.map((dep) => (
                  <option key={dep.value} value={dep.value}>
                    {dep.label}
                  </option>
                ))}
              </select>

              <button type="submit">Tạo hồ sơ bác sĩ</button>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewDoctor;