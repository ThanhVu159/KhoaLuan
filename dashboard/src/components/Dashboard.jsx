import React, { useContext, useEffect, useState } from "react";
import { Context } from "../main";
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
  const [doctors, setDoctors] = useState([]); // ✅ thêm state

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/appointment/getall",
          { withCredentials: true }
        );
        setAppointments(data.appointments);
      } catch (error) {
        setAppointments([]);
      }
    };

    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/doctor",
          { withCredentials: true }
        );
        setDoctors(data.doctors);
      } catch (error) {
        setDoctors([]);
      }
    };

    fetchAppointments();
    fetchDoctors();
  }, []);

  const handleUpdateStatus = async (appointmentId, status) => {
    try {
      const { data } = await axios.put(
        `http://localhost:4000/api/v1/appointment/update/${appointmentId}`,
        { status },
        { withCredentials: true }
      );
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status }
            : appointment
        )
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm("Bạn có chắc muốn xoá lịch hẹn này?")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/appointment/delete/${appointmentId}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment._id !== appointmentId)
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const { isAuthenticated, admin, loading } = useContext(Context);

  if (loading) return <p>Loading...</p>;
  if (!isAuthenticated) return <Navigate to={"/login"} />;

  return (
    <section className="dashboard page">
      <div className="banner">
        <div className="firstBox">
          <img src="/doc.png" alt="docImg" />
          <div className="content">
            <div>
              <p>Hello ,</p>
              <h5>
                {admin && admin.firstName && admin.lastName
                  ? `${admin.firstName} ${admin.lastName}`
                  : "Admin"}
              </h5>
            </div>
            <p>
              Chào mừng bạn đến với Dashboard. Đây là nơi quản lý lịch hẹn và bác sĩ.
            </p>
          </div>
        </div>
        <div className="secondBox">
          <p>Total Appointments</p>
          <h3>{appointments.length}</h3>
        </div>
        <div className="thirdBox">
          <p>Registered Doctors</p>
          <h3>{doctors.length}</h3> {/* ✅ hiển thị số lượng bác sĩ */}
        </div>
      </div>

      <div className="banner">
        <h5>Appointments</h5>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Date</th>
              <th>Doctor</th>
              <th>Department</th>
              <th>Status</th>
              <th>Visited</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {appointments && appointments.length > 0 ? (
              appointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>
                    {appointment.patientId
                      ? `${appointment.patientId.firstName} ${appointment.patientId.lastName}`
                      : "N/A"}
                  </td>
                  <td>{appointment.appointment_date?.substring(0, 16) || "N/A"}</td>
                  <td>
                    {appointment.doctorId
                      ? `${appointment.doctorId.firstName} ${appointment.doctorId.lastName}`
                      : "N/A"}
                  </td>
                  <td>
                    {departmentMap[appointment.department?.toLowerCase()] ||
                      appointment.department ||
                      "N/A"}
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
                      <option value="Pending" className="value-pending">
                        Pending
                      </option>
                      <option value="Accepted" className="value-accepted">
                        Accepted
                      </option>
                      <option value="Rejected" className="value-rejected">
                        Rejected
                      </option>
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
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No Appointments Found!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default Dashboard;