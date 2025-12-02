import React from "react";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { useNavigate } from "react-router-dom";

const Departments = () => {
  const navigate = useNavigate(); 

  const departmentsArray = [
    {
      name: "Nhi Khoa",
      imageUrl: "/departments/pedia.jpg",
    },
    {
      name: "Chỉnh hình",
      imageUrl: "/departments/ortho.jpg",
    },
    {
      name: "Tim Mạch",
      imageUrl: "/departments/cardio.jpg",
    },
    {
      name: "Thần Kinh",
      imageUrl: "/departments/neuro.jpg",
    },
    {
      name: "Ung thư",
      imageUrl: "/departments/onco.jpg",
    },
    {
      name: "Chẩn đoán hình ảnh X quang", 
      imageUrl: "/departments/radio.jpg",
      path: "/xray-diagnosis" 
    },
    {
      name: "Vật lý trị liệu",
      imageUrl: "/departments/therapy.jpg",
    },
    {
      name: "Da liễu",
      imageUrl: "/departments/derma.jpg",
    },
    {
      name: "Tai Mũi Họng",
      imageUrl: "/departments/ent.jpg",
    },
  ];

  const responsive = {
    extraLarge: {
      breakpoint: { max: 3000, min: 1324 },
      items: 4,
      slidesToSlide: 1,
    },
    large: {
      breakpoint: { max: 1324, min: 1005 },
      items: 3,
      slidesToSlide: 1,
    },
    medium: {
      breakpoint: { max: 1005, min: 700 },
      items: 2,
      slidesToSlide: 1,
    },
    small: {
      breakpoint: { max: 700, min: 0 },
      items: 1,
      slidesToSlide: 1,
    },
  };

  return (
    <>
      <div className="container departments">
        <h2>Khoa</h2>
        <Carousel
          responsive={responsive}
          
          removeArrowOnDeviceType={[
            "tablet",
            "mobile",
          ]}
        >
          {departmentsArray.map((depart, index) => {
            return (
              <div 
                key={index} 
                className="card"
                onClick={() => depart.path && navigate(depart.path)} 
                style={{ cursor: depart.path ? "pointer" : "default" }} 
              >
                <div className="depart-name">{depart.name}</div>
                <img src={depart.imageUrl} alt="Department" />
              </div>
            );
          })}
        </Carousel>
      </div>
    </>
  );
};

export default Departments;