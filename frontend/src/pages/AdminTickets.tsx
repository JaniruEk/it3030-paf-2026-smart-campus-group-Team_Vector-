import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../api/apiClient';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import './AdminTickets.css';

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

const formatDate = (value?: string) => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    return maybeError.response?.data?.message || maybeError.message || 'Request failed';
  }
  return 'Request failed';
};

const normalizeStatus = (status?: string): TicketDisplayStatus => {
  const normalized = (status || 'OPEN').toUpperCase();
  if (normalized === 'REJECTED') {
    return 'REJECTED';
  }
  if (STATUS_OPTIONS.includes(normalized as TicketStatusOption)) {
    return normalized as TicketStatusOption;
  }
  return 'OPEN';
};

const normalizePriority = (priority?: string): TicketPriority => {
  const normalized = (priority || 'MEDIUM').toUpperCase();
  if (PRIORITY_OPTIONS.includes(normalized as TicketPriority)) {
    return normalized as TicketPriority;
  }
  return 'MEDIUM';
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [technicians, setTechnicians] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTicketId, setActionTicketId] = useState<string | null>(null);
  const [selectedTechByTicket, setSelectedTechByTicket] = useState<Record<string, string>>({});

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
    if (!user) {
      return userId;
    }

    return user.email;
  };

  const handleAssignTechnician = async (ticket: MaintenanceTicket, event: FormEvent) => {
    event.preventDefault();

    const ticketId = ticket.id;
    if (!ticketId) {
      return;
    }

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

      // Backend automatically sets status to IN_PROGRESS when assigning technician.
      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success('Technician assigned. Ticket moved to IN_PROGRESS');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  const handleStatusChange = async (ticketId: string, status: TicketStatusOption) => {
    try {
      setActionTicketId(ticketId);
      const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/status`, {
        status,
      });

      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success(`Ticket status updated to ${status}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  const handleTicketUpdate = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  const handleRejectTicket = async (ticketId: string, currentStatus: TicketDisplayStatus) => {
    if (currentStatus !== 'OPEN') {
      toast.error('Only OPEN tickets can be rejected.');
      return;
    }

    const reason = window.prompt('Please enter a reason to reject this ticket:');
    if (reason === null) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      toast.error('Reject reason is required.');
      return;
    }

    try {
      setActionTicketId(ticketId);
      const response = await apiClient.patch<MaintenanceTicket>(`/tickets/${ticketId}/status`, {
        status: 'REJECTED',
        reason: trimmedReason,
      });

      setTickets((prev) => prev.map((item) => (item.id === ticketId ? response.data : item)));
      toast.success('Ticket rejected successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setActionTicketId(null);
    }
  };

  return (
    <div className="admin-tickets-page">
      <header className="admin-tickets-header">
        <div>
          <h2>Admin Ticket Management</h2>
          <p>View all tickets, assign technicians, and update status from the dropdown.</p>
        </div>
        <Link to="/admin" className="admin-back-link">Back to Admin Dashboard</Link>
      </header>

      <section className="admin-ticket-stats">
        <div><strong>Total:</strong> {tickets.length}</div>
        <div><strong>OPEN:</strong> {ticketCountByStatus.OPEN || 0}</div>
        <div><strong>IN_PROGRESS:</strong> {ticketCountByStatus.IN_PROGRESS || 0}</div>
        <div><strong>RESOLVED:</strong> {ticketCountByStatus.RESOLVED || 0}</div>
        <div><strong>CLOSED:</strong> {ticketCountByStatus.CLOSED || 0}</div>
        <div><strong>REJECTED:</strong> {ticketCountByStatus.REJECTED || 0}</div>
      </section>

      {isLoading ? (
        <div className="admin-ticket-loading">Loading all tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="admin-ticket-empty">No tickets found.</div>
      ) : (
        <div className="admin-ticket-list">
          {tickets.map((ticket) => {
            const ticketId = ticket.id;
            if (!ticketId) {
              return null;
            }

            const status = normalizeStatus(ticket.status);
            const isRejected = status === 'REJECTED';
            const isOpen = status === 'OPEN';
            const priority = normalizePriority(ticket.priority);
            const requesterEmail = getRequestedByEmail(ticket.userId);
            const technicianUpdates = (ticket.ticketMessages || []).filter(
              (message) => (message.senderRole || '').toUpperCase() === 'TECHNICIAN',
            );

            return (
              <article className="admin-ticket-card" key={ticketId}>
                <div className="admin-ticket-card-head">
                  <h3>{ticket.category} Issue</h3>
                  <div className={`ticket-priority-pill priority-${priority.toLowerCase()}`}>{priority}</div>
                  {isRejected ? (
                    <span className="ticket-status-pill status-rejected">REJECTED</span>
                  ) : (
                    <div className="status-control">
                      <label htmlFor={`status-${ticketId}`}>Status</label>
                      <select
                        id={`status-${ticketId}`}
                        className={`ticket-status-select status-${status.toLowerCase()}`}
                        value={status}
                        onChange={(event) => handleStatusChange(ticketId, event.target.value as TicketStatusOption)}
                        disabled={actionTicketId === ticketId}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="admin-ticket-card-body">
                  <div className="admin-ticket-main">
                    <p><strong>Created:</strong> {formatDate(ticket.createdAt)}</p>
                    <p><strong>Requested By:</strong> {requesterEmail}</p>
                    <p>
                      <strong>Resource / Location:</strong> {ticket.resourceName || ticket.location}
                    </p>
                    <p><strong>Description:</strong> {ticket.description}</p>
                    <p>
                      <strong>Preferred Contact:</strong> {ticket.preferredContactMethod || 'ANY'} - {ticket.preferredContactDetails || 'N/A'}
                    </p>
                    <p>
                      <strong>Assigned Technician:</strong>{' '}
                      {ticket.assignedTechnicianEmail || ticket.assignedTechnicianId || 'Not assigned'}
                    </p>

                    <div className="ticket-updates-block">
                      <strong>Technician Updates:</strong>
                      {technicianUpdates.length > 0 ? (
                        <div className="ticket-update-list">
                          {technicianUpdates.map((update, index) => (
                            <div className="ticket-update-item" key={`${ticketId}-tech-update-${index}`}>
                              <div className="ticket-update-meta">
                                <span>{update.senderEmail || ticket.assignedTechnicianEmail || 'Technician'}</span>
                                <span>{formatDate(update.createdAt)}</span>
                              </div>
                              {update.message ? <p>{update.message}</p> : null}
                              {update.imageDataUrl ? (
                                <a
                                  href={update.imageDataUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="ticket-update-image-link"
                                  title={update.imageFileName || 'Technician update image'}
                                >
                                  <img src={update.imageDataUrl} alt={update.imageFileName || 'Technician update image'} />
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="no-ticket-updates">No technician updates yet</span>
                      )}
                    </div>
                  </div>

                  <aside className="admin-ticket-side">
                    <div className="ticket-attachments-block">
                      <strong>Attachments:</strong>
                      {ticket.attachments && ticket.attachments.length > 0 ? (
                        <div className="ticket-image-grid">
                          {ticket.attachments.map((attachment, index) => (
                            <a
                              key={`${ticketId}-${attachment.fileName}-${index}`}
                              href={attachment.dataUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="ticket-image-link"
                              title={attachment.fileName}
                            >
                              <img src={attachment.dataUrl} alt={attachment.fileName} />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="no-attachments">No image attachments</span>
                      )}
                    </div>
                  </aside>
                </div>

                {isRejected && (
                  <p><strong>Reject Reason:</strong> {ticket.rejectionReason || 'N/A'}</p>
                )}

                {ticket.resolutionNotes && (
                  <p><strong>Resolution:</strong> {ticket.resolutionNotes}</p>
                )}

                <CommentSection 
                  ticket={ticket} 
                  onUpdate={handleTicketUpdate} 
                />

                {isOpen ? (
                  <div className="admin-ticket-actions">
                    <form className="assign-form" onSubmit={(event) => handleAssignTechnician(ticket, event)}>
                      <select
                        value={selectedTechByTicket[ticketId] || ''}
                        onChange={(event) => setSelectedTechByTicket((prev) => ({
                          ...prev,
                          [ticketId]: event.target.value,
                        }))}
                        disabled={actionTicketId === ticketId}
                      >
                        <option value="">Select Technician</option>
                        {technicians.map((tech) => (
                          <option key={tech.uid} value={tech.uid}>{tech.email}</option>
                        ))}
                      </select>
                      <button type="submit" disabled={actionTicketId === ticketId}>
                        Assign Technician
                      </button>
                    </form>

                    <button
                      className="reject-ticket-btn"
                      onClick={() => handleRejectTicket(ticketId, status)}
                      disabled={actionTicketId === ticketId}
                    >
                      Reject Ticket
                    </button>
                  </div>
                ) : isRejected ? (
                  <p className="ticket-locked-note">This ticket is rejected and locked. No further actions allowed.</p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminTickets;
