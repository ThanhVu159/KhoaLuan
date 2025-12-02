import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Context } from "./context.jsx"; 

const AppWrapper = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState({});

  return (
    <Context.Provider value={{ isAuthenticated, setIsAuthenticated, admin, setAdmin }}>
      <App />
    </Context.Provider>
  );
};


const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);