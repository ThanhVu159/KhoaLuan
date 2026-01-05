import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./XrayDiagnosis.css";

const XrayDiagnosis = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [appointmentId, setAppointmentId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/user/appointment/getall",
          { withCredentials: true, headers: { "Cache-Control": "no-cache" } }
        );

        console.log("Raw response:", data);

        const myAppointments = (data.appointments || [])
          .filter((item) =>
            ["Pending", "Confirmed", "Accepted"].includes(item.status)
          )
          .sort(
            (a, b) =>
              new Date(b.appointment_date) - new Date(a.appointment_date)
          );

        console.log("Lịch hẹn sau khi filter và sort (mới nhất đầu tiên):", myAppointments);
        setAppointments(myAppointments);

        if (myAppointments.length > 0) {
          const newestAppointment = myAppointments[0];
          setAppointmentId(newestAppointment._id);
          console.log("Tự động chọn lịch hẹn MỚI NHẤT:");
          console.log("   - ID:", newestAppointment._id);
          console.log("   - Ngày:", newestAppointment.appointment_date);
          console.log("   - Status:", newestAppointment.status);
        } else {
          setAppointmentId(null);
          console.warn("Không có lịch hẹn phù hợp");
        }
      } catch (error) {
        console.error("Fetch appointment error:", error);
        console.error("Error response:", error.response?.data);
      }
    };

    fetchAppointments();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Trang được hiển thị lại, refetch appointments...");
        fetchAppointments();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!result?.detections || !canvasRef.current || !imageRef.current || !showAnnotations) return;

    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!img.complete) {
      img.onload = () => drawAnnotations();
      return;
    }

    drawAnnotations();

    function drawAnnotations() {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      result.detections.forEach((det, idx) => {
        if (!det.box) return;
        const x = det.box.x ?? det.box.x1 ?? 0;
        const y = det.box.y ?? det.box.y1 ?? 0;
        const w = det.box.width ?? (det.box.x2 ? det.box.x2 - x : 0);
        const h = det.box.height ?? (det.box.y2 ? det.box.y2 - y : 0);

        ctx.strokeStyle = "#e12a11ff";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#e12a11ff";
        ctx.fillText(`Vùng ${idx + 1}`, x + 5, y > 20 ? y - 5 : y + 20);
      });
    }
  }, [result, showAnnotations]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(file.type)) {
        alert("Chỉ chấp nhận file PNG, JPG, JPEG!");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert("Kích thước file không được vượt quá 10MB!");
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!image) return alert("Vui lòng chọn ảnh X-quang!");

    setLoading(true);

    const formData = new FormData();
    formData.append("xrayImage", image);

    if (appointmentId) {
      formData.append("appointmentId", appointmentId);
      console.log("Sending appointmentId to backend:", appointmentId);
    } else {
      console.warn("No appointmentId available");
    }

    try {
      const { data } = await axios.post(
        "http://localhost:4000/api/v1/xray/diagnose",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      console.log("Response from backend:", data);
      console.log("appointmentUpdated:", data.appointmentUpdated);

      const diagnosisResult = {
        ...data.data,
        annotatedImageUrl: data.data.annotatedImage || data.data.imageUrl || preview,
      };

      setResult(diagnosisResult);

      if (appointmentId && data.appointmentUpdated) {
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 5000);
        console.log("Backend đã tự động cập nhật kết quả vào hồ sơ");

        try {
          const profileRes = await axios.get(
            "http://localhost:4000/api/v1/user/profile",
            { withCredentials: true }
          );
          console.log("Hồ sơ sau khi cập nhật:", profileRes.data.user);
          
          const updatedAppointment = profileRes.data.user.appointments?.find(
            apt => apt._id === appointmentId
          );
          if (updatedAppointment) {
            console.log("Appointment đã có result:", updatedAppointment.result);
          } else {
            console.warn("Không tìm thấy appointment trong profile");
          }
        } catch (err) {
          console.error("Lỗi khi refresh hồ sơ:", err);
        }
      } else {
        if (!appointmentId) {
          console.warn("Không có appointmentId để cập nhật");
        }
        if (!data.appointmentUpdated) {
          console.warn("Backend báo appointment không được cập nhật");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      console.error("Error response:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Có lỗi xảy ra khi phân tích!";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResult(null);
    setUpdateSuccess(false);
  };

  const downloadAnnotatedImage = () => {
    if (canvasRef.current && imageRef.current) {
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = imageRef.current.naturalWidth;
      tempCanvas.height = imageRef.current.naturalHeight;
      tempCtx.drawImage(imageRef.current, 0, 0);
      if (showAnnotations) tempCtx.drawImage(canvasRef.current, 0, 0);
      const link = document.createElement("a");
      link.download = `xray_diagnosis_${Date.now()}.png`;
      link.href = tempCanvas.toDataURL("image/png");
      link.click();
    }
  };

  const hasFractureIndication = () => {
    if (!result) return false;
    if (typeof result.result === 'object' && result.result !== null) {
      return result.result.fractureDetected || result.totalDetections > 0;
    }
    const resultText = String(result.result || "").toLowerCase();
    return resultText.includes("gãy") || resultText.includes("phát hiện") || result.totalDetections > 0;
  };

  const getResultText = () => {
    if (!result || !result.result) return "Không xác định";
    if (typeof result.result === 'object' && result.result !== null) {
      return result.result.fractureDetected 
        ? "Phát hiện dấu hiệu gãy xương" 
        : "Không phát hiện dấu hiệu gãy xương";
    }
    return result.result;
  };

  return (
    <div className="xray-diagnosis-page">
      <div className="xray-container">
        <div className="xray-header">
          <h1>Chẩn Đoán Hình Ảnh X-Quang</h1>
          <p>Công nghệ AI tiên tiến phát hiện xương gãy nhanh chóng và chính xác</p>
          
          {appointments.length === 0 && (
            <div style={{
              background: "#fff3cd",
              padding: "12px 16px",
              borderRadius: "8px",
              marginTop: "16px",
              color: "#856404"
            }}>
              Bạn chưa có lịch hẹn nào. Vui lòng đặt lịch trước khi chuẩn đoán.
            </div>
          )}
        </div>

        <div className="xray-grid">
          <div className="upload-section">
            <h2>Upload Ảnh X-Quang</h2>
            
            {/* Dropdown chọn lịch hẹn */}
            {appointments.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "8px", 
                  fontWeight: "600",
                  fontSize: "14px"
                }}>
                  Chọn lịch hẹn để lưu kết quả:
                </label>
                <select
                  value={appointmentId || ""}
                  onChange={(e) => {
                    setAppointmentId(e.target.value);
                    console.log("Đã chọn appointment:", e.target.value);
                  }}
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "14px",
                    border: "2px solid #e2e8f0",
                    borderRadius: "8px",
                    background: "white",
                    cursor: "pointer"
                  }}
                >
                  {appointments.map((apt) => {
                    const doctorName = apt.doctorId 
                      ? `${apt.doctorId.lastName || ''} ${apt.doctorId.firstName || ''}`.trim()
                      : (apt.doctor 
                        ? `${apt.doctor.lastName || ''} ${apt.doctor.firstName || ''}`.trim()
                        : "N/A");
                    
                    const date = new Date(apt.appointment_date).toLocaleString('vi-VN');
                    
                    return (
                      <option key={apt._id} value={apt._id}>
                        {date} - BS: {doctorName} - {apt.department}
                      </option>
                    );
                  })}
                </select>
                <small style={{ 
                  display: "block", 
                  marginTop: "6px", 
                  color: "#666",
                  fontSize: "12px"
                }}>
                  Kết quả AI sẽ được lưu vào lịch hẹn này
                </small>
              </div>
            )}
            
            <div>
              <div className={`upload-box ${preview ? "has-image" : ""}`}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleImageChange}
                  id="xray-upload"
                  disabled={loading}
                  style={{ display: "none" }}
                />
                <label htmlFor="xray-upload" style={{ cursor: "pointer", display: "block" }}>
                  {preview ? (
                    <div className="image-preview">
                      <img src={preview} alt="Preview" ref={imageRef} />
                      <div className="filename">{image?.name}</div>
                    </div>
                  ) : (
                    <>
                      <div className="upload-text">
                        <h3>Click để chọn ảnh X-quang</h3>
                        <p>Hỗ trợ: PNG, JPG, JPEG (tối đa 10MB)</p>
                      </div>
                    </>
                  )}
                </label>
              </div>

              <div className="button-group">
                <button onClick={handleSubmit} disabled={!image || loading} className="btn btn-primary">
                  {loading ? "Đang phân tích..." : "Phân tích ngay"}
                </button>
                {(image || result) && (
                  <button onClick={handleReset} disabled={loading} className="btn btn-secondary">
                    Làm mới
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`results-section ${!result ? "empty" : ""}`}>
            {result ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <h2>Kết quả phân tích</h2>
                  
                  {updateSuccess && (
                    <div style={{
                      background: "#d4edda",
                      border: "1px solid #c3e6cb",
                      color: "#155724",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}>
                      <span>Đã cập nhật kết quả vào hồ sơ bệnh án thành công!</span>
                    </div>
                  )}

                  <div className="ai-disclaimer">
                    <p style={{ fontStyle: "italic", color: "#f54f4ff9", marginTop: "16px" }}>
                      *Kết quả phân tích chỉ mang tính chất tham khảo từ hệ thống AI.
                      Vui lòng trao đổi thêm với bác sĩ chuyên môn để có chẩn đoán chính xác.*
                    </p>
                  </div>
                </div>

                <div style={{ position: "relative" }}>
                  <img ref={imageRef} src={result.annotatedImageUrl} alt="X-ray" style={{ width: "100%" }} />
                  {showAnnotations && (
                    <canvas
                      ref={canvasRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>

                <div className="result-card">
                  <h2>Kết Quả Chẩn Đoán</h2>

                  <div className="result-item">
                    <span className="result-label">Kết quả:</span>
                    <span
                      className={`result-value ${hasFractureIndication() ? "positive" : "negative"}`}
                    >
                      {getResultText()}
                    </span>
                  </div>

                  <div className="result-item">
                    <span className="result-label">Độ tin cậy:</span>
                    <span className="result-value confidence">{result.confidence}%</span>
                  </div>

                  {result.totalDetections > 0 && (
                    <div className="result-item">
                      <span className="result-label">Số vùng phát hiện:</span>
                      <span className="result-value detection-count">
                        {result.totalDetections}
                      </span>
                    </div>
                  )}

                  {hasFractureIndication() && (
                    <div className="doctor-warning">
                      <div className="doctor-warning-icon"></div>
                      <div className="doctor-warning-text">
                        <strong>Nghi ngờ có dấu hiệu gãy xương!</strong>
                        <p>
                          Hệ thống AI phát hiện bất thường. Vui lòng sắp xếp gặp bác sĩ chuyên khoa
                          để được chẩn đoán và điều trị chính xác.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="details-box">
                    <p>{result.details}</p>
                  </div>

                  {result.detections && result.detections.length > 0 && (
                    <div className="detections-list">
                      <h3>Chi tiết các vùng phát hiện:</h3>
                      {result.detections.map((det, idx) => (
                        <div key={idx} className="detection-item">
                          <div style={{ flex: 1 }}>
                            <span className="detection-name" style={{ fontWeight: "700" }}>
                              {det.class}
                            </span>
                            {det.box && (
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#718096",
                                  fontFamily: "monospace",
                                  background: "#f7fafc",
                                  padding: "4px 8px",
                                  borderRadius: "4px",
                                  display: "inline-block",
                                  marginTop: "4px",
                                }}
                              >
                                Vùng {idx + 1}
                              </div>
                            )}
                          </div>
                          <span className="detection-confidence" style={{ fontSize: "1.15rem" }}>
                            {det.confidence}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Kết quả sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Chính Xác Cao</h3>
            <p>Sử dụng mô hình AI được huấn luyện trên hàng nghìn ảnh X-quang</p>
          </div>
          <div className="feature-card">
            <h3>Nhanh Chóng</h3>
            <p>Kết quả chẩn đoán trong vài giây, tiết kiệm thời gian chờ đợi</p>
          </div>
          <div className="feature-card">
            <h3>Bảo Mật</h3>
            <p>Dữ liệu của bạn được mã hóa và bảo mật tuyệt đối</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XrayDiagnosis;