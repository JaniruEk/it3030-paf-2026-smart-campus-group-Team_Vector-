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

    const filePromises = Array.from(files).map((file) => {
      return new Promise<TicketAttachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            fileName: file.name,
            contentType: file.type,
            dataUrl: reader.result as string
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    try {
      const newAttachments = await Promise.all(filePromises);
      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    } catch (error) {
      toast.error('Failed to process image files');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (mode === 'RESOURCE' && !formData.resourceId) {
      toast.error('Please select a campus asset');
      return;
    }

    if (!formData.location.trim()) {
      toast.error('Please specify the exact location');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please describe the issue');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTicket(formData);
      toast.success('Incident reported successfully');
      onCreated(true);
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to create ticket';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="audit-modal-overlay">
      <div className="audit-modal-content">
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Report New Incident</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Provide details about the maintenance issue.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.5rem', borderRadius: '50%' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="create-ticket-tabs">
            <button 
                type="button"
                className={`tab-btn ${mode === 'RESOURCE' ? 'active' : ''}`}
                onClick={() => setMode('RESOURCE')}
            >
                <Box size={18} /> Digital Catalogue
            </button>
            <button 
                type="button"
                className={`tab-btn ${mode === 'LOCATION' ? 'active' : ''}`}
                onClick={() => {
                  setMode('LOCATION');
                  setFormData(prev => ({ ...prev, resourceId: '', resourceName: '' }));
                }}
            >
                <MapPin size={18} /> General Location
            </button>
          </div>

          <div className="form-grid" style={{ gridTemplateColumns: mode === 'RESOURCE' ? '1fr 1fr' : '1fr' }}>
             {mode === 'RESOURCE' && (
                 <section className="form-section">
                    <label className="preview-label">Campus Asset</label>
                    <select 
                        className="form-select"
                        value={formData.resourceId}
                        onChange={(e) => {
                            const res = resources.find(r => r.id === e.target.value);
                            setFormData(prev => ({ 
                                ...prev, 
                                resourceId: e.target.value, 
                                resourceName: res?.name || '',
                                // Pre-fill location if it's the first time and we have a name
                                location: prev.location || (res?.name ? `Near ${res.name}` : '')
                            }));
                        }}
                    >
                        <option value="">Select Resource</option>
                        {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                    </select>
                 </section>
             )}

             <section className="form-section">
                <label className="preview-label">Location Details</label>
                <input 
                    type="text"
                    className="form-input"
                    placeholder={mode === 'RESOURCE' ? "e.g. Under the table, Wall mount" : "e.g. Library 2nd Floor, Room B20"}
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                />
             </section>
          </div>

          <div className="form-grid">
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
          </div>

          <div className="form-section" style={{ marginBottom: '1.5rem' }}>
            <label className="preview-label">Issue Description</label>
            <textarea 
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue in detail..."
                style={{ minHeight: '80px' }}
            />
          </div>

          <section className="form-section" style={{ marginBottom: '1.5rem' }}>
            <label className="preview-label">Upload Evidence ({formData.attachments.length}/{MAX_ATTACHMENTS})</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label className="upload-zone" style={{ flex: 1, padding: '1rem' }}>
                  <Upload size={20} />
                  <span>Attach Photos</span>
                  <input type="file" multiple accept="image/*" hidden onChange={handleFileChange} />
              </label>
              <div className="attachment-preview-strip" style={{ margin: 0 }}>
                  {formData.attachments.map((a, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                          <img src={a.dataUrl} alt="preview" className="attachment-thumbnail" />
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, attachments: prev.attachments.filter((_, idx) => idx !== i) }))}
                            style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={12} />
                          </button>
                      </div>
                  ))}
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'REPORTING INCIDENT...' : 'SUBMIT MAINTENANCE REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
