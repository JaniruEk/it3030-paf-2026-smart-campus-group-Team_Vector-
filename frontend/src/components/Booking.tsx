import React, { useState, useEffect } from "react";
import "./Booking_Form.css";
import { useAuth } from "../context/AuthContext";
import AppLayout from "./AppLayout";
import apiClient from "../api/apiClient";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

function BookingForm() {
  const { currentUser } = useAuth();
  const [date, setDate] = useState("");
  const [resource, setResource] = useState("");
  const [userID] = useState(currentUser?.displayName || currentUser?.email || "");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [startTime, setStartTime]=useState("");
  const [purpose, setPurpose]=useState("");
  const [endTime, setEndTime]=useState("");
  const [attendees, setAttendees]=useState("");

  const [confirmation, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMyBookings();
    }
  }, [currentUser]);

  // Live Sync for Student View
  useEffect(() => {
    let client: Client | null = null;
    if (!currentUser) return;

    const setupSync = () => {
        const host = window.location.hostname;
        const wsUrl = host === 'localhost' ? 'http://localhost:8080/ws' : `http://${host}:8080/ws`;
        
        client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log("Student Sync Connected");
                client?.subscribe(`/topic/bookings/user/updates/${currentUser.uid}`, () => {
                    console.log("Live Sync: Refreshing personal booking history...");
                    fetchMyBookings();
                });
            }
        });
        client.activate();
    };

    setupSync();
    return () => {
        if (client) client.deactivate();
    };
  }, [currentUser]);

  const fetchMyBookings = async () => {
    try {
      setLoadingHistory(true);
      const response = await apiClient.get(`/booking/user/${currentUser?.email}`);
      setMyBookings(response.data || []);
    } catch (err) {
      console.error("Failed to fetch booking history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation check
    if (!date || !resource || !userID || !year || !semester || !startTime || !endTime || !purpose || !attendees) {
      setError("⚠️ Please fill all fields!");
      setConfirm("");
      return;
    }

    // If all fields filled
    // setError("");
    // setConfirm("✅ Booking Confirmed!");

    const bookingData = {
      userId: currentUser?.email || userID,
      requesterUid: currentUser?.uid || "",
      bookingResource: resource,
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: purpose,
      noOfAttendees: Number(attendees)
    };

    try {
      const response = await apiClient.post("/booking", bookingData);
      const result = response.data;

      if (response.status === 200 && !result.toLowerCase().includes("already booked")) {
        setError("");
        setConfirm("✅ " + result);
        fetchMyBookings();
        // Reset form
        setDate("");
        setResource("");
        setStartTime("");
        setEndTime("");
        setPurpose("");
        setAttendees("");
      } else {
        setError("⚠️ " + result);
        setConfirm("");
      }
    } catch (err: any) {
      const errorMsg = err.response?.data || "Failed to connect to backend";
      setError("⚠️ " + errorMsg);
      setConfirm("");
    }
    
  };

  return (
    <AppLayout activeTab="none">
    <div className="booking_container">
      <div className="admin-card">
          <div className="card-header">
              <h3 style={{ margin: 0 }}>Campus Facility Booking</h3>
              <p style={{ margin: 0, marginTop: '4px' }}>Reserve laboratories, meeting rooms, and auditoriums.</p>
          </div>
      </div>

      <form className="booking_container_form" onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
        
        {/* Date & Resource Selection */}
        <div className="booking_container_select_date">
          <div className="form-group">
            <label>Select Date:</label>
            <input
              type="date"
              value={date}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Select Resource:</label>
            <select value={resource} required onChange={(e) => setResource(e.target.value)}>
              <option value="">Select a Venue</option>
              <option>A101 - Lecture Hall</option>
              <option>A102 - Lecture Hall</option>
              <option>B201 - Computer Lab</option>
              <option>B202 - Physics Lab</option>
              <option>Meeting Room - Block C</option>
              <option>Auditorium - Main</option>
            </select>
          </div>
        </div>

        {/* User_Inputs Grid */}
        <div className="booking_container_details_form">
          <div className="form-group">
            <label>Requester Identity:</label>
            <input
              type="text"
              className="user_details"
              value={userID}
              readOnly
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Year of Study:</label>
            <select value={year} required onChange={(e) => setYear(e.target.value)}>
              <option value=""></option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>

          <div className="form-group">
            <label>Semester:</label>
            <select value={semester} required onChange={(e) => setSemester(e.target.value)}>
              <option value=""></option>
              <option>1st Semester</option>
              <option>2nd Semester</option>
            </select>
          </div>

          <div className="form-group">
            <label>Time Slot (Start):</label>
            <input type="time" value={startTime} required onChange={(e) => setStartTime(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Time Slot (End):</label>
            <input type="time" value={endTime} required onChange={(e) => setEndTime(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Expected Attendees:</label>
            <input type="number" value={attendees} required min="1" onChange={(e) => setAttendees(e.target.value)} />
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Purpose of Booking:</label>
            <input type="text" value={purpose} required placeholder="e.g., Group Study, Workshop" onChange={(e) => setPurpose(e.target.value)} />
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="booking_container_confirm_button">
          Submit Booking Request
        </button>

        {/*  Error Message */}
        {error && <p className="error_msg" style={{ color: '#ef4444', fontWeight: 600 }}>{error}</p>}

        {/* Success Message */}
        {confirmation && <p className="confirmation_msg" style={{ color: '#10b981', fontWeight: 600 }}>{confirmation}</p>}
      </form>

      <div className="admin-card" style={{ marginTop: '3rem' }}>
        <div className="card-header">
            <h3>My Booking History</h3>
            <p>Track the status of your facility reservations.</p>
        </div>
        
        {loadingHistory ? (
          <div className="loading-state">Retrieving your records...</div>
        ) : myBookings.length === 0 ? (
          <div className="empty-state">You have no booking history.</div>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Resource</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.date}</td>
                    <td style={{ fontWeight: 600 }}>{b.bookingResource}</td>
                    <td>{b.startTime} - {b.endTime}</td>
                    <td>
                      <span className={`status-pill status-${b.status?.toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {b.adminReason || (b.status === 'PENDING' ? 'Awaiting Review' : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}

export default BookingForm;