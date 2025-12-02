import React from "react";
import { Link } from "react-router-dom";
import { FaLocationArrow, FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";

const Footer = () => {
  const hours = [
    {
      id: 1,
      day: "Thứ Hai",
      time: "9:00 AM - 11:00 PM",
    },
    {
      id: 2,
      day: "Thứ Ba",
      time: "9:00 PM - 12:00 AM",
    },
    {
      id: 3,
      day: "Thứ Tư",
      time: "8:00 AM - 10:00 PM",
    },
    {
      id: 4,
      day: "Thứ Năm",
      time: "8:00 AM - 9:00 PM",
    },
    {
      id: 5,
      day: "Thứ Sáu",
      time: "8:00 PM - 9:00 PM",
    },
    {
      id: 6,
      day: "Thứ bảy",
      time: "9:00 AM - 3:00 PM",
    },
  ];

  return (
    <>
      <footer className={"container"}>
        <hr />
        <div className="content">
          <div>
            <img src="/logo.png" alt="logo" className="logo-img"/>
          </div>
          <div>
            <h4>Truy cập nhanh</h4>
            <ul>
              <Link to={"/"}>Trang Chủ</Link>
              <Link to={"/appointment"}>Đặt Lịch</Link>
              <Link to={"/about"}>Giới Thiệu</Link>
            </ul>
          </div>
          <div>
            <h4>Giờ Làm Việc</h4>
            <ul>
              {hours.map((element) => (
                <li key={element.id}>
                  <span>{element.day}</span>
                  <span>{element.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Liên Hệ</h4>
            <div>
              <FaPhone />
              <span>555-555-555</span>
            </div>
            <div>
              <MdEmail />
              <span>vu@gmail.com</span>
            </div>
            <div>
              <FaLocationArrow />
              <span>TP HCM, Việt Nam </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;