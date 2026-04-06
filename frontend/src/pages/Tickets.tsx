import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createTicket, getMyTickets, getResources } from '../services/ticketService';
import type { CreateTicketPayload, MaintenanceTicket, Resource, TicketAttachment } from '../types/ticket';
import './Tickets.css';

const CATEGORY_OPTIONS = [
  'ELECTRICAL',
  'PLUMBING',
  'CLEANING',
  'IT_SUPPORT',
  'FURNITURE',
  'SECURITY',
  'OTHER',
];

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const CONTACT_METHOD_OPTIONS = ['EMAIL', 'PHONE', 'WHATSAPP', 'ANY'];

const MAX_ATTACHMENTS = 3;

type ResourceLocationMode = 'RESOURCE' | 'LOCATION';
type ContactMethod = 'EMAIL' | 'PHONE' | 'WHATSAPP' | 'ANY';

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
    return maybeError.response?.data?.message || maybeError.message || 'Something went wrong.';
  }
  return 'Something went wrong.';
};

const toLocalDateTime = (value?: string): string => {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleString();
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Invalid file content'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read attachment file'));
    reader.readAsDataURL(file);
  });
};

const Tickets = () => {
  const { currentUser } = useAuth();

  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resourceLocationMode, setResourceLocationMode] = useState<ResourceLocationMode>('RESOURCE');

  const [formData, setFormData] = useState<CreateTicketPayload>({
    resourceId: '',
    resourceName: '',
    location: '',
    category: 'ELECTRICAL',
    description: '',
    priority: 'MEDIUM',
    preferredContactDetails: currentUser?.email || '',
    preferredContactMethod: 'EMAIL',
    attachments: [],
  });

  useEffect(() => {
    if (currentUser?.email && (formData.preferredContactMethod || 'ANY') === 'EMAIL') {
      setFormData((prev) => ({
        ...prev,
        preferredContactDetails: currentUser.email || '',
      }));
    }
  }, [currentUser, formData.preferredContactMethod]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingTickets(true);
        const [ticketsResponse, resourcesResponse] = await Promise.all([getMyTickets(), getResources()]);
        setTickets(ticketsResponse);
        setResources(resourcesResponse);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setIsLoadingTickets(false);
      }
    };

    loadData();
  }, []);

  const selectedResourceName = useMemo(() => {
    if (!formData.resourceId) {
      return '';
    }
    const selectedResource = resources.find((resource) => resource.id === formData.resourceId);
    return selectedResource?.name || '';
  }, [formData.resourceId, resources]);

  const onFieldChange = (field: keyof CreateTicketPayload, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onResourceChange = (resourceId: string) => {
    const selectedResource = resources.find((resource) => resource.id === resourceId);
    setFormData((prev) => ({
      ...prev,
      resourceId,
      resourceName: selectedResource?.name || '',
    }));
  };

  const onResourceLocationModeChange = (mode: ResourceLocationMode) => {
    setResourceLocationMode(mode);
    setFormData((prev) => ({
      ...prev,
      resourceId: mode === 'LOCATION' ? '' : prev.resourceId,
      resourceName: mode === 'LOCATION' ? '' : prev.resourceName,
      location: mode === 'RESOURCE' ? '' : prev.location,
    }));
  };

  const onPreferredContactMethodChange = (method: ContactMethod) => {
    setFormData((prev) => ({
      ...prev,
      preferredContactMethod: method,
      preferredContactDetails: method === 'EMAIL' ? (currentUser?.email || '') : '',
    }));
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pickedFiles = Array.from(files);

    if (formData.attachments.length + pickedFiles.length > MAX_ATTACHMENTS) {
      toast.error('You can upload up to 3 image attachments.');
      event.target.value = '';
      return;
    }

    try {
      const newAttachments: TicketAttachment[] = [];

      for (const file of pickedFiles) {
        if (!file.type.startsWith('image/')) {
          throw new Error(`Only image files are allowed: ${file.name}`);
        }

        const dataUrl = await readFileAsDataUrl(file);
        newAttachments.push({
          fileName: file.name,
          contentType: file.type,
          dataUrl,
        });
      }

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments],
      }));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (resourceLocationMode === 'RESOURCE' && !formData.resourceId?.trim()) {
      toast.error('Please select a specific resource.');
      return;
    }

    if (resourceLocationMode === 'LOCATION' && !formData.location.trim()) {
      toast.error('Please enter a specific location.');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required.');
      return;
    }

    if (!formData.preferredContactDetails.trim()) {
      toast.error('Preferred contact details are required.');
      return;
    }

    if (formData.attachments.length > MAX_ATTACHMENTS) {
      toast.error('You can upload up to 3 image attachments.');
      return;
    }

    const selectedResource = resources.find((resource) => resource.id === formData.resourceId);

    const payload: CreateTicketPayload = {
      ...formData,
      resourceId: resourceLocationMode === 'RESOURCE' ? formData.resourceId?.trim() || undefined : undefined,
      resourceName: resourceLocationMode === 'RESOURCE'
        ? selectedResourceName || formData.resourceName?.trim() || undefined
        : undefined,
      location: resourceLocationMode === 'RESOURCE'
        ? selectedResource?.name?.trim() || ''
        : formData.location.trim(),
      description: formData.description.trim(),
      preferredContactDetails: formData.preferredContactDetails.trim(),
      preferredContactMethod: formData.preferredContactMethod?.trim() || undefined,
    };

    if (!payload.location) {
      toast.error('Please select a specific resource or enter a location.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdTicket = await createTicket(payload);

      setTickets((prev) => [createdTicket, ...prev]);
      setResourceLocationMode('RESOURCE');
      setFormData({
        resourceId: '',
        resourceName: '',
        location: '',
        category: 'ELECTRICAL',
        description: '',
        priority: 'MEDIUM',
        preferredContactDetails: currentUser?.email || '',
        preferredContactMethod: 'EMAIL',
        attachments: [],
      });
      toast.success('Ticket created successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tickets-page-layout">
      <header className="tickets-header">
        <div>
          <h2>Maintenance Tickets</h2>
          <p>Raise an issue and track all tickets you created.</p>
        </div>
        <Link to="/dashboard" className="back-link">Back to Dashboard</Link>
      </header>

      <main className="tickets-content-grid">
        <section className="ticket-create-card">
          <h3>Create New Ticket</h3>
          <form onSubmit={onSubmit} className="ticket-form">
            <label>
              Resource / Location
              <select
                value={resourceLocationMode}
                onChange={(event) => onResourceLocationModeChange(event.target.value as ResourceLocationMode)}
              >
                <option value="RESOURCE">Resource</option>
                <option value="LOCATION">Location</option>
              </select>
            </label>

            {resourceLocationMode === 'RESOURCE' ? (
              <label>
                Specific Resource
                <select
                  value={formData.resourceId}
                  onChange={(event) => onResourceChange(event.target.value)}
                >
                  <option value="">Select a specific resource</option>
                  {resources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} ({resource.type})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label>
                Specific Location
                <input
                  type="text"
                  placeholder="Example: Engineering Building - Floor 2"
                  value={formData.location}
                  onChange={(event) => onFieldChange('location', event.target.value)}
                  required
                />
              </label>
            )}

            <label>
              Category
              <select
                value={formData.category}
                onChange={(event) => onFieldChange('category', event.target.value)}
              >
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select
                value={formData.priority}
                onChange={(event) => onFieldChange('priority', event.target.value)}
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label>
              Description
              <textarea
                rows={5}
                placeholder="Describe the issue with as much detail as possible."
                value={formData.description}
                onChange={(event) => onFieldChange('description', event.target.value)}
                required
              />
            </label>

            <label>
              Preferred Contact Method
              <select
                value={formData.preferredContactMethod || 'ANY'}
                onChange={(event) => onPreferredContactMethodChange(event.target.value as ContactMethod)}
              >
                {CONTACT_METHOD_OPTIONS.map((method) => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </label>

            <label>
              Preferred Contact Details
              <input
                type="text"
                placeholder={
                  (formData.preferredContactMethod || 'ANY') === 'EMAIL'
                    ? 'Your login email will be used'
                    : 'Example: 0771234567'
                }
                value={formData.preferredContactDetails}
                onChange={(event) => onFieldChange('preferredContactDetails', event.target.value)}
                readOnly={(formData.preferredContactMethod || 'ANY') === 'EMAIL'}
                required
              />
            </label>

            <label>
              Image Attachments (max 3)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
              />
            </label>

            {formData.attachments.length > 0 && (
              <div className="attachment-preview-grid">
                {formData.attachments.map((attachment, index) => (
                  <div key={`${attachment.fileName}-${index}`} className="attachment-preview-item">
                    <img src={attachment.dataUrl} alt={attachment.fileName} />
                    <div className="attachment-preview-footer">
                      <span title={attachment.fileName}>{attachment.fileName}</span>
                      <button type="button" onClick={() => removeAttachment(index)}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="submit-ticket-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Create Ticket'}
            </button>
          </form>
        </section>

        <section className="ticket-list-card">
          <h3>My Tickets</h3>
          {isLoadingTickets ? (
            <p>Loading your tickets...</p>
          ) : tickets.length === 0 ? (
            <p>No tickets created yet. Use the form to create your first ticket.</p>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <article key={ticket.id} className="ticket-item">
                  <div className="ticket-item-header">
                    <h4>{ticket.category} Issue</h4>
                    <span className={`status-pill status-${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                  </div>
                  <p className="ticket-meta">
                    Priority: <strong>{ticket.priority}</strong> | Created: <strong>{toLocalDateTime(ticket.createdAt)}</strong>
                  </p>
                  <p className="ticket-meta">
                    {ticket.resourceName ? (
                      <>Resource: <strong>{ticket.resourceName}</strong></>
                    ) : (
                      <>Location: <strong>{ticket.location}</strong></>
                    )}
                  </p>
                  <p className="ticket-description">{ticket.description}</p>
                  <p className="ticket-meta">
                    Contact ({ticket.preferredContactMethod || 'ANY'}): <strong>{ticket.preferredContactDetails}</strong>
                  </p>

                  {ticket.attachments?.length > 0 && (
                    <div className="ticket-attachments">
                      {ticket.attachments.map((attachment, index) => (
                        <a
                          key={`${ticket.id}-${attachment.fileName}-${index}`}
                          href={attachment.dataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="ticket-attachment-link"
                        >
                          <img src={attachment.dataUrl} alt={attachment.fileName} />
                        </a>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Tickets;