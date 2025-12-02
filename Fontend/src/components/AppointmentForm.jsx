import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const AppointmentForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [department, setDepartment] = useState("Nhi khoa");
  const [doctorFirstName, setDoctorFirstName] = useState("");
  const [doctorLastName, setDoctorLastName] = useState("");
  const [address, setAddress] = useState("");
  const [hasVisited, setHasVisited] = useState(false);


  const departmentsArray = [
    "Nhi khoa",
    "Chấn thương chỉnh hình",
    "Tim mạch",
    "Thần kinh",
    "Ung thư",
    "Chẩn đoán hình ảnh X-quang",
    "Vật lý trị liệu",
    "Da liễu",
    "Tai - Mũi - Họng",
  ];


  const departmentMap = {
    "Nhi khoa": "Pediatrics",
    "Chấn thương chỉnh hình": "Orthopedics",
    "Tim mạch": "Cardiology",
    "Thần kinh": "Neurology",
    "Ung thư": "Oncology",
    "Chẩn đoán hình ảnh X-quang": "Radiology",
    "Vật lý trị liệu": "Physical Therapy",
    "Da liễu": "Dermatology",
    "Tai - Mũi - Họng": "ENT",
  };

  const [doctors, setDoctors] = useState([]);

 
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/doctors",
          { withCredentials: true }
        );
        setDoctors(data.doctors);
        console.log("Danh sách bác sĩ:", data.doctors); 
      } catch (error) {
        console.error("Lỗi khi tải danh sách bác sĩ:", error);
        toast.error("Không thể tải danh sách bác sĩ");
      }
    };
    fetchDoctors();
  }, []);

  // Gửi form đặt lịch hẹn
  const handleAppointment = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/appointment/post",
        {
          firstName,
          lastName,
          email,
          phone,
          dob,
          gender,
          appointment_date: appointmentDate,
          department: departmentMap[department], 
          doctor_firstName: doctorFirstName,
          doctor_lastName: doctorLastName,
          hasVisited,
          address,
        },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(data.message);

      // reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setDob("");
      setGender("");
      setAppointmentDate("");
      setDepartment("Nhi khoa");
      setDoctorFirstName("");
      setDoctorLastName("");
      setHasVisited(false);
      setAddress("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đặt lịch thất bại!");
    }
  };

  // Lọc bác sĩ theo khoa đã chọn
  const filteredDoctors = doctors.filter(
    (doctor) => doctor.doctorDepartment === departmentMap[department]
  );

  return (
    <div className="container form-component appointment-form">
      <h2>Đặt lịch hẹn</h2>
      <p>Vui lòng điền thông tin bên dưới để đặt lịch khám với bác sĩ của bạn.</p>

      <form onSubmit={handleAppointment}>
        <div>
          <input
            type="text"
            placeholder="Họ"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Tên"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div>
          <input
            type="email"
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
        </div>

        <div>
          <input
            type="date"
            placeholder="Ngày sinh"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
          <select value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">Chọn giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
          </select>
        </div>

        <div>
          <input
            type="date"
            placeholder="Ngày hẹn khám"
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
          />
          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDoctorFirstName("");
              setDoctorLastName("");
            }}
          >
            {departmentsArray.map((depart, index) => (
              <option value={depart} key={index}>
                {depart}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={
              doctorFirstName && doctorLastName
                ? JSON.stringify({
                    firstName: doctorFirstName,
                    lastName: doctorLastName,
                  })
                : ""
            }
            onChange={(e) => {
              if (e.target.value) {
                const { firstName, lastName } = JSON.parse(e.target.value);
                setDoctorFirstName(firstName);
                setDoctorLastName(lastName);
              } else {
                setDoctorFirstName("");
                setDoctorLastName("");
              }
            }}
            disabled={!department}
          >
            <option value="">Chọn bác sĩ</option>
            {filteredDoctors.map((doctor, index) => (
              <option
                key={index}
                value={JSON.stringify({
                  firstName: doctor.firstName,
                  lastName: doctor.lastName,
                })}
              >
                {doctor.firstName} {doctor.lastName}
              </option>
            ))}
          </select>
          {}
          {department && (
            <small style={{ color: "#666", marginTop: "5px", display: "block" }}>
              Tìm thấy {filteredDoctors.length} bác sĩ trong khoa {department}
            </small>
          )}
        </div>

        <textarea
          rows="8"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Địa chỉ"
        />

        <div
          style={{
            gap: "10px",
            justifyContent: "flex-end",
            flexDirection: "row",
            display: "flex",
            alignItems: "center",
          }}
        >
          <p style={{ marginBottom: 0 }}>Bạn đã từng đến khám trước đây chưa?</p>
          <input
            type="checkbox"
            checked={hasVisited}
            onChange={(e) => setHasVisited(e.target.checked)}
            style={{ flex: "none", width: "25px" }}
          />
        </div>

        <button style={{ margin: "0 auto" }}>Đặt lịch ngay</button>
      </form>
    </div>
  );
};

export default AppointmentForm;