
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./XrayDiagnosis.css";

const XrayDiagnosis = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [appointmentId, setAppointmentId] = useState(null);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const { data } = await axios.get("http://localhost:4000/api/v1/user/patient/me", {
          withCredentials: true,
        });
        setPatientId(data?.user?._id || null);
      } catch (error) {
        console.error("Fetch patient error:", error);
      }
    };
    fetchPatient();
  }, []);


  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const { data } = await axios.get("http://localhost:4000/api/v1/appointment/getall", {
          withCredentials: true,
        });
        const myAppointments = data.appointments.filter(
          (item) => item.patientId === patientId && ["Pending", "Confirmed", "Accepted"].includes(item.status)
        );
        console.log("Lịch hẹn tìm thấy:", myAppointments);
        if (myAppointments.length > 0) {
          setAppointmentId(myAppointments[0]._id);
        }
      } catch (error) {
        console.error("Fetch appointment error:", error);
      }
    };

    if (patientId) {
      fetchAppointment();
    }
  }, [patientId]);
    // Vẽ khoanh vùng lên canvas
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

        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, w, h);

        ctx.font = "20px Arial";
        ctx.fillStyle = "#FF0000";
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
    if (!patientId || !appointmentId) return alert("Thiếu thông tin bệnh nhân hoặc lịch hẹn!");

    setLoading(true);
    const formData = new FormData();
    formData.append("xrayImage", image);
    formData.append("patientId", patientId);
    formData.append("appointmentId", appointmentId);

    try {
      const { data } = await axios.post("http://localhost:4000/api/v1/xray/diagnose", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setResult({
        ...data.data,
        annotatedImageUrl: data.data.annotatedImage || data.data.imageUrl || preview,
      });
    } catch (error) {
      console.error("Submit error:", error);
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
    return (
    <div className="xray-diagnosis-page">
      <div className="xray-container">
        <div className="xray-header">
          <h1>Chẩn Đoán Hình Ảnh X-Quang</h1>
          <p>Công nghệ AI tiên tiến phát hiện xương gãy nhanh chóng và chính xác</p>
        </div>

        <div className="xray-grid">
          {/* Upload Section */}
          <div className="upload-section">
            <h2>📤 Upload Ảnh X-Quang</h2>
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
                  {loading ? "Đang phân tích..." : " Phân tích ngay"}
                </button>
                {(image || result) && (
                  <button onClick={handleReset} disabled={loading} className="btn btn-secondary">
                     Làm mới
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className={`results-section ${!result ? "empty" : ""}`}>
            {result ? (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <h2>Kết quả phân tích</h2>
                  
                </div>
                <div style={{ position: "relative" }}>
                  <img ref={imageRef} src={result.annotatedImageUrl} alt="X-ray" style={{ width: "100%" }} />
                  {showAnnotations && (
                    <canvas
                      ref={canvasRef}
                      style={{
                        position: "absolute",
                        top: 0,
                        left:0,
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

                {/* Kết quả chi tiết */}
                <div className="result-card">
                  <h2> Kết Quả Chẩn Đoán</h2>

                  <div className="result-item">
                    <span className="result-label">Kết quả:</span>
                    <span
                      className={`result-value ${
                        result.result.includes("gãy") || result.result.includes("Phát hiện")
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {result.result}
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

                  {(result.result?.toLowerCase().includes("gãy") || result.totalDetections > 0) && (
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
                      <h3> Chi tiết các vùng phát hiện:</h3>
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
                <div className="empty-state-icon">📋</div>
                <p>Kết quả sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Chính Xác Cao</h3>
            <p>Sử dụng mô hình AI được huấn luyện trên hàng nghìn ảnh X-quang</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Nhanh Chóng</h3>
            <p>Kết quả chẩn đoán trong vài giây, tiết kiệm thời gian chờ đợi</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"></div>
            <h3>Bảo Mật</h3>
            <p>Dữ liệu của bạn được mã hóa và bảo mật tuyệt đối</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XrayDiagnosis;
                        