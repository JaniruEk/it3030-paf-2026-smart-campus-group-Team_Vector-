import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getAssignedTechnicianTickets,
  patchTechnicianTicketStatus,
  postTechnicianTicketMessage,
} from '../services/ticketService';
import type { MaintenanceTicket } from '../types/ticket';
import './TechnicianTickets.css';

type MessageImage = {
  fileName: string;
  contentType: string;
  dataUrl: string;
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

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

const isUpdateBlockedStatus = (status?: string) => {
  const normalizedStatus = (status || 'OPEN').toUpperCase();
  return normalizedStatus === 'CLOSED' || normalizedStatus === 'REJECTED';
};

const getNextTechnicianStatus = (status?: string): 'IN_PROGRESS' | 'RESOLVED' | null => {
  const normalizedStatus = (status || 'OPEN').toUpperCase();

  if (normalizedStatus === 'IN_PROGRESS') {
    return 'RESOLVED';
  }

  if (normalizedStatus === 'RESOLVED') {
    return 'IN_PROGRESS';
  }

  return null;
};

const TechnicianTickets = () => {
  const { currentUser, userRole } = useAuth();

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sendingTicketId, setSendingTicketId] = useState<string | null>(null);
  const [statusUpdatingTicketId, setStatusUpdatingTicketId] = useState<string | null>(null);

  const [messageByTicket, setMessageByTicket] = useState<Record<string, string>>({});
  const [imageByTicket, setImageByTicket] = useState<Record<string, MessageImage | undefined>>({});

  useEffect(() => {
    const loadAssignedTickets = async () => {
      try {
        setIsLoading(true);
        const response = await getAssignedTechnicianTickets();
        setTickets(response);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignedTickets();
  }, []);

  if (userRole && userRole !== 'TECHNICIAN') {
    return <Navigate to="/dashboard" replace />;
  }

  const onImagePick = async (ticketId: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed.');
      event.target.value = '';
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageByTicket((prev) => ({
        ...prev,
        [ticketId]: {
          fileName: file.name,
          contentType: file.type,
          dataUrl,
        },
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  };

  const clearImage = (ticketId: string) => {
    setImageByTicket((prev) => ({
      ...prev,
      [ticketId]: undefined,
    }));
  };

  const onSendUpdate = async (ticket: MaintenanceTicket, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isUpdateBlockedStatus(ticket.status)) {
      toast.error('Updates are blocked for closed or rejected tickets.');
      return;
    }

    const ticketId = ticket.id;
    const message = (messageByTicket[ticketId] || '').trim();
    const image = imageByTicket[ticketId];

    if (!message && !image) {
      toast.error('Add a message or image before sending.');
      return;
    }

    try {
      setSendingTicketId(ticketId);
      const updatedTicket = await postTechnicianTicketMessage(ticketId, {
        message: message || undefined,
        imageDataUrl: image?.dataUrl,
        imageFileName: image?.fileName,
        imageContentType: image?.contentType,
        senderEmail: currentUser?.email || undefined,
      });

      setTickets((prev) => prev.map((item) => (item.id === ticketId ? updatedTicket : item)));
      setMessageByTicket((prev) => ({
        ...prev,
        [ticketId]: '',
      }));
      setImageByTicket((prev) => ({
        ...prev,
        [ticketId]: undefined,
      }));
      toast.success('Update sent successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSendingTicketId(null);
    }
  };

  const onUpdateStatus = async (ticket: MaintenanceTicket, targetStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      setStatusUpdatingTicketId(ticket.id);
      const updatedTicket = await patchTechnicianTicketStatus(ticket.id, {
        status: targetStatus,
      });

      setTickets((prev) => prev.map((item) => (item.id === ticket.id ? updatedTicket : item)));
      toast.success(`Ticket moved to ${targetStatus}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setStatusUpdatingTicketId(null);
    }
  };

  return (
    <div className="technician-page">
      <header className="technician-header">
        <div>
          <h2>Assigned Tickets</h2>
          <p>Manage all tickets assigned to you and send updates with optional images.</p>
        </div>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </header>

      {isLoading ? (
        <div className="technician-state-card">Loading assigned tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="technician-state-card">No tickets are assigned to you yet.</div>
      ) : (
        <div className="technician-ticket-list">
          {tickets.map((ticket) => {
            const isUpdateBlocked = isUpdateBlockedStatus(ticket.status);
            const nextStatus = getNextTechnicianStatus(ticket.status);
            const isStatusUpdateDisabled = statusUpdatingTicketId === ticket.id || nextStatus === null;

            return (
              <article key={ticket.id} className="technician-ticket-card">
                <div className="technician-ticket-head">
                  <h3>{ticket.category} | {ticket.priority}</h3>
                  <span className={`status-pill status-${(ticket.status || 'OPEN').toLowerCase()}`}>{ticket.status || 'OPEN'}</span>
                </div>

                <p><strong>Location:</strong> {ticket.resourceName || ticket.location}</p>
                <p><strong>Description:</strong> {ticket.description}</p>
                <p><strong>Requester Contact:</strong> {ticket.preferredContactMethod || 'ANY'} - {ticket.preferredContactDetails}</p>
                <p><strong>Last Updated:</strong> {formatDate(ticket.updatedAt)}</p>

                <div className="technician-status-actions">
                  <button
                    type="button"
                    className="status-action-btn"
                    disabled={isStatusUpdateDisabled}
                    onClick={() => {
                      if (!nextStatus) {
                        return;
                      }
                      onUpdateStatus(ticket, nextStatus);
                    }}
                  >
                    {statusUpdatingTicketId === ticket.id
                      ? 'Updating Status...'
                      : nextStatus === 'RESOLVED'
                        ? 'Mark as Resolved'
                        : nextStatus === 'IN_PROGRESS'
                          ? 'Move Back to In Progress'
                          : 'Status Update Not Available'}
                  </button>
                </div>

                <div className="ticket-message-history">
                  <h4>Ticket Updates</h4>
                  {ticket.ticketMessages && ticket.ticketMessages.length > 0 ? (
                    <div className="message-list">
                      {ticket.ticketMessages.map((item, index) => (
                        <div key={`${ticket.id}-${index}`} className="message-item">
                          <div className="message-meta">
                            <span>{item.senderEmail || item.senderRole || 'Update'}</span>
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          {item.message ? <p>{item.message}</p> : null}
                          {item.imageDataUrl ? (
                            <a href={item.imageDataUrl} target="_blank" rel="noreferrer" className="message-image-link">
                              <img src={item.imageDataUrl} alt={item.imageFileName || 'Update image'} />
                            </a>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-updates">No updates sent yet.</p>
                  )}
                </div>

                {isUpdateBlocked ? (
                  <p className="update-blocked-note">Updates are not allowed for this ticket status.</p>
                ) : null}

                <form className="ticket-update-form" onSubmit={(event) => onSendUpdate(ticket, event)}>
                  <textarea
                    rows={3}
                    placeholder="Write a ticket update..."
                    value={messageByTicket[ticket.id] || ''}
                    onChange={(event) => setMessageByTicket((prev) => ({
                      ...prev,
                      [ticket.id]: event.target.value,
                    }))}
                    disabled={isUpdateBlocked || sendingTicketId === ticket.id}
                  />

                  <div className="image-picker-row">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => onImagePick(ticket.id, event)}
                      disabled={isUpdateBlocked || sendingTicketId === ticket.id}
                    />
                    {imageByTicket[ticket.id] ? (
                      <button
                        type="button"
                        className="clear-image-btn"
                        onClick={() => clearImage(ticket.id)}
                        disabled={isUpdateBlocked || sendingTicketId === ticket.id}
                      >
                        Remove Image
                      </button>
                    ) : null}
                  </div>

                  {imageByTicket[ticket.id] ? (
                    <div className="picked-image-preview">
                      <img src={imageByTicket[ticket.id]?.dataUrl} alt={imageByTicket[ticket.id]?.fileName || 'Preview'} />
                      <span>{imageByTicket[ticket.id]?.fileName}</span>
                    </div>
                  ) : null}

                  <button type="submit" className="send-update-btn" disabled={isUpdateBlocked || sendingTicketId === ticket.id}>
                    {sendingTicketId === ticket.id ? 'Sending...' : 'Send Update'}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TechnicianTickets;
