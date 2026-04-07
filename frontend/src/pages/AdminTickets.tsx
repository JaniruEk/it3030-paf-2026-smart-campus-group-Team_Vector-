import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import AppLayout from '../components/AppLayout';
import { CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './AdminTickets.css';
import './AdminDashboard.css';

interface UserData {
  uid: string;
  email: string;
  displayName: string | null;
  role: string;
  disabled: boolean;
}

const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const;
type TicketStatusOption = typeof STATUS_OPTIONS[number];
type TicketDisplayStatus = TicketStatusOption | 'REJECTED';

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
type TicketPriority = typeof PRIORITY_OPTIONS[number];

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    return maybeError.response?.data?.message || maybeError.message || 'Request failed';
  }
  return 'Request failed';
};

const normalizeStatus = (status?: string): TicketDisplayStatus => {
  const normalized = (status || 'OPEN').toUpperCase();
  if (normalized === 'REJECTED') return 'REJECTED';
  if (STATUS_OPTIONS.includes(normalized as TicketStatusOption)) return normalized as TicketStatusOption;
  return 'OPEN';
};

const normalizePriority = (priority?: string): TicketPriority => {
  const normalized = (priority || 'MEDIUM').toUpperCase();
  if (PRIORITY_OPTIONS.includes(normalized as TicketPriority)) return normalized as TicketPriority;
  return 'MEDIUM';
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [technicians, setTechnicians] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [selectedTechByTicket, setSelectedTechByTicket] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const ticketCountByStatus = useMemo(() => {
    return tickets.reduce<Record<string, number>>((acc, ticket) => {
      const key = normalizeStatus(ticket.status);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [tickets]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ticketRes, usersRes] = await Promise.all([
        apiClient.get<MaintenanceTicket[]>('/tickets/admin/all'),
        apiClient.get<UserData[]>('/users'),
      ]);
      setTickets(ticketRes.data);
      setUsers(usersRes.data);
      setTechnicians(usersRes.data.filter((user) => user.role === 'TECHNICIAN' && !user.disabled));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getRequestedByEmail = (userId: string) => {
    const user = users.find((item) => item.uid === userId);
    return user ? user.email : userId;
  };

  const handleAssignTechnician = async (ticket: MaintenanceTicket, event: FormEvent) => {
    event.preventDefault();
    const ticketId = ticket.id;
    if (!ticketId) return;

    const technicianId = selectedTechByTicket[ticketId];
    if (!technicianId) {
      toast.error('Please select a technician');
      return;
    }

    const selectedTechnician = technicians.find((user) => user.uid === technicianId);
    if (!selectedTechnician) {
      toast.error('Selected technician is not available');
      return;
    }

    try {
      setActionTicketId(ticketId);
      const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/assign`, {
        technicianId: selectedTechnician.uid,
        technicianEmail: selectedTechnician.email,
      });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success('Technician assigned successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatusOption) => {
    try {
      setActionTicketId(ticketId);
      const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/status`, { status });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  const handleTicketUpdate = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  const toggleComments = (ticketId: string) => {
    setExpandedComments((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
  };

  const handleRejectTicket = async (ticketId: string, currentStatus: TicketDisplayStatus) => {
    if (currentStatus !== 'OPEN') {
      toast.error('Only OPEN tickets can be rejected.');
      return;
    }
    const reason = window.prompt('Please enter a reason to reject this ticket:');
    if (!reason?.trim()) return;

    try {
      setActionTicketId(ticketId);
      const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/status`, {
        status: 'REJECTED',
        reason: reason.trim(),
      });
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success('Ticket rejected');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  return (
    <AppLayout activeTab="none">
      <div className="admin-card">
        <div className="card-header">
          <h3>Maintenance Ticket Management</h3>
          <p>Oversee campus-wide incidents, assign personnel, and monitor resolutions.</p>
        </div>

        <div className="health-dashboard" style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <div className="health-stat-card">
            <span className="health-stat-title">Total Tickets</span>
            <span className="health-stat-value">{tickets.length}</span>
          </div>
          <div className="health-stat-card">
            <span className="health-stat-title">Open</span>
            <span className="health-stat-value warning">{ticketCountByStatus.OPEN || 0}</span>
          </div>
          <div className="health-stat-card">
            <span className="health-stat-title">In Progress</span>
            <span className="health-stat-value ok" style={{ color: '#3b82f6' }}>{ticketCountByStatus.IN_PROGRESS || 0}</span>
          </div>
          <div className="health-stat-card">
            <span className="health-stat-title">Resolved</span>
            <span className="health-stat-value ok">{ticketCountByStatus.RESOLVED || 0}</span>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {isLoading ? (
            <div className="loading-state">Accessing secure ticket database...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">No tickets registered in the system.</div>
          ) : (
            <div className="admin-ticket-list">
              {tickets.map((ticket) => {
                const ticketId = ticket.id!;
                const status = normalizeStatus(ticket.status);
                const priority = normalizePriority(ticket.priority);
                const isRejected = status === 'REJECTED';
                const isOpen = status === 'OPEN';

                return (
                  <article className="admin-ticket-card" key={ticketId}>
                    <div className="admin-ticket-card-head">
                      <div className="ticket-title-group">
                        <h3>{ticket.category} Issue</h3>
                        <div className="badge-row">
                          <span className={`status-pill status-${status.toLowerCase()}`}>{status}</span>
                          <span className={`priority-pill priority-${priority.toLowerCase()}`}>{priority}</span>
                        </div>
                      </div>
                      
                      {!isRejected && (
                        <div className="status-control">
                          <label>Update Status</label>
                          <select
                            className={`ticket-status-select`}
                            value={status}
                            onChange={(e) => handleStatusChange(ticketId, e.target.value as TicketStatusOption)}
                            disabled={actionTicketId === ticketId || status === 'CLOSED'}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="admin-ticket-grid">
                      <div className="ticket-info-main">
                        <div className="info-row">
                          <div className="info-item">
                            <label>Requester</label>
                            <span>{getRequestedByEmail(ticket.userId)}</span>
                          </div>
                          <div className="info-item">
                            <label>Location</label>
                            <span>{ticket.resourceName || ticket.location}</span>
                          </div>
                        </div>
                        <div className="info-item full">
                          <label>Description</label>
                          <p>{ticket.description}</p>
                        </div>
                        <div className="info-item full">
                          <label>Assigned Staff</label>
                          <span style={{ color: ticket.assignedTechnicianEmail ? '#0f172a' : '#94a3b8', fontWeight: 600 }}>
                            {ticket.assignedTechnicianEmail || 'Awaiting Assignment'}
                          </span>
                        </div>
                      </div>

                      <div className="ticket-attachments-side">
                        <label>Attachments</label>
                        {ticket.attachments && ticket.attachments.length > 0 ? (
                          <div className="attachment-previews">
                            {ticket.attachments.map((img, i) => (
                              <a key={i} href={img.dataUrl} target="_blank" rel="noreferrer">
                                <img src={img.dataUrl} alt="Incident" />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="no-attachments">No visual evidence provided</div>
                        )}
                      </div>
                    </div>

                    {ticket.resolutionNotes && (
                      <div className="resolution-notes-box">
                        <label><CheckCircle size={14} /> Resolution Notes</label>
                        <p>{ticket.resolutionNotes}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleComments(ticketId)}
                      aria-expanded={expandedComments[ticketId] || false}
                      style={{
                        marginTop: '0.5rem',
                        marginBottom: '1rem',
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '0.65rem 0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      {expandedComments[ticketId] ? 'Hide All Comments' : 'Show All Comments'}
                      {expandedComments[ticketId] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {expandedComments[ticketId] && (
                      <CommentSection ticket={ticket} onUpdate={handleTicketUpdate} />
                    )}

                    {isOpen && (
                      <div className="admin-ticket-actions">
                        <form className="assign-form" onSubmit={(e) => handleAssignTechnician(ticket, e)}>
                          <select
                            value={selectedTechByTicket[ticketId] || ''}
                            onChange={(e) => setSelectedTechByTicket(prev => ({ ...prev, [ticketId]: e.target.value }))}
                          >
                            <option value="">Select Technician</option>
                            {technicians.map(t => <option key={t.uid} value={t.uid}>{t.email}</option>)}
                          </select>
                          <button type="submit" disabled={!selectedTechByTicket[ticketId] || actionTicketId === ticketId}>
                            Assign Staff
                          </button>
                        </form>
                        <button className="reject-btn" onClick={() => handleRejectTicket(ticketId, status)}>
                          Reject Request
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminTickets;
