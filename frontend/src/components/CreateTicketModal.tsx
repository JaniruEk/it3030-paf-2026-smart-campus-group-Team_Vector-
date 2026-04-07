import React, { useState, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { createTicket, getResources } from '../services/ticketService';
import type { CreateTicketPayload, Resource, TicketAttachment } from '../types/ticket';
import { X, Upload, MapPin, Box } from 'lucide-react';
import './CreateTicketModal.css';

interface CreateTicketModalProps {
  onClose: () => void;
  onCreated: (ticket: any) => void;
}

const CATEGORY_OPTIONS = ['ELECTRICAL', 'PLUMBING', 'CLEANING', 'IT_SUPPORT', 'FURNITURE', 'SECURITY', 'OTHER'];
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const MAX_ATTACHMENTS = 3;

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ onClose, onCreated }) => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'RESOURCE' | 'LOCATION'>('RESOURCE');

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
    const loadResources = async () => {
      try {
        const data = await getResources();
        setResources(data);
      } catch (error) {
        toast.error('Failed to load campus resources');
      }
    };
    loadResources();
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    if (formData.attachments.length + files.length > MAX_ATTACHMENTS) {
      toast.error(`Maximum ${MAX_ATTACHMENTS} images allowed`);
      return;
    }

    const newAttachments: TicketAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
        newAttachments.push({
            fileName: file.name,
            contentType: file.type,
            dataUrl
        });
    }

    setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'RESOURCE' && !formData.resourceId) {
      toast.error('Please select a resource');
      return;
    }
    if (mode === 'LOCATION' && !formData.location) {
      toast.error('Please specify a location');
      return;
    }
    if (!formData.description) {
      toast.error('Please describe the issue');
      return;
    }

    try {
      setIsSubmitting(true);
      const ticket = await createTicket(formData);
      toast.success('Incident reported successfully');
      onCreated(ticket);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="audit-modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div
        className="audit-modal-content"
        style={{
          width: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.75)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          padding: '2rem'
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close report incident form"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            width: '36px',
            height: '36px',
            borderRadius: '999px',
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569'
          }}
        >
          <X size={20} />
        </button>

        <div className="modal-header" style={{ marginBottom: '2rem', paddingRight: '3rem' }}>
          <div>
            <h2>Report New Incident</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Provide details about the maintenance issue.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-ticket-tabs">
            <button 
                type="button"
                className={`tab-btn ${mode === 'RESOURCE' ? 'active' : ''}`}
                onClick={() => setMode('RESOURCE')}
            >
                <Box size={18} /> Specific Asset
            </button>
            <button 
                type="button"
                className={`tab-btn ${mode === 'LOCATION' ? 'active' : ''}`}
                onClick={() => setMode('LOCATION')}
            >
                <MapPin size={18} /> General Location
            </button>
          </div>

          <div className="form-grid">
             {mode === 'RESOURCE' ? (
                 <section className="form-section">
                    <label className="preview-label">Campus Asset</label>
                    <select 
                        className="form-select"
                        value={formData.resourceId}
                        onChange={(e) => {
                            const res = resources.find(r => r.id === e.target.value);
                            setFormData(prev => ({ ...prev, resourceId: e.target.value, resourceName: res?.name || '' }));
                        }}
                    >
                        <option value="">Select Resource</option>
                        {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                    </select>
                 </section>
             ) : (
                 <section className="form-section">
                    <label className="preview-label">Location</label>
                    <input 
                        type="text"
                        className="form-input"
                        placeholder="e.g. Library 2nd Floor"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    />
                 </section>
             )}

             <section className="form-section">
                <label className="preview-label">Category</label>
                <select 
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                </select>
             </section>
          </div>

          <div className="form-section" style={{ marginBottom: '1.5rem' }}>
            <label className="preview-label">Issue Description</label>
            <textarea 
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                style={{ minHeight: '100px' }}
            />
          </div>

          <div className="form-grid">
             <section className="form-section">
                <label className="preview-label">Priority Level</label>
                <div className="priority-selector">
                    {PRIORITY_OPTIONS.map(p => (
                        <label key={p} className="priority-option">
                            <input 
                                type="radio" 
                                name="priority" 
                                checked={formData.priority === p}
                                onChange={() => setFormData(prev => ({ ...prev, priority: p }))}
                            />
                            <div className="priority-card">{p}</div>
                        </label>
                    ))}
                </div>
             </section>

             <section className="form-section">
                <label className="preview-label">Upload Evidence (Max 3)</label>
                <label className="upload-zone">
                    <Upload size={20} />
                    <span>Select Images</span>
                    <input type="file" multiple accept="image/*" hidden onChange={handleFileChange} />
                </label>
                <div className="attachment-preview-strip">
                    {formData.attachments.map((a, i) => (
                        <img key={i} src={a.dataUrl} alt="preview" className="attachment-thumbnail" />
                    ))}
                </div>
             </section>
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'REPORTING INCIDENT...' : 'SUBMIT INCIDENT REPORT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
