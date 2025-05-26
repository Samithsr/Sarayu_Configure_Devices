import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlug } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import './RightSideTable.css';
import { toast } from 'react-toastify';
import EditModal from '../Authentication/EditModal';
import DeleteModal from '../Authentication/DeleteModel';
import AddBrokerModal from '../Pages/AddBrokerModal';
import UserConfirmation from '../Pages/Users/UserConfirmation';
import UsersAssign from './Users/UserAssign';

const RightSideTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
  const [brokerIdToDelete, setBrokerIdToDelete] = useState(null);
  const [brokerIdToAssign, setBrokerIdToAssign] = useState(null);
  const [users, setUsers] = useState([]);
  const [tableData, setTableData] = useState([]); // Initialize as empty array
  const rowsPerPage = 10;
  const location = useLocation();
  const navigate = useNavigate();

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

    // Always fetch users and table data on mount
    const initializeData = async () => {
      // Fetch users first and ensure it's complete
      const fetchedUsers = await fetchUsers();
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        // Only fetch table data after users are populated
        await fetchTableData(fetchedUsers);
      } else {
        console.error('[initializeData] No users fetched, skipping table data fetch');
        toast.error('Failed to fetch users, cannot load table data.');
      }
    };
    initializeData();
  }, [navigate]); // Removed tableData dependency to avoid re-fetching on state change

  const fetchUsers = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return null;
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
      console.log('[fetchUsers] Fetched users:', data);
      return data;
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error(err.message || 'An error occurred while fetching users.');
      return null;
    }
  };

  const fetchUserEmailById = async (userId) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('[fetchUserEmailById] No auth token');
      return null;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/auth/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        console.error('[fetchUserEmailById] Failed to fetch users:', response.status);
        return null;
      }

      const usersData = await response.json();
      const user = usersData.find((u) => u._id === userId);
      return user ? user.email : null;
    } catch (err) {
      console.error('[fetchUserEmailById] Error:', err);
      return null;
    }
  };

  const fetchTableData = async (usersList) => {
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
      console.log('[fetchTableData] Fetched brokers:', data);

      const mappedData = await Promise.all(
        data.map(async (item) => {
          let assignedUserId = null;
          let assignedUserEmail = null;

          if (item.assignedUserId) {
            if (typeof item.assignedUserId === 'object' && item.assignedUserId.email) {
              assignedUserId = item.assignedUserId._id || null;
              assignedUserEmail = item.assignedUserId.email || null;
              console.log(`[fetchTableData] Broker ${item._id}: assignedUserId is populated object, email=${assignedUserEmail}`);
            } else {
              assignedUserId = item.assignedUserId;
              const user = usersList.find((u) => u._id === assignedUserId);
              if (user) {
                assignedUserEmail = user.email;
                console.log(`[fetchTableData] Broker ${item._id}: assignedUserId is string (${assignedUserId}), email=${assignedUserEmail} (from usersList)`);
              } else {
                // Fallback: Fetch the email directly if not found in usersList
                assignedUserEmail = await fetchUserEmailById(assignedUserId);
                console.log(`[fetchTableData] Broker ${item._id}: assignedUserId is string (${assignedUserId}), email=${assignedUserEmail} (from fetchUserEmailById)`);
              }
            }
          } else {
            console.log(`[fetchTableData] Broker ${item._id}: No assigned user`);
          }

          const mappedItem = {
            brokerId: item._id,
            brokerip: item.brokerIp || 'N/A',
            port: item.portNumber ? item.portNumber.toString() : 'N/A',
            user: item.username || 'N/A',
            password: item.password ? '*'.repeat(item.password.length) : 'N/A',
            rawPassword: item.password || '',
            label: item.label || 'N/A',
            connectionStatus: item.connectionStatus || 'disconnected',
            assignedUserId,
            assignedUserEmail,
          };

          console.log(`[fetchTableData] Broker ${item._id}: Mapped item - username=${mappedItem.user}, password=${mappedItem.password}, label=${mappedItem.label}, status=${mappedItem.connectionStatus}`);
          return mappedItem;
        })
      );

      console.log('[fetchTableData] Mapped table data:', mappedData);
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
      console.log('[handleAssignUser] Assigned broker response:', broker);
      const updatedTableData = tableData.map((item) =>
        item.brokerId === brokerId
          ? {
              ...item,
              assignedUserId: userId,
              assignedUserEmail: broker.assignedUserEmail || users.find((user) => user._id === userId)?.email || null,
            }
          : item
      );
      console.log('[handleAssignUser] Updated table data:', updatedTableData);
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

      const { connectionStatus } = await response.json();
      const updatedTableData = tableData.map((item) =>
        item.brokerId === row.brokerId
          ? { ...item, connectionStatus: connectionStatus || 'disconnected' }
          : item
      );
      setTableData(updatedTableData);

      if (connectionStatus === 'connected') {
        toast.success(`Broker ${row.label || row.brokerId} connected successfully!`);
      } else {
        toast.error(`Broker ${row.label || row.brokerId} failed to connect.`);
      }
    } catch (err) {
      console.error('Connection error:', err);
      toast.error(err.message || 'An error occurred while connecting to the broker.');
      const updatedTableData = tableData.map((item) =>
        item.brokerId === row.brokerId
          ? { ...item, connectionStatus: 'disconnected' }
          : item
      );
      setTableData(updatedTableData);
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
      await fetchTableData(users);
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

      const updatedBroker = await response.json();
      console.log('[handleEditConfirm] Updated broker response:', updatedBroker);

      // Check if the password has changed
      const isPasswordChanged = updatedData.password !== brokerToEdit.rawPassword;
      console.log(`[handleEditConfirm] Password changed: ${isPasswordChanged}, Original: ${brokerToEdit.rawPassword}, New: ${updatedData.password}`);

      // Update the tableData immediately to reflect the changes
      const updatedTableData = tableData.map((item) =>
        item.brokerId === brokerToEdit.brokerId
          ? {
              ...item,
              brokerip: updatedBroker.brokerIp || 'N/A',
              port: updatedBroker.portNumber ? updatedBroker.portNumber.toString() : 'N/A',
              user: updatedBroker.username || 'N/A',
              password: updatedBroker.password ? '*'.repeat(updatedBroker.password.length) : 'N/A',
              rawPassword: updatedBroker.password || '',
              label: updatedBroker.label || 'N/A',
              connectionStatus: updatedBroker.connectionStatus || 'disconnected',
            }
          : item
      );
      console.log('[handleEditConfirm] Updated table data:', updatedTableData);
      setTableData(updatedTableData);

      // Show a specific toast message if the password was changed
      if (isPasswordChanged) {
        toast.success(`Broker ${brokerToEdit.brokerId} password changed successfully!`);
      } else {
        toast.success(`Broker ${brokerToEdit.brokerId} updated successfully!`);
      }

      setShowEditModal(false);
      setBrokerToEdit(null);

      // Refresh the table data to ensure consistency with the backend
      await fetchTableData(users);
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

  const handleAddConfirm = async (newBrokerData) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      setShowAddModal(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/brokers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: newBrokerData.brokerIp,
          portNumber: parseInt(newBrokerData.portNumber, 10),
          username: newBrokerData.username || '',
          password: newBrokerData.password || '',
          label: newBrokerData.label,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.json().then((data) => data.message || `Failed to add broker (Status: ${response.status})`);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }

      const newBroker = await response.json();
      const mappedBroker = {
        brokerId: newBroker._id,
        brokerip: newBroker.brokerIp || 'N/A',
        port: newBroker.portNumber ? newBroker.portNumber.toString() : 'N/A',
        user: newBroker.username || 'N/A',
        password: newBroker.password ? '*'.repeat(newBroker.password.length) : 'N/A',
        rawPassword: newBroker.password || '',
        label: newBroker.label || 'N/A',
        connectionStatus: newBroker.connectionStatus || 'disconnected',
        assignedUserId: newBroker.assignedUserId?._id || newBroker.assignedUserId || null,
        assignedUserEmail: newBroker.assignedUserId?.email || null,
      };

      setTableData([...tableData, mappedBroker]);
      toast.success(`Broker ${newBroker.label || newBroker._id} added successfully!`);
      setShowAddModal(false);
    } catch (err) {
      console.error('Add broker error:', err);
      toast.error(err.message || 'An error occurred while adding the broker.');
      setShowAddModal(false);
    }
  };

  const handleAddCancel = () => {
    setShowAddModal(false);
  };

  const handleAssignClick = (brokerId, assignedUserId) => {
    setBrokerIdToAssign(brokerId);
    setShowAssignModal(true);
  };

  const handleAssignConfirm = async (userId) => {
    if (userId) {
      await handleAssignUser(brokerIdToAssign, userId);
    }
    setShowAssignModal(false);
    setBrokerIdToAssign(null);
  };

  const handleAssignCancel = () => {
    setShowAssignModal(false);
    setBrokerIdToAssign(null);
  };

  return (
    <div className="unique-table-container">
      <div className="header-buttons">
        <button className="back-button" onClick={handleAddClick}>
          Add+
        </button>
      </div>
      <div className="unique-table-scrollable">
        <table className="unique-table">
          <thead>
            <tr>
              <th>Broker IP</th>
              <th>Port</th>
              <th>User</th>
              <th>Password</th>
              <th>Company Name</th>
              <th>Status</th>
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
                  <div className="status-container">
                    <div className="status-wrapper">
                      <div
                        className={`status-icon-button ${row.connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}
                        onClick={() => handleConnect(row)}
                        title="Reconnect"
                      >
                        <FaPlug />
                      </div>
                      <span className={`status-text ${row.connectionStatus === 'connected' ? 'connected' : 'disconnected'}`}>
                        {row.connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
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
                  <UsersAssign
                    brokerId={row.brokerId}
                    assignedUserId={row.assignedUserId}
                    assignedUserEmail={row.assignedUserEmail}
                    handleAssignClick={handleAssignClick}
                  />
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

      <AddBrokerModal
        isOpen={showAddModal}
        onConfirm={handleAddConfirm}
        onCancel={handleAddCancel}
      />

      <UserConfirmation
        isOpen={showAssignModal}
        onConfirm={handleAssignConfirm}
        onCancel={handleAssignCancel}
        users={users}
        selectedUserId={brokerIdToAssign ? tableData.find((row) => row.brokerId === brokerIdToAssign)?.assignedUserId : ''}
      />
    </div>
  );
};

export default RightSideTable;
                  