import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../main";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Profile.css";

const Profile = () => {
  const { isAuthenticated } = useContext(Context);
  const [profileUser, setProfileUser] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get("http://localhost:4000/api/v1/user/patient/profile", {
          withCredentials: true,
        });

        setProfileUser(data.user);
        setAppointments(data.user.appointments);
      } catch (error) {
        toast.error("Không thể lấy hồ sơ");
      }
    };

    fetchProfile();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Bạn có chắc muốn huỷ lịch hẹn này?")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/appointment/delete/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setAppointments((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Huỷ lịch hẹn thất bại");
    }
  };

  const translateGender = (gender) => {
    if (gender === "Male") return "Nam";
    if (gender === "Female") return "Nữ";
    return gender || "Chưa cập nhật";
  };

  const translateStatus = (status) => {
    switch (status) {
      case "Pending":
        return "Đang chờ";
      case "Accepted":
        return "Đã duyệt";
      case "Rejected":
        return "Từ chối";
      case "Confirmed":
        return "Đã xác nhận";
      case "Cancelled":
        return "Đã huỷ";
      default:
        return status;
    }
  };

  const translateDepartment = (dept) => {
    const mapping = {
      Pediatrics: "Nhi khoa",
      Orthopedics: "Chấn thương chỉnh hình",
      Cardiology: "Tim mạch",
      Neurology: "Thần kinh",
      Oncology: "Ung thư",
      Radiology: "Chẩn đoán hình ảnh X-quang",
      "Physical Therapy": "Vật lý trị liệu",
      Dermatology: "Da liễu",
      ENT: "Tai - Mũi - Họng",
    };
    return mapping[dept] || dept;
  };

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <section className="page profile">
      <h1 className="profile-title">Hồ sơ</h1>
      <p>
        Xin chào <strong>{profileUser?.firstName} {profileUser?.lastName}</strong>! Đây là thông tin cá nhân và lịch hẹn của bạn.
      </p>

      <div className="card info">
        <h2 className="section-title">Thông tin cá nhân</h2>
        <ul>
          <li><strong>Email:</strong> {profileUser?.email}</li>
          <li><strong>Số điện thoại:</strong> {profileUser?.phone}</li>
          <li><strong>Địa chỉ:</strong> {profileUser?.address || "Chưa cập nhật"}</li>
          <li><strong>Ngày sinh:</strong> {profileUser?.dob?.substring(0, 10)}</li>
          <li><strong>Giới tính:</strong> {translateGender(profileUser?.gender)}</li>
        </ul>
      </div>

      <div className="card appointments">
        <h2 className="section-title">Lịch hẹn của bạn</h2>
        {appointments.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Ngày hẹn</th>
                <th>Bác sĩ</th>
                <th>Khoa</th>
                <th>Trạng thái</th>
                <th>Đã khám</th>
                <th>Kết quả AI</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item._id}>
                  <td>{item.appointment_date.substring(0, 16)}</td>
                  <td>{item.doctor.firstName} {item.doctor.lastName}</td>
                  <td>{translateDepartment(item.department)}</td>
                  <td>{translateStatus(item.status)}</td>
                  <td>{item.hasVisited ? "✓" : "✗"}</td>
                  <td>
                    {item.result ? (
                      item.result.fractureDetected ? (
                        <span className="ai-result success">
                          {item.result.region}
                        </span>
                      ) : (
                        <span className="ai-result normal">
                          Không phát hiện gãy xương
                        </span>
                      )
                    ) : (
                      <span className="ai-result pending">Đang xử lý kết quả AI</span>
                    )}
                  </td>
                  <td>
                    {item.status === "Pending" ? (
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelAppointment(item._id)}
                      >
                        Huỷ
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Bạn chưa có lịch hẹn nào.</p>
        )}
      </div>
    </section>
  );
};

export default Profile;