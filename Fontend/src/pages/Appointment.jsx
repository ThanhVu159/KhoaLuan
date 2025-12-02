import React from "react";
import Hero from "../components/hero";
import AppointmentForm from "../components/AppointmentForm";

const Appointment = () => {
  return (
    <>
      <Hero
        title={"Đặt lịch hẹn khám | Trung tâm Y tế Medical AI"}
        imageUrl={"/sigin.png"}
      />
      <AppointmentForm />
    </>
  );
};

export default Appointment;
