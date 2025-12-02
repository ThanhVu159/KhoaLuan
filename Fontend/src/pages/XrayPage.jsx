// frontend/src/Pages/XrayPage.jsx
import React from "react";
import XrayDiagnosis from "../components/XrayDiagnosis";

const XrayPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 pt-20">
      <XrayDiagnosis />
    </div>
  );
};

export default XrayPage;