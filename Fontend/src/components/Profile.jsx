import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Context } from "../context";
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
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/profile",
          { withCredentials: true }
        );

        console.log("Dữ liệu hồ sơ:", data);

        if (data.user) {
          setProfileUser(data.user);
          
          if (data.user.appointments && Array.isArray(data.user.appointments)) {
            console.log("Danh sách lịch hẹn:", data.user.appointments);
            // ✅ Log chi tiết appointment đầu tiên
            if (data.user.appointments.length > 0) {
              console.log("Chi tiết appointment[0]:", data.user.appointments[0]);
              console.log("Result của appointment[0]:", data.user.appointments[0].result);
              console.log("Keys của appointment[0]:", Object.keys(data.user.appointments[0]));
            }
            setAppointments(data.user.appointments);
          } else {
            fetchAppointments();
          }
        } else {
          toast.error("Không thể lấy hồ sơ");
        }
      } catch (error) {
        console.error("Lỗi khi lấy hồ sơ:", error);
        console.error("Error response:", error.response);
        console.error("Error status:", error.response?.status);
        console.error("Error message:", error.response?.data?.message);
        toast.error(error.response?.data?.message || "Không thể lấy hồ sơ");
      }
    };

    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/appointment/getall",
          { withCredentials: true }
        );
        
        if (data.appointments) {
          console.log("Danh sách lịch hẹn (fallback):", data.appointments);
          setAppointments(data.appointments);
        }
      } catch (error) {
        console.error("Lỗi khi lấy lịch hẹn:", error);
      }
    };

    fetchProfile();
  }, []);

  const handleCancelAppointment = async (id) => {
    if (!window.confirm("Bạn có chắc muốn huỷ lịch hẹn này?")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/user/appointment/delete/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message || "Huỷ lịch hẹn thành công!");
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

  const renderAIResult = (result) => {
    console.log("Rendering AI result:", result);
    console.log("Result type:", typeof result);
    console.log("Result is null?", result === null);
    console.log("Result is undefined?", result === undefined);

    if (result && typeof result === "object" && Object.keys(result).length === 0) {
      return (
        <div className="ai-result-container">
          <span className="ai-result pending">Chưa có kết quả</span>
        </div>
      );
    }
    
    if (!result || result === null || result === undefined) {
      return (
        <div className="ai-result-container">
          <span className="ai-result pending">Chưa có kết quả</span>
        </div>
      );
    }

    // Nếu result là object
    if (typeof result === "object" && result !== null) {
      const fractureDetected = result.fractureDetected || result.detected || false;
      const confidence = result.confidence || 0;
      const region = result.region || result.location || "";
      const totalDetections = result.detections?.length || result.totalDetections || 0;

      return (
        <div className="ai-result-simple">
          {fractureDetected ? (
            <>
              <div className="result-status danger-text">⚠️ Phát hiện gãy xương</div>
              <div className="result-detail-item">
                Độ tin cậy: <strong>{confidence.toFixed(1)}%</strong>
              </div>
              {region && region !== "Chưa xác định" && region !== "" && (
                <div className="result-detail-item">
                  Vùng: <strong>{region}</strong>
                </div>
              )}
              {totalDetections > 0 && (
                <div className="result-detail-item">
                  Số vùng: <strong>{totalDetections}</strong>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="result-status success-text">✓ Không phát hiện gãy xương</div>
              <div className="result-detail-item">
                Độ tin cậy: <strong>{confidence.toFixed(1)}%</strong>
              </div>
            </>
          )}
        </div>
      );
    }

    // Nếu result là string
    if (typeof result === "string") {
      return (
        <div className="ai-result-container">
          <span className="ai-result normal">{result}</span>
        </div>
      );
    }

    return (
      <div className="ai-result-container">
        <span className="ai-result pending">Chưa có kết quả</span>
      </div>
    );
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!profileUser) return <p>Đang tải hồ sơ...</p>;

  return (
    <section className="page profile">
      <h1 className="profile-title">Hồ sơ</h1>
      <p>
        Xin chào <strong>{profileUser.lastName} {profileUser.firstName}</strong>! Đây là thông tin cá nhân và lịch hẹn của bạn.
      </p>

      <div className="card info">
        <h2 className="section-title">Thông tin cá nhân</h2>
        <ul>
          <li><strong>Email:</strong> {profileUser.email}</li>
          <li><strong>Số điện thoại:</strong> {profileUser.phone || "Chưa cập nhật"}</li>
          <li><strong>Ngày sinh:</strong> {profileUser.dob ? profileUser.dob.substring(0, 10) : "Chưa cập nhật"}</li>
          <li><strong>Giới tính:</strong> {translateGender(profileUser.gender)}</li>
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
              {appointments.map((item) => {
                console.log("=== CHI TIẾT LỊCH HẸN ===");
                console.log("Full appointment object:", item);
                console.log("Trường result:", item.result);
                console.log("Result type:", typeof item.result);
                console.log("Result keys:", item.result ? Object.keys(item.result) : "null");
                console.log("fractureDetected:", item.result?.fractureDetected);
                console.log("confidence:", item.result?.confidence);
                console.log("========================");
                
                const doctorName = item.doctorId 
                  ? `${item.doctorId.lastName || ''} ${item.doctorId.firstName || ''}`.trim()
                  : (item.doctor 
                    ? `${item.doctor.lastName || ''} ${item.doctor.firstName || ''}`.trim()
                    : "N/A");

                return (
                  <tr key={item._id}>
                    <td>{item.appointment_date?.substring(0, 16).replace('T', ' ') || "N/A"}</td>
                    <td>{doctorName}</td>
                    <td>{translateDepartment(item.department)}</td>
                    <td>
                      <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                        {translateStatus(item.status)}
                      </span>
                    </td>
                    <td>{item.hasVisited ? "✓" : "✗"}</td>
                    <td>{renderAIResult(item.result)}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelAppointment(item._id)}
                        title="Huỷ lịch hẹn"
                      >
                        Huỷ
                      </button>
                    </td>
                  </tr>
                );
              })}
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