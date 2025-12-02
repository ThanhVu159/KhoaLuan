import React, { useContext, useEffect, useState } from "react";
import { Context } from "../context"; 
import { Navigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { GoCheckCircleFill } from "react-icons/go";
import { AiFillCloseCircle } from "react-icons/ai";

const departmentMap = {
  pediatrics: "Nhi",
  cardiology: "Tim mạch",
  neurology: "Thần kinh",
  dermatology: "Da liễu",
  oncology: "Ung bướu",
  orthopedics: "Chỉnh hình",
  ophthalmology: "Mắt",
  gynecology: "Phụ sản",
  ent: "Tai – Mũi – Họng",
};

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const { isAuthenticated, admin } = useContext(Context); 

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/doctors",
          { withCredentials: true }
        );
        setDoctors(data.doctors);
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách bác sĩ");
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/appointment/getall",
          { withCredentials: true }
        );
        setAppointments(data.appointments);
      } catch (error) {
        toast.error("Lỗi khi lấy danh sách lịch hẹn");
        setAppointments([]);
      }
    };
    fetchAppointments();
  }, []);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/v1/appointment/update/${appointmentId}`,
        { status },
        { withCredentials: true }
      );
      setAppointments((prev) =>
        prev.map((item) =>
          item._id === appointmentId ? { ...item, status } : item
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Cập nhật trạng thái thất bại");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn xoá lịch hẹn này?")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/appointment/delete/${appointmentId}`,
        { withCredentials: true }
      );
      setAppointments((prev) =>
        prev.filter((item) => item._id !== appointmentId)
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Xoá lịch hẹn thất bại");
    }
  };

  if (!isAuthenticated || !admin || admin.role !== "Admin") {
    return <Navigate to="/login" />;
  }

  return (
    <section className="dashboard page">
      <div className="banner">
        <div className="firstBox">
          <img src="/doc.png" alt="docImg" />
          <div className="content">
            <div>
              <p>Xin chào</p>
              <h5>{admin && `${admin.firstName} ${admin.lastName}`}</h5>
            </div>
            <p>
              Chào mừng quay lại bảng điều khiển quản trị. Hãy kiểm tra và quản lý lịch hẹn, bác sĩ và thông tin hệ thống.
            </p>
          </div>
        </div>

        <div className="secondBox">
          <p>Tổng số lịch hẹn</p>
          <h3>{appointments.length}</h3>
        </div>

        <div className="thirdBox">
          <p>Bác sĩ đã đăng ký</p>
          <h3>{doctors.length}</h3>
        </div>
      </div>

      <div className="banner">
        <h5>Danh sách lịch hẹn</h5>

        <table>
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Ngày hẹn</th>
              <th>Bác sĩ</th>
              <th>Khoa</th>
              <th>Trạng thái</th>
              <th>Đã khám</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>{`${appointment.firstName} ${appointment.lastName}`}</td>
                  <td>
                    {appointment.appointment_date
                      ? appointment.appointment_date.substring(0, 16)
                      : "Không có ngày"}
                  </td>
                  <td>
                    {appointment.doctor
                      ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                      : "Chưa có bác sĩ"}
                  </td>
                  <td>
                    {departmentMap[appointment.department?.toLowerCase()] ||
                      appointment.department}
                  </td>
                  <td>
                    <select
                      className={
                        appointment.status === "Pending"
                          ? "value-pending"
                          : appointment.status === "Accepted"
                          ? "value-accepted"
                          : "value-rejected"
                      }
                      value={appointment.status}
                      onChange={(e) =>
                        handleUpdateStatus(appointment._id, e.target.value)
                      }
                    >
                      <option value="Pending" className="value-pending">Đang chờ</option>
                      <option value="Accepted" className="value-accepted">Đã duyệt</option>
                      <option value="Rejected" className="value-rejected">Từ chối</option>
                    </select>
                  </td>
                  <td>
                    {appointment.hasVisited ? (
                      <GoCheckCircleFill className="green" />
                    ) : (
                      <AiFillCloseCircle className="red" />
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteAppointment(appointment._id)}
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">Không có lịch hẹn nào!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Dashboard;