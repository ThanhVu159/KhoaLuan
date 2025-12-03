import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Context } from "../main";
import { Navigate } from "react-router-dom";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const { isAuthenticated } = useContext(Context);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:4000/api/v1/message/getall",
          { withCredentials: true }
        );
        setMessages(data.messages);
      } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi khi lấy tin nhắn");
      }
    };
    fetchMessages();
  }, []);


  const handleDeleteMessage = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá tin nhắn này?")) return;
    try {
      const { data } = await axios.delete(
        `http://localhost:4000/api/v1/message/delete/${id}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Xoá tin nhắn thất bại!");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return (
    <section className="page messages">
      <h1>TIN NHẮN</h1>
      <div className="banner">
        {messages && messages.length > 0 ? (
          messages.map((element) => (
            <div className="card" key={element._id}>
              <div className="details">
                <p>
                  Tên: <span>{element.firstName}</span>
                </p>
                <p>
                  Họ: <span>{element.lastName}</span>
                </p>
                <p>
                  Email: <span>{element.email}</span>
                </p>
                <p>
                  Số điện thoại: <span>{element.phone}</span>
                </p>
                <p>
                  Nội dung: <span>{element.message}</span>
                </p>
              </div>
              <button
                className="btn btn-danger"
                onClick={() => handleDeleteMessage(element._id)}
              >
                Xoá
              </button>
            </div>
          ))
        ) : (
          <h1>Không có tin nhắn nào!</h1>
        )}
      </div>
    </section>
  );
};

export default Messages;