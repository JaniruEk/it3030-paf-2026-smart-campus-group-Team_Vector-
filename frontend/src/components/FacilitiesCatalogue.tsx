import React, { useEffect, useMemo, useState } from 'react';
import { createResource, deleteResource, getResources, updateResource } from '../api/resourceApi';
import type { Resource } from '../api/resourceApi';
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
  const [message, setMessage] = useState<string | null>(null);

  const loadResources = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getResources({
        search: searchTerm,
        type: typeFilter !== 'All' ? typeFilter : '',
        location: locationFilter !== 'All' ? locationFilter : '',
        minCapacity: minCapacity !== '' ? Number(minCapacity) : undefined,
      });
      setResources(data);
    } catch (error: any) {
      setMessage(error.message || 'Unable to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [searchTerm, typeFilter, locationFilter, minCapacity]);

  const filteredResources = useMemo(() => resources, [resources]);

  const statusClass = (status: string) =>
    status === 'ACTIVE' ? 'resource-status active' : 'resource-status out-of-service';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    try {
      await createResource({
        ...formData,
        capacity: Number(formData.capacity),
      });
      setFormData(initialForm);
      loadResources();
      setMessage('Resource created successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Could not create resource');
    }
  };

  const handleDelete = async (resourceId: string) => {
    if (!window.confirm('Delete this resource?')) {
      return;
    }
    try {
      await deleteResource(resourceId);
      loadResources();
      setMessage('Resource deleted successfully.');
    } catch (error: any) {
      setMessage(error.message || 'Delete failed');
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
      setMessage(`Status updated for ${resource.name}.`);
    } catch (error: any) {
      setMessage(error.message || 'Unable to update status');
    }
  };

  return (
    <section className="facilities-catalogue">
      <h2>Facilities & Assets Catalogue</h2>
      <p className="catalogue-description">
        Manage bookable resources such as lecture halls, labs, meeting rooms, and equipment.
        Search and filter by type, capacity, and location.
      </p>

      <div className="catalogue-filters">
        <input
          type="text"
          placeholder="Search by name, type or location"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

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
          placeholder="Min capacity"
          value={minCapacity}
          onChange={(e) => setMinCapacity(e.target.value)}
        />
      </div>

      <div className="catalogue-summary">
        <strong>{filteredResources.length}</strong> resource(s) found
      </div>

      {message && <div className="catalogue-message">{message}</div>}

      <div className="catalogue-grid">
        {loading ? (
          <div className="loading">Loading resources...</div>
        ) : (
          filteredResources.map((resource) => (
            <article key={resource.id} className="resource-card">
              <header>
                <h3>{resource.name}</h3>
                <span className={statusClass(resource.status)}>{resource.status}</span>
              </header>
              <dl>
                <dt>Type</dt>
                <dd>{resource.type}</dd>

                <dt>Capacity</dt>
                <dd>{resource.capacity || 'N/A'}</dd>

                <dt>Location</dt>
                <dd>{resource.location}</dd>

                <dt>Availability</dt>
                <dd>{resource.availability}</dd>
              </dl>
              <div className="resource-actions">
                <button type="button" onClick={() => handleStatusToggle(resource)}>
                  Toggle Status
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(resource.id!)}>
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      <section className="resource-form-section">
        <h3>Add New Resource</h3>
        <form className="resource-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </label>

          <label>
            Type
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
          </label>

          <label>
            Capacity
            <input
              type="number"
              min="0"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
            />
          </label>

          <label>
            Location
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
          </label>

          <label>
            Availability
            <input
              type="text"
              value={formData.availability}
              onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
              required
            />
          </label>

          <label>
            Status
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
          </label>

          <button type="submit">Create Resource</button>
        </form>
      </section>
    </section>
  );
};

export default FacilitiesCatalogue;
