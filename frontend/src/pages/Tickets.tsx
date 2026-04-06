import { useEffect, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  createTicket,
  deleteMyTicket,
  getMyTickets,
  getResources,
  updateMyTicket,
} from '../services/ticketService';
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

const createEmptyTicketForm = (email?: string): CreateTicketPayload => ({
  resourceId: '',
  resourceName: '',
  location: '',
  category: 'ELECTRICAL',
  description: '',
  priority: 'MEDIUM',
  preferredContactDetails: email || '',
  preferredContactMethod: 'EMAIL',
  attachments: [],
});

const normalizeContactMethod = (value?: string): ContactMethod => {
  const normalized = (value || 'ANY').toUpperCase();
  if (normalized === 'EMAIL' || normalized === 'PHONE' || normalized === 'WHATSAPP' || normalized === 'ANY') {
    return normalized;
  }
  return 'ANY';
};

const isTicketEditableByUser = (status?: string): boolean => {
  const normalizedStatus = (status || 'OPEN').toUpperCase();
  return normalizedStatus !== 'RESOLVED' && normalizedStatus !== 'CLOSED' && normalizedStatus !== 'REJECTED';
};

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
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [deletingTicketId, setDeletingTicketId] = useState<string | null>(null);

  const [resourceLocationMode, setResourceLocationMode] = useState<ResourceLocationMode>('RESOURCE');
  const [editResourceLocationMode, setEditResourceLocationMode] = useState<ResourceLocationMode>('RESOURCE');

  const [formData, setFormData] = useState<CreateTicketPayload>(() => createEmptyTicketForm(currentUser?.email || undefined));
  const [editFormData, setEditFormData] = useState<CreateTicketPayload>(() => createEmptyTicketForm(currentUser?.email || undefined));

  useEffect(() => {
    if (currentUser?.email && (formData.preferredContactMethod || 'ANY') === 'EMAIL') {
      setFormData((prev) => ({
        ...prev,
        preferredContactDetails: currentUser.email || '',
      }));
    }
  }, [currentUser, formData.preferredContactMethod]);

  useEffect(() => {
    if (editingTicketId && currentUser?.email && (editFormData.preferredContactMethod || 'ANY') === 'EMAIL') {
      setEditFormData((prev) => ({
        ...prev,
        preferredContactDetails: currentUser.email || '',
      }));
    }
  }, [currentUser, editingTicketId, editFormData.preferredContactMethod]);

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

  const onEditFieldChange = (field: keyof CreateTicketPayload, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const onEditResourceChange = (resourceId: string) => {
    const selectedResource = resources.find((resource) => resource.id === resourceId);
    setEditFormData((prev) => ({
      ...prev,
      resourceId,
      resourceName: selectedResource?.name || '',
    }));
  };

  const onEditResourceLocationModeChange = (mode: ResourceLocationMode) => {
    setEditResourceLocationMode(mode);
    setEditFormData((prev) => ({
      ...prev,
      resourceId: mode === 'LOCATION' ? '' : prev.resourceId,
      resourceName: mode === 'LOCATION' ? '' : prev.resourceName,
      location: mode === 'RESOURCE' ? '' : prev.location,
    }));
  };

  const onEditPreferredContactMethodChange = (method: ContactMethod) => {
    setEditFormData((prev) => ({
      ...prev,
      preferredContactMethod: method,
      preferredContactDetails: method === 'EMAIL' ? (currentUser?.email || '') : '',
    }));
  };

  const buildTicketPayload = (data: CreateTicketPayload, mode: ResourceLocationMode): CreateTicketPayload | null => {
    if (mode === 'RESOURCE' && !data.resourceId?.trim()) {
      toast.error('Please select a specific resource.');
      return null;
    }

    if (mode === 'LOCATION' && !data.location.trim()) {
      toast.error('Please enter a specific location.');
      return null;
    }

    if (!data.description.trim()) {
      toast.error('Description is required.');
      return null;
    }

    if (!data.preferredContactDetails.trim()) {
      toast.error('Preferred contact details are required.');
      return null;
    }

    if (data.attachments.length > MAX_ATTACHMENTS) {
      toast.error('You can upload up to 3 image attachments.');
      return null;
    }

    const selectedResource = resources.find((resource) => resource.id === data.resourceId);

    const payload: CreateTicketPayload = {
      ...data,
      resourceId: mode === 'RESOURCE' ? data.resourceId?.trim() || undefined : undefined,
      resourceName: mode === 'RESOURCE'
        ? selectedResource?.name || data.resourceName?.trim() || undefined
        : undefined,
      location: mode === 'RESOURCE'
        ? selectedResource?.name?.trim() || data.location.trim()
        : data.location.trim(),
      description: data.description.trim(),
      preferredContactDetails: data.preferredContactDetails.trim(),
      preferredContactMethod: data.preferredContactMethod?.trim() || undefined,
    };

    if (!payload.location) {
      toast.error('Please select a specific resource or enter a location.');
      return null;
    }

    return payload;
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

  const onEditFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const pickedFiles = Array.from(files);

    if (editFormData.attachments.length + pickedFiles.length > MAX_ATTACHMENTS) {
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

      setEditFormData((prev) => ({
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

  const removeEditAttachment = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
    }));
  };

  const cancelEditingTicket = () => {
    setEditingTicketId(null);
    setEditResourceLocationMode('RESOURCE');
    setEditFormData(createEmptyTicketForm(currentUser?.email || undefined));
  };

  const startEditingTicket = (ticket: MaintenanceTicket) => {
    if (!isTicketEditableByUser(ticket.status)) {
      toast.error('Ticket can only be edited before it is resolved.');
      return;
    }

    const hasResource = Boolean(ticket.resourceId?.trim());
    setEditResourceLocationMode(hasResource ? 'RESOURCE' : 'LOCATION');
    setEditFormData({
      resourceId: ticket.resourceId || '',
      resourceName: ticket.resourceName || '',
      location: ticket.location || '',
      category: ticket.category || 'ELECTRICAL',
      description: ticket.description || '',
      priority: ticket.priority || 'MEDIUM',
      preferredContactDetails: ticket.preferredContactDetails || currentUser?.email || '',
      preferredContactMethod: normalizeContactMethod(ticket.preferredContactMethod),
      attachments: ticket.attachments || [],
    });
    setEditingTicketId(ticket.id);
  };

  const onUpdateTicket = async (ticket: MaintenanceTicket, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isTicketEditableByUser(ticket.status)) {
      toast.error('Ticket can only be edited before it is resolved.');
      return;
    }

    const payload = buildTicketPayload(editFormData, editResourceLocationMode);
    if (!payload) {
      return;
    }

    try {
      setUpdatingTicketId(ticket.id);
      const updatedTicket = await updateMyTicket(ticket.id, payload);
      setTickets((prev) => prev.map((item) => (item.id === ticket.id ? updatedTicket : item)));
      toast.success('Ticket updated successfully.');
      cancelEditingTicket();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const onDeleteTicket = async (ticket: MaintenanceTicket) => {
    const shouldDelete = window.confirm('Are you sure you want to delete this ticket?');
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingTicketId(ticket.id);
      await deleteMyTicket(ticket.id);
      setTickets((prev) => prev.filter((item) => item.id !== ticket.id));
      if (editingTicketId === ticket.id) {
        cancelEditingTicket();
      }
      toast.success('Ticket deleted successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingTicketId(null);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildTicketPayload(formData, resourceLocationMode);
    if (!payload) {
      return;
    }

    try {
      setIsSubmitting(true);
      const createdTicket = await createTicket(payload);

      setTickets((prev) => [createdTicket, ...prev]);
      setResourceLocationMode('RESOURCE');
      setFormData(createEmptyTicketForm(currentUser?.email || undefined));
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
              {tickets.map((ticket) => {
                const isEditing = editingTicketId === ticket.id;
                const isDeleting = deletingTicketId === ticket.id;
                const isUpdating = updatingTicketId === ticket.id;
                const canEdit = isTicketEditableByUser(ticket.status);

                return (
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

                    <div className="ticket-item-actions">
                      <button
                        type="button"
                        className="ticket-action-btn ticket-edit-btn"
                        onClick={() => startEditingTicket(ticket)}
                        disabled={!canEdit || isUpdating || isDeleting}
                      >
                        {isEditing ? 'Editing' : 'Edit Ticket'}
                      </button>
                      <button
                        type="button"
                        className="ticket-action-btn ticket-delete-btn"
                        onClick={() => onDeleteTicket(ticket)}
                        disabled={isUpdating || isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Ticket'}
                      </button>
                    </div>

                    {!canEdit ? (
                      <p className="ticket-edit-note">Ticket editing is available only before status becomes RESOLVED.</p>
                    ) : null}

                    {isEditing ? (
                      <form className="ticket-edit-form" onSubmit={(event) => onUpdateTicket(ticket, event)}>
                        <label>
                          Resource / Location
                          <select
                            value={editResourceLocationMode}
                            onChange={(event) => onEditResourceLocationModeChange(event.target.value as ResourceLocationMode)}
                            disabled={isUpdating || isDeleting}
                          >
                            <option value="RESOURCE">Resource</option>
                            <option value="LOCATION">Location</option>
                          </select>
                        </label>

                        {editResourceLocationMode === 'RESOURCE' ? (
                          <label>
                            Specific Resource
                            <select
                              value={editFormData.resourceId}
                              onChange={(event) => onEditResourceChange(event.target.value)}
                              disabled={isUpdating || isDeleting}
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
                              value={editFormData.location}
                              onChange={(event) => onEditFieldChange('location', event.target.value)}
                              disabled={isUpdating || isDeleting}
                              required
                            />
                          </label>
                        )}

                        <label>
                          Category
                          <select
                            value={editFormData.category}
                            onChange={(event) => onEditFieldChange('category', event.target.value)}
                            disabled={isUpdating || isDeleting}
                          >
                            {CATEGORY_OPTIONS.map((category) => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Priority
                          <select
                            value={editFormData.priority}
                            onChange={(event) => onEditFieldChange('priority', event.target.value)}
                            disabled={isUpdating || isDeleting}
                          >
                            {PRIORITY_OPTIONS.map((priority) => (
                              <option key={priority} value={priority}>{priority}</option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Description
                          <textarea
                            rows={4}
                            value={editFormData.description}
                            onChange={(event) => onEditFieldChange('description', event.target.value)}
                            disabled={isUpdating || isDeleting}
                            required
                          />
                        </label>

                        <label>
                          Preferred Contact Method
                          <select
                            value={editFormData.preferredContactMethod || 'ANY'}
                            onChange={(event) => onEditPreferredContactMethodChange(event.target.value as ContactMethod)}
                            disabled={isUpdating || isDeleting}
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
                            value={editFormData.preferredContactDetails}
                            onChange={(event) => onEditFieldChange('preferredContactDetails', event.target.value)}
                            readOnly={(editFormData.preferredContactMethod || 'ANY') === 'EMAIL'}
                            disabled={isUpdating || isDeleting}
                            required
                          />
                        </label>

                        <label>
                          Image Attachments (max 3)
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={onEditFileChange}
                            disabled={isUpdating || isDeleting}
                          />
                        </label>

                        {editFormData.attachments.length > 0 ? (
                          <div className="attachment-preview-grid">
                            {editFormData.attachments.map((attachment, index) => (
                              <div key={`${ticket.id}-edit-${attachment.fileName}-${index}`} className="attachment-preview-item">
                                <img src={attachment.dataUrl} alt={attachment.fileName} />
                                <div className="attachment-preview-footer">
                                  <span title={attachment.fileName}>{attachment.fileName}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeEditAttachment(index)}
                                    disabled={isUpdating || isDeleting}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <div className="ticket-edit-actions">
                          <button type="submit" className="ticket-action-btn ticket-save-btn" disabled={isUpdating || isDeleting}>
                            {isUpdating ? 'Saving...' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            className="ticket-action-btn ticket-cancel-btn"
                            onClick={cancelEditingTicket}
                            disabled={isUpdating || isDeleting}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Tickets;