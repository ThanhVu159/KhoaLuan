import React from "react";

const Hero = ({ title, imageUrl }) => {
  return (
    <div className="hero container">
      <div className="banner">
        <h1>{title}</h1>
        <p>
         Medical AI là cơ sở chăm sóc sức khỏe hiện đại, tận tâm mang đến dịch vụ y tế toàn diện với đội ngũ chuyên gia giàu kinh nghiệm.
Chúng tôi cam kết cung cấp giải pháp chăm sóc cá nhân hóa, phù hợp với từng nhu cầu riêng biệt của bệnh nhân.
Tại Medical AI, sức khỏe của bạn luôn là ưu tiên hàng đầu — hướng đến hành trình phục hồi toàn diện và bền vững.
        </p>
      </div>

      <div className="banner">
        <img src={imageUrl} alt="hero" className="animated-image" />
        <span>
          <img src="/vector.png" alt="vector" />
        </span>
      </div>
    </div>
  );
};

export default Hero;
