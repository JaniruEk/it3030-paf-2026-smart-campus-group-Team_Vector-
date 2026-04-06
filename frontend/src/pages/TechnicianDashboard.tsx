import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAssignedTechnicianTickets, updateTicketStatusByTechnician } from '../services/ticketService';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import './TechnicianDashboard.css';

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const TechnicianDashboard = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

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

  const handleUpdateStatus = async (ticketId: string, status: string) => {
    let resolutionNotes = '';
    if (status === 'RESOLVED') {
      const notes = window.prompt('Please enter resolution notes:');
      if (notes === null) return;
      resolutionNotes = notes.trim();
      if (!resolutionNotes) {
        toast.error('Resolution notes are required to resolve the ticket');
        return;
      }
    }

    try {
      setUpdatingTicketId(ticketId);
      const updatedTicket = await updateTicketStatusByTechnician(ticketId, {
        status,
        resolutionNotes,
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

  return (
    <div className="technician-dashboard">
      <header className="tech-header">
        <div>
          <h2>Technician Workspace</h2>
          <p>Manage your assigned maintenance tasks and communicate with users.</p>
        </div>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </header>

      {isLoading ? (
        <div className="loading">Loading assigned tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">No tickets assigned to you at the moment.</div>
      ) : (
        <div className="ticket-grid">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="tech-ticket-card">
              <div className="ticket-card-header">
                <h3>{ticket.category} Issue</h3>
                <span className={`status-badge status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
              </div>

              <div className="ticket-card-body">
                <p><strong>Created:</strong> {formatDate(ticket.createdAt)}</p>
                <p><strong>Location:</strong> {ticket.resourceName || ticket.location}</p>
                <p className="ticket-description"><strong>Description:</strong> {ticket.description}</p>
                
                {ticket.resolutionNotes && (
                  <div className="resolution-display">
                    <strong>Current Resolution Notes:</strong>
                    <p>{ticket.resolutionNotes}</p>
                  </div>
                )}
              </div>

              <div className="ticket-card-actions">
                {ticket.status === 'OPEN' && (
                  <button 
                    onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                    disabled={updatingTicketId === ticket.id}
                  >
                    Start Working
                  </button>
                )}
                {ticket.status === 'IN_PROGRESS' && (
                  <button 
                    className="resolve-btn"
                    onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                    disabled={updatingTicketId === ticket.id}
                  >
                    Resolve Ticket
                  </button>
                )}
                {ticket.status === 'RESOLVED' && (
                  <button 
                    onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                    disabled={updatingTicketId === ticket.id}
                  >
                    Reopen for Work
                  </button>
                )}
              </div>

              <CommentSection ticket={ticket} onUpdate={handleTicketUpdate} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
