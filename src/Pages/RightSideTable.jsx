import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './RightSideTable.css';
import { toast } from 'react-toastify';
import EditModal from '../Authentication/EditModal';
import DeleteModal from '../Authentication/DeleteModel';
import '../Pages/AddModal.css'; // Import new AddModal.css

const RightSideTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
  const [brokerIdToDelete, setBrokerIdToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const rowsPerPage = 10;
  const navigate = useNavigate();
  const [tableData, setTableData] = useState([]);

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!authToken || !userId || !userRole) {
      toast.error('Authentication token, user ID, or role is missing. Please log in again.');
      navigate('/');
      return;
    }

    if (userRole !== 'admin') {
      fetchAssignedBroker(userId, authToken).then((broker) => {
        if (broker) {
          navigate('/dashboard', { state: { brokerId: broker.brokerId, userId } });
        } else {
          toast.error('No brokers assigned. Please contact an admin.');
          localStorage.clear();
          navigate('/');
        }
      });
      return;
    }

    fetchUsers();
    fetchTableData();
  }, [navigate]);

  const fetchUsers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error(err.message || 'An error occurred while fetching users.');
    }
  };

  const fetchTableData = async () => {
    const authToken = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    if (!authToken || !userId) {
      toast.error('Authentication token or user ID is missing. Please log in again.');
      navigate('/');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/brokers', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          toast.error('Session expired. Please log in again.');
          navigate('/');
          return;
        }
        const errorMessage = await response.json().then((data) => data.message || `HTTP error! status: ${response.status}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      // Remove duplicates based on brokerId
      const uniqueBrokerIds = new Set();
      const mappedData = data
        .filter((item) => {
          if (uniqueBrokerIds.has(item._id)) {
            return false; // Skip duplicates
          }
          uniqueBrokerIds.add(item._id);
          return true;
        })
        .map((item) => {
          if (item.connectionStatus === "connected") {
            toast.success(`Broker ${item.label || item._id} is connected`, { toastId: item._id });
          } else {
            toast.error(`Broker ${item.label || item._id} is disconnected`, { toastId: item._id });
          }

          return {
            brokerId: item._id,
            brokerip: item.brokerIp || 'N/A',
            port: item.portNumber ? item.portNumber.toString() : 'N/A',
            user: item.username || 'N/A',
            password: item.password ? '*'.repeat(item.password.length) : 'N/A',
            rawPassword: item.password || '',
            label: item.label || 'N/A',
            connectionStatus: item.connectionStatus || 'disconnected',
            assignedUserId: item.assignedUserId?._id || item.assignedUserId || null,
            assignedUserEmail: item.assignedUserId?.email || null,
          };
        });

      setTableData(mappedData);
    } catch (err) {
      console.error('Error fetching table data:', err);
      toast.error(err.message || 'An error occurred while fetching table data.');
    }
  };

  const fetchAssignedBroker = async (userId, token) => {
    try {
      const response = await fetch("http://localhost:5000/api/brokers/assigned", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || "Failed to check assigned broker");
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return {
        brokerId: data.brokerId,
        connectionStatus: data.connectionStatus,
      };
    } catch (err) {
      console.error("Error checking assigned broker:", err);
      return null;
    }
  };

  const handleAssignUser = async (brokerId, userId) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    if (!userId) {
      toast.error('Please select a user to assign.');
      return;
    }

    try {
      const assignResponse = await fetch(`http://localhost:5000/api/brokers/${brokerId}/assign-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!assignResponse.ok) {
        const errorData = await assignResponse.json();
        throw new Error(errorData.message || 'Failed to assign user to broker.');
      }

      const { broker } = await assignResponse.json();
      const updatedTableData = tableData.map((item) =>
        item.brokerId === brokerId
          ? {
              ...item,
              assignedUserId: userId,
              assignedUserEmail: broker.assignedUserEmail || users.find((user) => user._id === userId)?.email || null,
            }
          : item
      );
      setTableData(updatedTableData);

      toast.success(`Broker ${broker.label || brokerId} assigned to user ${broker.assignedUserEmail || userId} successfully!`);
    } catch (err) {
      console.error('Error assigning user to broker:', err);
      toast.error(err.message || 'An error occurred while assigning the user to the broker.');
    }
  };

  const handleConnect = async (row) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    toast.info('Connecting to broker...');

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${row.brokerId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || 'Failed to connect to broker.');
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${row.label || row.brokerId} connected successfully!`);
      await fetchTableData();
    } catch (err) {
      console.error('Connection error:', err);
      toast.error(err.message || 'An error occurred while connecting to the broker.');
    }
  };

  const handleAddBroker = async (formData) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add broker.');
      }

      toast.success('Broker added successfully!');
      setShowAddModal(false);
      await fetchTableData();
    } catch (err) {
      console.error('Error adding broker:', err);
      toast.error(err.message || 'An error occurred while adding the broker.');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDeleteClick = (brokerId) => {
    setBrokerIdToDelete(brokerId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerIdToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || `Failed to delete broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerIdToDelete} deleted successfully!`);
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
      await fetchTableData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'An error occurred while deleting the broker.');
      setShowDeleteModal(false);
      setBrokerIdToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setBrokerIdToDelete(null);
  };

  const handleEditClick = (row) => {
    setBrokerToEdit(row);
    setShowEditModal(true);
  };

  const handleEditConfirm = async (updatedData) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      setShowEditModal(false);
      setBrokerToEdit(null);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/brokers/${brokerToEdit.brokerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: updatedData.brokerIp,
          portNumber: parseInt(updatedData.portNumber, 10),
          username: updatedData.username || '',
          password: updatedData.password || '',
          label: updatedData.label,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || `Failed to update broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(`Broker ${brokerToEdit.brokerId} updated successfully!`);
      setShowEditModal(false);
      setBrokerToEdit(null);
      await fetchTableData();
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'An error occurred while updating the broker.');
      setShowEditModal(false);
      setBrokerToEdit(null);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
    setBrokerToEdit(null);
  };

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleAddCancel = () => {
    setShowAddModal(false);
  };

  return (
    <div className="table-container">
      <div className="button-group">
        <button className="back-button add-button" onClick={handleAddClick}>
          Add
        </button>
      </div>
      <div className={`table-scrollable ${showAddModal ? 'blurred' : ''}`}>
        <table className="table">
          <thead>
            <tr>
              <th>Broker IP</th>
              <th>Port</th>
              <th>User</th>
              <th>Password</th>
              <th>Company Name</th>
              <th>Actions</th>
              <th>Edit/Delete</th>
              <th>Users</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((row, index) => (
              <tr key={index}>
                <td>{row.brokerip}</td>
                <td>{row.port}</td>
                <td>{row.user}</td>
                <td>{row.password}</td>
                <td>{row.label}</td>
                <td>
                  <button
                    className={`assign-button ${row.connectionStatus === 'connected' ? 'connected' : ''}`}
                    onClick={() => handleConnect(row)}
                    title="Connect"
                    disabled={row.connectionStatus === 'connected'}
                  >
                    {row.connectionStatus === 'connected' ? 'Connected' : 'Connect'}
                  </button>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="edit-button"
                      onClick={() => handleEditClick(row)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteClick(row.brokerId)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
                <td>
                  <select
                    className="user-list"
                    value={row.assignedUserId || ''}
                    onChange={(e) => handleAssignUser(row.brokerId, e.target.value)}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.email}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            >
              {page}
            </button>
          ))}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      <EditModal
        isOpen={showEditModal}
        onConfirm={handleEditConfirm}
        onCancel={handleEditCancel}
        broker={brokerToEdit}
      />

      {showAddModal && (
        <AddModal
          onConfirm={handleAddBroker}
          onCancel={handleAddCancel}
        />
      )}
    </div>
  );
};

// Add Modal Component
const AddModal = ({ onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    brokerIp: '',
    portNumber: '',
    username: '',
    password: '',
    label: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.brokerIp || !formData.portNumber || !formData.label) {
      toast.error('Broker IP, Port Number, and Company Name are required.');
      return;
    }
    onConfirm(formData);
    setFormData({
      brokerIp: '',
      portNumber: '',
      username: '',
      password: '',
      label: '',
    });
  };

  return (
    <div className="add-modal-overlay">
      <div className="add-modal-content">
        <h2>Add Broker</h2>
        <form onSubmit={handleSubmit}>
          <div className="add-modal-form-group">
            <label htmlFor="brokerIp">Broker IP:</label>
            <input
              type="text"
              id="brokerIp"
              name="brokerIp"
              value={formData.brokerIp}
              onChange={handleChange}
              required
              placeholder="e.g., 192.168.1.1"
              autoFocus
              key="brokerIp"
            />
          </div>
          <div className="add-modal-form-group">
            <label htmlFor="portNumber">Port Number:</label>
            <input
              type="number"
              id="portNumber"
              name="portNumber"
              value={formData.portNumber}
              onChange={handleChange}
              required
              placeholder="e.g., 1883"
              key="portNumber"
            />
          </div>
          <div className="add-modal-form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Optional"
              key="username"
            />
          </div>
          <div className="add-modal-form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Optional"
              key="password"
            />
          </div>
          <div className="add-modal-form-group">
            <label htmlFor="label">Company Name:</label>
            <input
              type="text"
              id="label"
              name="label"
              value={formData.label}
              onChange={handleChange}
              required
              placeholder="e.g., My Broker"
              key="label"
            />
          </div>
          <div className="add-modal-buttons">
            <button type="submit" className="add-modal-button add-modal-confirm-button">
              Add Broker
            </button>
            <button
              type="button"
              className="add-modal-button add-modal-cancel-button"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RightSideTable;