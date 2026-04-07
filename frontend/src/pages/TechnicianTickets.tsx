import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getAssignedTechnicianTickets, updateTicketStatusByTechnician } from '../services/ticketService';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import AppLayout from '../components/AppLayout';
import './TechnicianTickets.css';
import './AdminDashboard.css';

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const TechnicianTickets = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveTicketId, setResolveTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const data = await getAssignedTechnicianTickets();
      setTickets(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load assigned tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const closeResolveModal = () => {
    if (updatingTicketId) return;
    setIsResolveModalOpen(false);
    setResolveTicketId(null);
    setResolutionNotes('');
  };

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    if (status === 'RESOLVED') {
      setResolveTicketId(ticketId);
      setResolutionNotes('');
      setIsResolveModalOpen(true);
      return;
    }

    try {
      setUpdatingTicketId(ticketId);
      const updatedTicket = await updateTicketStatusByTechnician(ticketId, {
        status,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updatedTicket : t)));
      toast.success(`Ticket status updated to ${status}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleTicketUpdate = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  const toggleComments = (ticketId: string) => {
    setExpandedComments((prev) => ({ ...prev, [ticketId]: !prev[ticketId] }));
  };

  const handleResolveSubmit = async () => {
    if (!resolveTicketId) return;
    const trimmedNotes = resolutionNotes.trim();
    if (!trimmedNotes) {
      toast.error('Resolution notes are required to resolve the ticket');
      return;
    }

    try {
      setUpdatingTicketId(resolveTicketId);
      const updatedTicket = await updateTicketStatusByTechnician(resolveTicketId, {
        status: 'RESOLVED',
        resolutionNotes: trimmedNotes,
      });
      setTickets((prev) => prev.map((t) => (t.id === resolveTicketId ? updatedTicket : t)));
      toast.success('Ticket status updated to RESOLVED');
      setIsResolveModalOpen(false);
      setResolveTicketId(null);
      setResolutionNotes('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingTicketId(null);
    }
  };

  return (
    <AppLayout activeTab="none">
      <div className="admin-card">
        <div className="card-header">
          <h3>Technician Workspace</h3>
          <p>Manage your assigned maintenance tasks and communicate with users.</p>
        </div>

        <div style={{ padding: '2rem' }}>
          {isLoading ? (
            <div className="loading-state">Accessing maintenance queue...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">No tickets assigned to you at the moment.</div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="admin-ticket-card">
                  <div className="admin-ticket-card-head">
                    <div className="ticket-title-group">
                      <h3>{ticket.category} Issue</h3>
                      <div className="badge-row">
                        <span className={`status-pill status-${(ticket.status || 'OPEN').toLowerCase()}`}>{ticket.status || 'OPEN'}</span>
                        <span className={`priority-pill priority-${(ticket.priority || 'LOW').toLowerCase()}`}>{ticket.priority || 'LOW'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-ticket-grid">
                    <div className="ticket-info-main">
                      <div className="info-row">
                        <div className="info-item">
                          <label>Assigned On</label>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        <div className="info-item">
                          <label>Location / Asset</label>
                          <span>{ticket.resourceName || ticket.location}</span>
                        </div>
                      </div>
                      <div className="info-item full">
                        <label>Reported Issue</label>
                        <p>{ticket.description}</p>
                      </div>
                      <div className="info-item full">
                        <label>Requester Context</label>
                        <span style={{ color: '#0f172a', fontWeight: 600 }}>
                          {ticket.preferredContactMethod || 'ANY'} - {ticket.preferredContactDetails}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-attachments-side">
                      <label>Incident Evidence</label>
                      {ticket.attachments && ticket.attachments.length > 0 ? (
                        <div className="attachment-previews">
                          {ticket.attachments.map((img, i) => (
                            <a key={i} href={img.dataUrl} target="_blank" rel="noreferrer">
                              <img src={img.dataUrl} alt="Evidence" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="no-attachments">No images attached</div>
                      )}
                    </div>
                  </div>

                  <div className="technician-status-actions" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    {ticket.status === 'OPEN' && (
                      <button 
                        className="status-action-btn"
                        onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                        disabled={updatingTicketId === ticket.id}
                        style={{ background: '#3b82f6' }}
                      >
                        Start Working
                      </button>
                    )}
                    {ticket.status === 'IN_PROGRESS' && (
                      <button 
                        className="status-action-btn resolve-action"
                        onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                        disabled={updatingTicketId === ticket.id}
                        style={{ background: '#10b981' }}
                      >
                        Complete & Resolve
                      </button>
                    )}
                  </div>

                  {ticket.resolutionNotes && (
                    <div className="resolution-notes-box">
                      <label>Your Resolution Summary</label>
                      <p>{ticket.resolutionNotes}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleComments(ticket.id)}
                    aria-expanded={expandedComments[ticket.id] || false}
                    style={{
                      marginBottom: '1rem',
                      background: '#f8fafc',
                      color: '#0f172a',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '0.65rem 0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {expandedComments[ticket.id]
                      ? `Hide Comments (${ticket.ticketMessages?.length || 0}) ▲`
                      : `Show Comments (${ticket.ticketMessages?.length || 0}) ▼`}
                  </button>

                  {expandedComments[ticket.id] && (
                    <CommentSection ticket={ticket} onUpdate={handleTicketUpdate} />
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {isResolveModalOpen && (
        <div className="resolve-modal-overlay" onClick={closeResolveModal}>
          <div className="resolve-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Complete & Resolve Ticket</h3>
            <p>Add a short resolution message before closing this ticket.</p>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Enter resolution details..."
              disabled={!!updatingTicketId}
            />
            <div className="resolve-modal-actions">
              <button
                type="button"
                className="resolve-cancel-btn"
                onClick={closeResolveModal}
                disabled={!!updatingTicketId}
              >
                Cancel
              </button>
              <button
                type="button"
                className="status-action-btn resolve-action"
                onClick={handleResolveSubmit}
                disabled={!!updatingTicketId}
              >
                {updatingTicketId ? 'Submitting...' : 'Submit & Resolve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default TechnicianTickets;
