import React, { createContext, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import axios from "axios";

export const Context = createContext({ isAuthenticated: false });

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token && role === "Admin") {
      axios
        .get("http://localhost:4000/api/v1/user/admin/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        })
        .then((res) => {
          setIsAuthenticated(true);
          setAdmin(res.data.user);
          setLoading(false);
        })
        .catch(() => {
          setIsAuthenticated(false);
          setAdmin(null);
          setLoading(false);
        });
    } else {
      setIsAuthenticated(false);
      setAdmin(null);
      setLoading(false);
    }
  }, []);

  return (
    <Context.Provider
      value={{ isAuthenticated, setIsAuthenticated, admin, setAdmin, loading }}
    >
      <App />
    </Context.Provider>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);