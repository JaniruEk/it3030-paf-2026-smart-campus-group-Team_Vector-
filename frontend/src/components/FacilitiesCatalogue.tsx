import React, { useEffect, useState } from 'react';
import { createResource, deleteResource, getResources, updateResource } from '../api/resourceApi';
import type { Resource } from '../api/resourceApi';
import { Search, Plus, Filter, MapPin, Users, Clock, Trash2, Edit3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import './FacilitiesCatalogue.css';

const resourceTypes = ['All', 'Lecture Hall', 'Lab', 'Meeting Room', 'Equipment'];
const locations = ['All', 'Block A', 'Block B', 'Admin Block', 'AV Store'];
const statusOptions = ['ACTIVE', 'OUT_OF_SERVICE'];

const initialForm: Omit<Resource, 'id'> = {
  name: '',
  type: 'Lecture Hall',
  capacity: 0,
  location: 'Block A',
  availability: '08:00 - 18:00',
  status: 'ACTIVE',
};

const FacilitiesCatalogue: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [minCapacity, setMinCapacity] = useState('');
  const [formData, setFormData] = useState<Omit<Resource, 'id'>>(initialForm);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await getResources({
        search: searchTerm,
        type: typeFilter !== 'All' ? typeFilter : '',
        location: locationFilter !== 'All' ? locationFilter : '',
        minCapacity: minCapacity !== '' ? Number(minCapacity) : undefined,
      });
      setResources(data);
    } catch (error: any) {
      toast.error(error.message || 'Unable to load resources', { position: 'bottom-right' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [searchTerm, typeFilter, locationFilter, minCapacity]);


  const statusClass = (status: string) =>
    status === 'ACTIVE' ? 'resource-status active' : 'resource-status out-of-service';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await createResource({
        ...formData,
        capacity: Number(formData.capacity),
      });
      setFormData(initialForm);
      setIsFormOpen(false);
      loadResources();
      toast.success('Resource created successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Could not create resource');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteResource(resourceId);
      loadResources();
      toast.success('Resource deleted successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleStatusToggle = async (resource: Resource) => {
    const updated: Resource = {
      ...resource,
      status: resource.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE',
    };
    try {
      await updateResource(resource.id!, updated);
      loadResources();
      toast.success(`Status updated for ${resource.name}.`, { position: 'bottom-right' });
    } catch (error: any) {
      toast.error(error.message || 'Unable to update status');
    }
  };

  return (
    <section className="facilities-catalogue">
      <div className="catalogue-header">
        <div>
          <h2>Facilities & Assets Catalogue</h2>
          <p className="catalogue-description">
            Manage bookable campus resources, verify availability, and monitor operational status.
          </p>
        </div>
        <button className="add-resource-btn" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Close Form' : <><Plus size={18} /> Add New Resource</>}
        </button>
      </div>

      <div className="catalogue-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            placeholder="Min Cap"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
          />
        </div>
      </div>

      <div className="catalogue-summary">
        Displaying <strong>{resources.length}</strong> resources
      </div>

      <div className="catalogue-grid">
        {loading && resources.length === 0 ? (
          <div className="loading-container">
            <Loader2 className="spinner" size={40} />
            <p>Fetching assets...</p>
          </div>
        ) : (
          resources.map((resource) => (
            <article key={resource.id} className="resource-card glass">
              <div className="resource-card-header">
                <div>
                  <span className="type-tag">{resource.type}</span>
                  <h3>{resource.name}</h3>
                </div>
                <div className={statusClass(resource.status)}>
                  {resource.status === 'ACTIVE' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {resource.status.replace('_', ' ')}
                </div>
              </div>
              
              <div className="resource-details">
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>{resource.location}</span>
                </div>
                <div className="detail-item">
                  <Users size={16} />
                  <span>Capacity: {resource.capacity || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>{resource.availability}</span>
                </div>
              </div>

              <div className="resource-actions">
                <button 
                  className="action-btn toggle" 
                  onClick={() => handleStatusToggle(resource)}
                  title="Toggle Operational Status"
                >
                  <Edit3 size={16} /> Toggle Status
                </button>
                <button 
                  className="action-btn delete" 
                  onClick={() => handleDelete(resource.id!)}
                  title="Remove Resource"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {isFormOpen && (
        <div className="form-overlay active">
          <section className="resource-form-section glass">
            <div className="form-header">
              <h3>Add New Campus Resource</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>
            <form className="resource-form" onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-field">
                  <label>Resource Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Main Hall"
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {resourceTypes.slice(1).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Capacity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Location</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  >
                    {locations.slice(1).map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Availability Hours</label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                    placeholder="e.g. 08:00 - 18:00"
                    required
                  />
                </div>

                <div className="form-field full-width">
                  <label>Initial Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-footer">
                <button type="submit" className="submit-btn">Register New Resource</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
};

export default FacilitiesCatalogue;
