import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getMyTickets,
  deleteMyTicket,
} from '../services/ticketService';
import type { MaintenanceTicket } from '../types/ticket';
import CommentSection from '../components/CommentSection';
import AppLayout from '../components/AppLayout';
import CreateTicketModal from '../components/CreateTicketModal';
import ImagePreviewModal from '../components/ImagePreviewModal';
import { Edit2, ClipboardList, Trash2 } from 'lucide-react';
import './Tickets.css';
import './AdminDashboard.css';



const formatDate = (value?: string): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const Tickets = () => {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<MaintenanceTicket | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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

  const [searchParams] = useSearchParams();
  const highlightedTicketRef = useRef<string | null>(null);

  // Deep-linking logic
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && !isLoading && tickets.length > 0) {
      const element = document.getElementById(`ticket-${targetId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          highlightedTicketRef.current = targetId;
          element.classList.add('highlight-pulse');
          setTimeout(() => {
            element.classList.remove('highlight-pulse');
            highlightedTicketRef.current = null;
          }, 4000);
        }, 100);
      }
    }
  }, [searchParams, isLoading, tickets]);

  const handleTicketCreated = (newTicket: MaintenanceTicket) => {
    if (editingTicket) {
      setTickets((prev) => prev.map((t) => (t.id === newTicket.id ? newTicket : t)));
    } else {
      setTickets((prev) => [newTicket, ...prev]);
    }
    setIsModalOpen(false);
    setEditingTicket(null);
  };

  const handleTicketUpdate = (updatedTicket: MaintenanceTicket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };
  
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteMyTicket(ticketId);
      setTickets((prev) => prev.filter((t) => t.id !== ticketId));
      toast.success('Incident report deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete ticket');
    }
  };

  return (
    <AppLayout activeTab="none">
      <div className="portal-container animate-fade-in">
        <div className="portal-header">
          <div className="header-text">
            <h1 className="gradient-text">Incident Hub</h1>
            <p>Track your maintenance requests and communicate with the resolution team.</p>
          </div>
          <button className="primary-glass-btn" onClick={() => setIsModalOpen(true)}>
            Report New Incident
          </button>
        </div>

        <div className="portal-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <span>Syncing with campus services...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="empty-portal-state">
              <div className="empty-icon-shell">
                <ClipboardList size={48} />
              </div>
              <h3>No Incidents Reported</h3>
              <p>Your campus workspace is currently clear of maintenance issues.</p>
              <button className="secondary-btn" onClick={() => setIsModalOpen(true)}>Create First Report</button>
            </div>
          ) : (
            <div className="modern-card-grid">
              {tickets.map((ticket) => (
                <article key={ticket.id} id={`ticket-${ticket.id}`} className="modern-ticket-card smooth-transition">
                  <div className="card-top">
                    <div className="category-tag">
                      <span className="dot"></span>
                      {ticket.category}
                    </div>
                    <div className="badges">
                      <span className={`pill status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                      <span className={`pill priority-${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="main-info">
                      <div className="title-row">
                        <h3>Resource Issue</h3>
                        <span className="timestamp">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <div className="location-info">
                        <strong>Location:</strong> {ticket.resourceName || ticket.location}
                      </div>
                      <p className="description">{ticket.description}</p>
                    </div>

                    <div className="tech-info">
                      <label>Assigned Support</label>
                      <div className="tech-profile">
                        <div className="tech-avatar-mini">{ticket.assignedTechnicianEmail ? ticket.assignedTechnicianEmail.charAt(0).toUpperCase() : '?'}</div>
                        <span>{ticket.assignedTechnicianEmail || 'System Assignment Pending'}</span>
                      </div>
                    </div>

                    {ticket.attachments && ticket.attachments.length > 0 && (
                      <div className="card-attachments">
                        <label>Evidence</label>
                        <div className="attachment-strip">
                          {ticket.attachments.map((img, i) => (
                            <div 
                              key={i} 
                              className="strip-item clickable"
                              onClick={() => setPreviewImage(img.dataUrl)}
                            >
                              <img src={img.dataUrl} alt="Evidence" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {ticket.resolutionNotes && (
                    <div className="resolution-feedback">
                      <label>Resolution Summary</label>
                      <p>{ticket.resolutionNotes}</p>
                    </div>
                  )}

                  <CommentSection ticket={ticket} onUpdate={handleTicketUpdate} />

                  <div className="card-footer">
                    <div></div>
                    {ticket.status === 'OPEN' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                className="edit-icon-btn"
                                onClick={() => {
                                    setEditingTicket(ticket);
                                    setIsModalOpen(true);
                                }}
                                title="Edit Ticket"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                className="edit-icon-btn"
                                onClick={() => handleDeleteTicket(ticket.id!)}
                                title="Delete Ticket"
                                style={{ color: '#ef4444' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateTicketModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingTicket(null);
          }}
          onCreated={handleTicketCreated}
          editingTicket={editingTicket || undefined}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          src={previewImage}
          onClose={() => setPreviewImage(null)}
          showDownload={false} // Users don't necessarily need download for their own uploads, but we can enable if needed
        />
      )}
    </AppLayout>
  );
};

export default Tickets;