import React, { useState } from "react";
import "./Booking_Form.css";

function BookingForm() {
  const [date, setDate] = useState("");
  const [resource, setResource] = useState("");
  const [userID, setUserID] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [startTime, setStartTime]=useState("");
  const [purpose, setPurpose]=useState("");
  const [endTime, setEndTime]=useState("");
  const [attendees, setAttendees]=useState("");

  const [confirmation, setConfirm] = useState("");
  const [error, setError] = useState("");

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation check
    if (!date || !resource || !userID || !year || !semester || !startTime || !endTime || !purpose || !attendees) {
      setError("⚠️ Please fill all fields!");
      setConfirm("");
      return;
    }

    const studentIdPattern = /^(IT|BM)[0-9]{7}$/;

    if (!studentIdPattern.test(userID)) {
      setError("⚠️ Student ID must start with IT or BM and contain 7 digits (e.g., IT1234567)");
      setConfirm("");
      return;
    }

    // If all fields filled
    // setError("");
    // setConfirm("✅ Booking Confirmed!");

    const bookingData = {
      userId: userID,
      bookingResource: resource,
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: purpose,
      noOfAttendees: Number(attendees)
    };

    try {
      const response = await fetch("http://localhost:8080/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bookingData)
      });

      const result = await response.text();

      setError("");
      setConfirm(result);
    } catch (err) {
      setError("Failed to connect to backend");
      setConfirm("");
    }
    
  };

  return (
    <div className="booking_container">
      <form className="booking_container_form" onSubmit={handleSubmit}>
        
        {/* Date Selection */}
        <div className="booking_container_select_date">
          <label>Select Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          {/* Venue */}
          <label>Select Resource:</label>
          <select value={resource} onChange={(e) => setResource(e.target.value)}>
            <option value=""></option>
            <option>A101</option>
            <option>A102</option>
            <option>B201</option>
            <option>B202</option>
            <option>Meeting Room</option>
            <option>Auditorium</option>
          </select>
        </div>

        {/* User_Inputs  */}
        <div className="booking_container_details_form">
          <label>Student ID:</label>
          <input
            type="text"
            className="user_details"
            value={userID}
            onChange={(e) => setUserID(e.target.value)}
          />

          <label>Year:</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value=""></option>
            <option>1st Year</option>
            <option>2nd Year</option>
            <option>3rd Year</option>
            <option>4th Year</option>
          </select>

          <label>Semester:</label>
          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value=""></option>
            <option>1st Semester</option>
            <option>2nd Semester</option>
          </select>

          <label>Start Time:</label>
          <input type="time" onChange={(e) => setStartTime(e.target.value)} />

          <label>End Time:</label>
          <input type="time" onChange={(e) => setEndTime(e.target.value)} />

          <label>Purpose:</label>
          <input type="text" onChange={(e) => setPurpose(e.target.value)} />

          <label>No of Attendees:</label>
          <input type="number" onChange={(e) => setAttendees(e.target.value)} />
        </div>

        {/* Submit Button */}
        <button type="submit" className="booking_container_confirm_button">
          Confirm
        </button>

        {/*  Error Message */}
        {error && <p className="error_msg">{error}</p>}

        {/* Success Message */}
        {confirmation && <p className="confirmation_msg">{confirmation}</p>}
      </form>
    </div>
  );
}

export default BookingForm;