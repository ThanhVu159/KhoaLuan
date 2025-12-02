import React from "react";

const Biography = ({ imageUrl }) => {
  return (
    <>
      <div className="container biography">
        <div className="banner">
          <img src={imageUrl} alt="about-us" />
        </div>
        <div className="banner">
          <p>Giới thiệu</p>
          <h3>Chúng tôi là ai</h3>
          <p>
            Medical AI là hệ thống hỗ trợ quản lý và chẩn đoán hình ảnh X-quang
            thông minh, giúp bác sĩ đưa ra đánh giá nhanh và chính xác hơn.
          </p>
          <p>
            Được phát triển trên nền tảng MERN Stack kết hợp công nghệ Trí tuệ
            nhân tạo (AI), hệ thống mang đến trải nghiệm khám chữa bệnh tiện
            lợi, bảo mật và hiện đại.
          </p>
          <p>
            Chúng tôi tin rằng công nghệ có thể giúp rút ngắn khoảng cách giữa
            bác sĩ và bệnh nhân — để việc chăm sóc sức khỏe trở nên dễ dàng và
            hiệu quả hơn.
          </p>
          <p>
            Medical AI – Nơi công nghệ và y học cùng đồng hành vì sức khỏe cộng
            đồng.
          </p>
        </div>
      </div>
    </>
  );
};

export default Biography;
