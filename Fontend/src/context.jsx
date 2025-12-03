import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const Context = createContext();

export const ContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ thêm loading

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role) {
      axios
        .get(
          role === "Admin"
            ? "http://localhost:4000/api/v1/user/admin/me"
            : "http://localhost:4000/api/v1/user/patient/me",
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        )
        .then((res) => {
          setIsAuthenticated(true);
          setUser(res.data.user); // ✅ lưu thông tin user đầy đủ
          setLoading(false);
        })
        .catch(() => {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, user, setUser, loading }}
    >
      {children}
    </Context.Provider>
  );
};