import { useEffect, useState } from 'react';
import { api } from './services/api';
import './DriverManagement.css';

export function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    Name: '',
    License_Number: '',
    License_Category: '',
    License_Expiry_Date: '',
    Contact_Number: '',
    Safety_Score: 100,
    Status: 'Available'
  });

  // Load all drivers
  async function fetchDrivers() {
    try {
      setLoading(true);
      const response = await api.get('/drivers');
      setDrivers(response.data.payload || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch drivers. Make sure your backend server is running on http://localhost:5001!');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  // Handle Add Driver
  async function handleAddSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/drivers', formData);
      setSuccess(response.data.message || 'Driver profile created!');
      setIsAddModalOpen(false);
      // Reset form
      setFormData({
        Name: '',
        License_Number: '',
        License_Category: '',
        License_Expiry_Date: '',
        Contact_Number: '',
        Safety_Score: 100,
        Status: 'Available'
      });
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add driver');
    }
  }

  // Handle Edit Trigger
  function openEditModal(driver) {
    setEditingDriver(driver);
    setFormData({
      Name: driver.Name || '',
      License_Number: driver.License_Number || '',
      License_Category: driver.License_Category || '',
      License_Expiry_Date: driver.License_Expiry_Date || '',
      Contact_Number: driver.Contact_Number || '',
      Safety_Score: driver.Safety_Score ?? 100,
      Status: driver.Status || 'Available'
    });
    setIsEditModalOpen(true);
  }

  // Handle Edit Submit
  async function handleEditSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/drivers/${editingDriver.Id}`, formData);
      setSuccess(response.data.message || 'Driver profile updated!');
      setIsEditModalOpen(false);
      setEditingDriver(null);
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update driver');
    }
  }

  // Handle Delete Driver
  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this driver profile?')) return;

    setError('');
    setSuccess('');

    try {
      const response = await api.delete(`/drivers/${id}`);
      setSuccess(response.data.message || 'Driver deleted successfully!');
      fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete driver');
    }
  }

  function getScoreClass(score) {
    if (score >= 90) return 'score-high';
    if (score >= 70) return 'score-medium';
    return 'score-low';
  }

  function getStatusClass(status) {
    switch (status) {
      case 'Available': return 'status-available';
      case 'On Trip': return 'status-on-trip';
      case 'Off Duty': return 'status-off-duty';
      case 'Suspended': return 'status-suspended';
      default: return '';
    }
  }

  return (
    <div className="driver-container">
      <div className="driver-header">
        <h3>Driver Profiles Management</h3>
        <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>+ Add Driver</button>
      </div>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      {loading ? (
        <p>Loading driver list...</p>
      ) : drivers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#718096', padding: '20px 0' }}>No driver profiles created yet. Click "+ Add Driver" to create one.</p>
      ) : (
        <div className="table-responsive">
          <table className="drivers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>License Info</th>
                <th>Safety Score</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.Id}>
                  <td>
                    <strong>{driver.Name}</strong>
                  </td>
                  <td>{driver.Contact_Number}</td>
                  <td>
                    <div><strong>No:</strong> {driver.License_Number}</div>
                    <div style={{ fontSize: '12px', color: '#718096' }}>
                      <strong>Cat:</strong> {driver.License_Category} | <strong>Expires:</strong> {driver.License_Expiry_Date}
                    </div>
                  </td>
                  <td>
                    <span className={`score-badge ${getScoreClass(driver.Safety_Score)}`}>
                      {driver.Safety_Score}%
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(driver.Status)}`}>
                      {driver.Status}
                    </span>
                  </td>
                  <td>
                    <button className="edit-btn" onClick={() => openEditModal(driver)}>Edit</button>
                    <button className="delete-btn" onClick={() => handleDelete(driver.Id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Driver Profile</h3>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="License_Number"
                  value={formData.License_Number}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Category</label>
                <input
                  type="text"
                  name="License_Category"
                  value={formData.License_Category}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="e.g. Heavy Motor Vehicle"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Expiry Date</label>
                <input
                  type="date"
                  name="License_Expiry_Date"
                  value={formData.License_Expiry_Date}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="Contact_Number"
                  value={formData.Contact_Number}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Safety Score (0 - 100)</label>
                <input
                  type="number"
                  name="Safety_Score"
                  min="0"
                  max="100"
                  value={formData.Safety_Score}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Driver Profile</h3>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="Name"
                  value={formData.Name}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Number</label>
                <input
                  type="text"
                  name="License_Number"
                  value={formData.License_Number}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Category</label>
                <input
                  type="text"
                  name="License_Category"
                  value={formData.License_Category}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>License Expiry Date</label>
                <input
                  type="date"
                  name="License_Expiry_Date"
                  value={formData.License_Expiry_Date}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  name="Contact_Number"
                  value={formData.Contact_Number}
                  onChange={handleInputChange}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label>Safety Score (0 - 100)</label>
                <input
                  type="number"
                  name="Safety_Score"
                  min="0"
                  max="100"
                  value={formData.Safety_Score}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="Status"
                  value={formData.Status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn">Update Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
