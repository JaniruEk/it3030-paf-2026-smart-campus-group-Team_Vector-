import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  getMyTickets,
} from '../services/ticketService';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import AppLayout from '../components/AppLayout';
import CreateTicketModal from '../components/CreateTicketModal';
import './Tickets.css';
import './AdminDashboard.css';

const CATEGORY_OPTIONS = ['ELECTRICAL', 'PLUMBING', 'CLEANING', 'IT_SUPPORT', 'FURNITURE', 'SECURITY', 'OTHER'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const MAX_ATTACHMENTS = 3;

const formatDate = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const Tickets = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const ticketsResponse = await getMyTickets();
        setTickets(ticketsResponse);
      } catch (error: any) {
        toast.error(error.message || 'Failed to load tickets');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleTicketCreated = (newTicket: MaintenanceTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setIsModalOpen(false);
  };

  const handleTicketUpdate = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  return (
    <AppLayout activeTab="none">
      <div className="admin-card">
        <div className="card-header">
          <h3>Your Maintenance Tickets</h3>
          <p>Track the status of your reported incidents and communicate with technicians.</p>
        </div>
        
        <div style={{ padding: '2rem' }}>
          <div className="ticket-actions" style={{ marginBottom: '2rem' }}>
            <button className="create-btn" onClick={() => setIsModalOpen(true)}>
              Report New Incident
            </button>
          </div>

          {isLoading ? (
            <div className="loading-state">Syncing with campus services...</div>
          ) : tickets.length === 0 ? (
            <div className="empty-state">You haven't reported any incidents yet.</div>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="admin-ticket-card">
                  <div className="admin-ticket-card-head">
                    <div className="ticket-title-group">
                      <h3>{ticket.category} Issue</h3>
                      <div className="badge-row">
                        <span className={`status-pill status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                        <span className={`priority-pill priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                      </div>
                    </div>
                  </div>

                  <div className="admin-ticket-grid">
                    <div className="ticket-info-main">
                      <div className="info-row">
                        <div className="info-item">
                          <label>Submitted</label>
                          <span>{formatDate(ticket.createdAt)}</span>
                        </div>
                        <div className="info-item">
                          <label>Resource / Location</label>
                          <span>{ticket.resourceName || ticket.location}</span>
                        </div>
                      </div>
                      <div className="info-item full">
                        <label>Issue Description</label>
                        <p>{ticket.description}</p>
                      </div>
                      <div className="info-item full">
                        <label>Assigned Technician</label>
                        <span style={{ color: ticket.assignedTechnicianEmail ? '#0f172a' : '#94a3b8', fontWeight: 600 }}>
                          {ticket.assignedTechnicianEmail || 'System Assignment Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="ticket-attachments-side">
                      <label>Your Evidence</label>
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

                  {ticket.resolutionNotes && (
                    <div className="resolution-notes-box">
                      <label>Resolution Summary</label>
                      <p>{ticket.resolutionNotes}</p>
                    </div>
                  )}

                  <CommentSection ticket={ticket} onUpdate={handleTicketUpdate} />
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateTicketModal
          onClose={() => setIsModalOpen(false)}
          onCreated={handleTicketCreated}
        />
      )}
    </AppLayout>
  );
};

export default Tickets;