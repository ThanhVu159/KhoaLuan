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
    { value: "Ophthalmology", label: "Mắt" },
    { value: "Gynecology", label: "Phụ sản" },
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

    // Validate từng trường
    if (!lastName.trim()) {
      toast.error("Vui lòng nhập họ và tên đệm!");
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
    if (!doctorDepartment) {
      toast.error("Vui lòng chọn chuyên khoa!");
      return;
    }
    if (!docAvatar) {
      toast.error("Vui lòng chọn ảnh đại diện bác sĩ!");
      return;
    }

    try {
      // Mật khẩu mặc định
      const defaultPassword = "Doctor@123";
      
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("password", defaultPassword);
      formData.append("dob", dob);
      formData.append("gender", gender);
      formData.append("doctorDepartment", doctorDepartment);
      formData.append("docAvatar", docAvatar);

      const { data } = await axios.post(
        "http://localhost:4000/api/v1/doctor/addnew",
        formData,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      // Thông báo thành công
      toast.success("Thêm bác sĩ thành công!");
      
      // Điều hướng về trang danh sách bác sĩ
      navigateTo("/doctors");

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setDoctorDepartment("");
      setDocAvatar("");
      setDocAvatarPreview("");
    } catch (error) {
      // Thông báo thất bại
      toast.error(error.response?.data?.message || "Thêm bác sĩ thất bại!");
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
                alt="Ảnh đại diện bác sĩ"
              />
              <input type="file" onChange={handleAvatar} accept="image/*" />
            </div>

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
                required
                pattern="[0-9]{10,11}"
                title="Vui lòng nhập số điện thoại hợp lệ (10-11 chữ số)"
              />
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

              <select
                value={doctorDepartment}
                onChange={(e) => setDoctorDepartment(e.target.value)}
                required
              >
                <option value="">Chọn chuyên khoa</option>
                {departmentsArray.map((dep) => (
                  <option key={dep.value} value={dep.value}>
                    {dep.label}
                  </option>
                ))}
              </select>

              <button type="submit">Tạo hồ sơ bác sĩ</button>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                
              </p>
            </div>
          </div>
        </form>
      </section>
    </section>
  );
};

export default AddNewDoctor;