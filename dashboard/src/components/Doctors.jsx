import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

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

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const { isAuthenticated } = useContext(Context);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/doctor", // ✅ lấy danh sách bác sĩ
          { withCredentials: true }
        );
        setDoctors(data.doctors);
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi lấy danh sách bác sĩ");
      }
    };
    fetchDoctors();
  }, []);

  const handleDeleteDoctor = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá bác sĩ này?")) return;
    setDeletingId(id);
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/doctor/${id}`, // ✅ sửa đúng endpoint
        { withCredentials: true }
      );
      toast.success(data.message);
      setDoctors((prev) => prev.filter((doc) => doc._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Xoá bác sĩ thất bại!");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page doctors">
      <h1>DANH SÁCH BÁC SĨ</h1>
      <div className="banner">
        {doctors && doctors.length > 0 ? (
          doctors.map((element) => (
            <div className="card" key={element._id}>
              <img src={element.docAvatar?.url} alt="doctor avatar" />
              <h4>{`${element.firstName} ${element.lastName}`}</h4>
              <div className="details">
                <p>Email: <span>{element.email}</span></p>
                <p>Số điện thoại: <span>{element.phone}</span></p>
                <p>Ngày sinh: <span>{element.dob?.substring(0, 10)}</span></p>
                <p>
                  Khoa:{" "}
                  <span>
                    {departmentMap[element.doctorDepartment?.toLowerCase()] ||
                      element.doctorDepartment}
                  </span>
                </p>
                <p>Giới tính: <span>{element.gender}</span></p>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteDoctor(element._id)}
                disabled={deletingId === element._id}
              >
                {deletingId === element._id ? "Đang xoá..." : "Xoá"}
              </button>
            </div>
          ))
        ) : (
          <h1>Không tìm thấy bác sĩ nào!</h1>
        )}
      </div>
    </section>
  );
};

export default Doctors;