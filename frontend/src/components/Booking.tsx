import React, { useState, useEffect } from "react";
import {
  Package,
  Clock,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  Timer,
  Edit3,
  Trash2,
  X,
  Calendar,
  User,
  Activity,
  FileText,
  MessageCircle,
  AlertCircle,
  Users,
  Hash,
  MapPin
} from "lucide-react";
import "./Booking_Form.css";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import AppLayout from "./AppLayout";
import apiClient from "../api/apiClient";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface BookingFormProps {
  mode: 'facilities' | 'assets';
}

function BookingForm({ mode }: BookingFormProps) {
  const { currentUser } = useAuth();
  const [date, setDate] = useState("");
  const [resource, setResource] = useState("");
  const [userID] = useState(currentUser?.displayName || currentUser?.email || "");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [purpose, setPurpose] = useState("");
  const [attendees, setAttendees] = useState("");
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [detailBooking, setDetailBooking] = useState<any | null>(null);

  // Luxe Time State
  const [sH, setSH] = useState("08");
  const [sM, setSM] = useState("00");
  const [sP, setSP] = useState("AM");
  const [eH, setEH] = useState("10");
  const [eM, setEM] = useState("00");
  const [eP, setEP] = useState("AM");

  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [duration, setDuration] = useState("2h 0m");

  const [confirmation, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [availableResources, setAvailableResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  const isFacility = mode === 'facilities';

  // Sync Luxe Time to standard strings and calculate duration
  useEffect(() => {
    const convert = (h: string, m: string, p: string) => {
      let hh = parseInt(h);
      if (p === "PM" && hh < 12) hh += 12;
      if (p === "AM" && hh === 12) hh = 0;
      return `${hh.toString().padStart(2, '0')}:${m}`;
    };

    const s = convert(sH, sM, sP);
    const e = convert(eH, eM, eP);
    setStartTime(s);
    setEndTime(e);

    const startMins = (parseInt(s.split(":")[0]) * 60) + parseInt(s.split(":")[1]);
    const endMins = (parseInt(e.split(":")[0]) * 60) + parseInt(e.split(":")[1]);
    let diff = endMins - startMins;
    if (diff < 0) diff = 0;
    setDuration(`${Math.floor(diff / 60)}h ${diff % 60}m`);
  }, [sH, sM, sP, eH, eM, eP]);

  useEffect(() => {
    fetchResources();
    if (currentUser) {
      fetchMyBookings();
    }
  }, [currentUser, mode]);

  const fetchResources = async () => {
    try {
      setLoadingResources(true);
      const res = await apiClient.get('/resources');
      const data = Array.isArray(res.data) ? res.data : [];
      let filtered = data.filter((r: any) => r.status === 'ACTIVE');
      const facilityTypes = ['Lecture Hall', 'Computer Lab', 'Science Lab', 'Meeting Room', 'Auditorium'];
      const assetTypes = ['Projector', 'Camera', 'Laptop', 'Sound System', 'Router'];

      if (mode === 'facilities') {
        filtered = filtered.filter((r: any) => facilityTypes.includes(r.type));
      } else {
        filtered = filtered.filter((r: any) => assetTypes.includes(r.type));
      }
      setAvailableResources(filtered);
    } catch (err) {
      console.error("Failed to fetch resources", err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    let client: Client | null = null;
    if (!currentUser) return;
    const setupSync = () => {
      const host = window.location.hostname;
      const wsUrl = host === 'localhost' ? 'http://localhost:8080/ws' : `http://${host}:8080/ws`;
      const stompClient = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        reconnectDelay: 5000,
      });
      stompClient.beforeConnect = async () => {
        try {
          const token = await currentUser!.getIdToken(true);
          stompClient.connectHeaders = { 'Authorization': `Bearer ${token}` };
        } catch (err) {
          console.error("Student Sync Token Refresh Failed", err);
        }
      };
      stompClient.onConnect = () => {
        stompClient.subscribe(`/topic/bookings/user/updates/${currentUser.uid}`, () => {
          fetchMyBookings();
        });
      };
      client = stompClient;
      stompClient.activate();
    };
    setupSync();
    return () => { if (client) client.deactivate(); };
  }, [currentUser]);

  const fetchMyBookings = async () => {
    try {
      setLoadingHistory(true);
      const response = await apiClient.get(`/booking/user/${currentUser?.email}`);
      const data = response.data || [];
      // Filter out bookings hidden by user
      setMyBookings(data.filter((b: any) => !b.hiddenByUser));
    } catch (err) {
      console.error("Failed to fetch booking history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const [searchParams] = useSearchParams();

  // Deep-linking logic for bookings
  useEffect(() => {
      const targetId = searchParams.get('id');
      if (targetId && !loadingHistory && myBookings.length > 0) {
          const element = document.getElementById(`booking-${targetId}`);
          if (element) {
              setTimeout(() => {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                  element.classList.add('highlight-pulse');
                  setTimeout(() => {
                      element.classList.remove('highlight-pulse');
                  }, 4000);
              }, 100);
          }
      }
  }, [searchParams, loadingHistory, myBookings]);

  const handleEditBooking = (booking: any) => {
    setEditingBooking(booking);
    setDate(booking.date);
    setResource(booking.bookingResource);
    setPurpose(booking.purpose);
    setAttendees(booking.noOfAttendees?.toString() || "");
    
    // Parse times
    const [startH, startM] = booking.startTime.split(':');
    const [endH, endM] = booking.endTime.split(':');
    
    const parseUnit = (h: string, m: string) => {
      let hh = parseInt(h);
      let p = "AM";
      if (hh >= 12) {
        p = "PM";
        if (hh > 12) hh -= 12;
      }
      if (hh === 0) hh = 12;
      return { h: hh.toString().padStart(2, '0'), m, p };
    };

    const s = parseUnit(startH, startM);
    const e = parseUnit(endH, endM);
    
    setSH(s.h); setSM(s.m); setSP(s.p);
    setEH(e.h); setEM(e.m); setEP(e.p);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      await apiClient.delete(`/booking/${id}`);
      setMyBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      setError("Failed to delete booking");
    }
  };

  const resetForm = () => {
    setEditingBooking(null);
    setDate("");
    setResource("");
    setPurpose("");
    setAttendees("");
    setSH("08"); setSM("00"); setSP("AM");
    setEH("10"); setEM("00"); setEP("AM");
    setConfirm("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !resource || !userID || !year || !semester || !startTime || !endTime || !purpose || (isFacility && !attendees)) {
      setError("⚠️ Please fill all required fields!");
      setConfirm("");
      return;
    }
    const bookingData = {
      id: editingBooking?.id,
      userId: currentUser?.email || userID,
      requesterUid: currentUser?.uid || "",
      bookingResource: resource,
      date: date,
      startTime: startTime,
      endTime: endTime,
      purpose: purpose,
      noOfAttendees: isFacility ? Number(attendees) : 1,
      status: editingBooking ? editingBooking.status : 'PENDING',
      hiddenByUser: false
    };
    try {
      const response = editingBooking 
        ? await apiClient.put(`/booking/${editingBooking.id}`, bookingData)
        : await apiClient.post("/booking", bookingData);
      
      const result = response.data;
      if (response.status === 200 && typeof result === 'string' && result.toLowerCase().includes("successfully")) {
        setError("");
        setConfirm(result.includes("updated") ? "✅ Booking updated successfully" : "✅ " + result);
        fetchMyBookings();
        if (!editingBooking) resetForm();
      } else {
        setError("⚠️ " + (typeof result === 'string' ? result : "Unexpected server response"));
        setConfirm("");
      }
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMsg = (typeof errorData === 'string' ? errorData : errorData?.message) || "Failed to connect to backend";
      setError("⚠️ " + errorMsg);
      setConfirm("");
    }
  };

  const BookingDetailModal = ({ booking, onClose }: { booking: any, onClose: () => void }) => {
    if (!booking) return null;

    const handleEditFromModal = () => {
      handleEditBooking(booking);
      onClose();
    };

    const handleDeleteFromModal = () => {
      handleDeleteBooking(booking.id);
      onClose();
    };

    return (
      <div className="booking-modal-overlay" onClick={onClose}>
        <div className="booking-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-inner-header">
            <div className="modal-title-area">
              <div className="detail-label" style={{ marginBottom: '0.25rem' }}>
                {isFacility ? 'Facility Request' : 'Resource Allocation'}
              </div>
              <h2>{booking.bookingResource}</h2>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label"><Calendar size={14} /> Date</span>
                <span className="detail-value">{booking.date}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Clock size={14} /> Time Window</span>
                <span className="detail-value">{booking.startTime} - {booking.endTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Activity size={14} /> Status</span>
                <span className={`status-pill status-${booking.status?.toLowerCase()}`} style={{ alignSelf: 'flex-start' }}>
                  {booking.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Users size={14} /> Capacity / Qty</span>
                <span className="detail-value">{booking.noOfAttendees} {isFacility ? 'Attendees' : 'Units'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="detail-label"><FileText size={14} /> Purpose</span>
                <span className="detail-value">{booking.purpose}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><User size={14} /> Requester UID</span>
                <span className="detail-value" style={{ fontSize: '0.8rem' }}>{booking.userId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label"><Hash size={14} /> System ID</span>
                <span className="detail-value" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{booking.id}</span>
              </div>
            </div>

            {(booking.adminReason || booking.status !== 'PENDING') && (
              <div className="modal-system-response">
                <div className="response-header">
                  <MessageCircle size={14} />
                  <span>Administrative Response</span>
                </div>
                <p className="response-text">
                  {booking.adminReason || (booking.status === 'APPROVED' ? 'Your request has been officially approved. Please carry a digital copy of this receipt.' : 'Request is currently undergoing departmental review.')}
                </p>
              </div>
            )}
            
            {booking.status === 'PENDING' && (
              <div className="modal-footer-info" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                <AlertCircle size={14} />
                <span>You can still modify or withdraw this request.</span>
              </div>
            )}
          </div>

            <div className="modal-footer-actions">
              <button className="modal-action-btn delete" onClick={handleDeleteFromModal}>
                <Trash2 size={16} /> Delete From History
              </button>
              {booking.status === 'PENDING' && (
                <button className="modal-action-btn edit" onClick={handleEditFromModal}>
                  <Edit3 size={16} /> Edit Request
                </button>
              )}
              {booking.status !== 'PENDING' && (
                <button className="admin-submit-btn" onClick={onClose}>Dismiss</button>
              )}
            </div>
        </div>
      </div>
    );
  };

  const increment = (val: string, setVal: any, max: number, min: number = 1) => {
    let n = parseInt(val) + 1;
    if (n > max) n = min;
    setVal(n.toString().padStart(2, '0'));
  };

  const decrement = (val: string, setVal: any, max: number, min: number = 1) => {
    let n = parseInt(val) - 1;
    if (n < min) n = max;
    setVal(n.toString().padStart(2, '0'));
  };

  const TimePickerUnit = ({ label, h, m, p, setH, setM, setP }: any) => (
    <div className="luxe-picker-unit">
      <div className="unit-header">
        <Clock size={14} />
        <span>{label}</span>
      </div>
      <div className="unit-controls">
        <div className="control-group">
          <button type="button" onClick={() => increment(h, setH, 12)}><ChevronUp size={16} /></button>
          <span className="unit-val">{h}</span>
          <button type="button" onClick={() => decrement(h, setH, 12)}><ChevronDown size={16} /></button>
        </div>
        <span className="unit-sep">:</span>
        <div className="control-group">
          <button type="button" onClick={() => increment(m, setM, 59, 0)}><ChevronUp size={16} /></button>
          <span className="unit-val">{m}</span>
          <button type="button" onClick={() => decrement(m, setM, 59, 0)}><ChevronDown size={16} /></button>
        </div>
        <button type="button"
          className={`period-toggle ${p === 'AM' ? 'am' : 'pm'}`}
          onClick={() => setP(p === 'AM' ? 'PM' : 'AM')}
        >
          {p === 'AM' ? <Sun size={14} /> : <Moon size={14} />}
          <span>{p}</span>
        </button>
      </div>
    </div>
  );

  return (
    <AppLayout activeTab="none">
      <div className={`portal-container animate-fade-in theme-${mode}`}>
        <div className="portal-header admin-portal-header">
          <div className="header-text">
            <h1 className="admin-page-title marquee">
              {editingBooking ? `Edit ${isFacility ? 'Venue' : 'Asset'} Request` : (isFacility ? 'Venue Reservation' : 'Asset Request')}
            </h1>
            <p className="admin-page-subtitle">
              {editingBooking ? 'Adjust your reservation details below.' : `Configure your institutional ${isFacility ? 'venue' : 'equipment'} allocation.`}
            </p>
          </div>
          {editingBooking && (
            <button className="secondary-btn" onClick={resetForm} style={{ marginBottom: '1rem' }}>
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>

        <div className="portal-content">
          <div className="admin-card luxe-card">
            <div className="card-header">
              <h3>{isFacility ? 'Session Specifications' : 'Request Requirements'}</h3>
              <div className="duration-pill">
                <Timer size={14} />
                <span>{duration} Session</span>
              </div>
            </div>

            <form className="admin-form-padding" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Application Date</label>
                  <input type="date" value={date} required onChange={(e) => setDate(e.target.value)} />
                </div>

                <div className="form-field">
                  <label>{isFacility ? 'Target Facility' : 'Inventory Asset'}</label>
                  <select value={resource} required onChange={(e) => setResource(e.target.value)} disabled={loadingResources}>
                    <option value="">{loadingResources ? "Syncing..." : `--- Select ${isFacility ? 'Facility' : 'Asset'} ---`}</option>
                    {availableResources.map((res: any) => (
                      <option key={res.id} value={res.name}>{res.name} ({res.type})</option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Student UID</label>
                  <input type="text" value={userID} readOnly className="readonly-field" />
                </div>

                <div className="form-field">
                  <label>Academic Standing</label>
                  <div className="select-row">
                    <select value={year} required onChange={(e) => setYear(e.target.value)}>
                      <option value="">Year</option>
                      <option>Year 1</option>
                      <option>Year 2</option>
                      <option>Year 3</option>
                      <option>Year 4</option>
                    </select>
                    <select value={semester} required onChange={(e) => setSemester(e.target.value)}>
                      <option value="">Sem</option>
                      <option>Sem 1</option>
                      <option>Sem 2</option>
                    </select>
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="luxe-label">Booking Interval</label>
                  <div className="luxe-time-suite">
                    <TimePickerUnit label="Start Time" h={sH} m={sM} p={sP} setH={setSH} setM={setSM} setP={setSP} />
                    <div className="luxe-timeline">
                      <div className="timeline-labels">
                        <span>08:00</span>
                        <span>12:00</span>
                        <span>16:00</span>
                        <span>20:00</span>
                      </div>
                      <div className="timeline-track">
                        <div
                          className="timeline-range"
                          style={{
                            left: `${Math.max(0, (parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]) - 480) / 7.2)}%`,
                            width: `${Math.max(0, (parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]) - (parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]))) / 7.2)}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <TimePickerUnit label="End Time" h={eH} m={eM} p={eP} setH={setEH} setM={setEM} setP={setEP} />
                  </div>
                </div>

                {isFacility && (
                  <div className="form-field">
                    <label>Expected Attendees</label>
                    <input type="number" value={attendees} required min="1" onChange={(e) => setAttendees(e.target.value)} />
                  </div>
                )}

                <div className="form-field full-width">
                  <label>Purpose Designation</label>
                  <input
                    type="text"
                    value={purpose}
                    required
                    placeholder="Describe the nature of your request..."
                    onChange={(e) => setPurpose(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="admin-submit-btn">
                  {editingBooking ? 'Update Request' : `Confirm ${isFacility ? 'Booking' : 'Request'}`}
                </button>
              </div>

              {error && <div className="admin-alert error">{error}</div>}
              {confirmation && <div className="admin-alert success">{confirmation}</div>}
            </form>
          </div>

          <div className="admin-card" style={{ marginTop: '3rem' }}>
            <div className="card-header">
              <h3>Personal Booking Registry</h3>
              <p>Historical log of your {isFacility ? 'venue reservations' : 'asset inquiries'}.</p>
            </div>

            {loadingHistory ? (
              <div className="admin-loading">Synchronizing records...</div>
            ) : myBookings.length === 0 ? (
              <div className="admin-empty-state">
                <Package size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No historical {isFacility ? 'facility' : 'asset'} records found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="users-table admin-style-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>{isFacility ? 'Facility' : 'Asset'}</th>
                       <th>Time Interval</th>
                      <th>Vector Status</th>
                      <th>System Response</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myBookings].reverse().map((b) => (
                      <tr 
                        key={b.id} 
                        id={`booking-${b.id}`} 
                        className="clickable-row"
                        onClick={() => setDetailBooking(b)}
                      >
                        <td className="mono">{b.date}</td>
                        <td style={{ fontWeight: 700 }}>{b.bookingResource}</td>
                        <td className="mono" style={{ fontSize: '0.8rem' }}>{b.startTime} - {b.endTime}</td>
                        <td>
                          <span className={`status-pill status-${b.status?.toLowerCase()}`}>
                            {b.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {b.adminReason || (b.status === 'PENDING' ? 'Processing...' : '-')}
                        </td>
                        <td>
                         <div className="registry-actions">
                            {b.status === 'PENDING' && (
                              <button 
                                className="action-icon-btn" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditBooking(b);
                                }}
                                title="Edit Request"
                              >
                                <Edit3 size={16} />
                              </button>
                            )}
                            <button 
                              className="action-icon-btn delete" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBooking(b.id);
                              }}
                              title="Delete Record"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {detailBooking && (
        <BookingDetailModal 
          booking={detailBooking} 
          onClose={() => setDetailBooking(null)} 
        />
      )}
    </AppLayout>
  );
}

export default BookingForm;