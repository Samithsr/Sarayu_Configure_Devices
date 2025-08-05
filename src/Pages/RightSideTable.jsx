import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlug } from 'react-icons/fa';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import './RightSideTable.css';
import { toast } from 'react-toastify';
import EditModal from '../Authentication/EditModal';
import DeleteModal from '../Authentication/DeleteModel';
import AddBrokerModal from '../Pages/AddBrokerModal';
import AdminUserAssign from '../Components/Users/AdminUserAssign';
import LogoutModal from '../Pages/LogoutModel';

const RightSideTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [brokerToEdit, setBrokerToEdit] = useState(null);
  const [brokerIdToDelete, setBrokerIdToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [activeBrokerId, setActiveBrokerId] = useState(null);
  const rowsPerPage = 10;
  const location = useLocation();
  const navigate = useNavigate();

  const totalPages = Math.ceil(tableData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentData = tableData.slice(startIndex, endIndex);

  const getActiveClass = (path) => {
    return location.pathname === `/table${path}` || (path === '' && location.pathname === '/table')
      ? 'dashboard-button active'
      : 'dashboard-button';
  };

  const handleConfirmationStateChange = (brokerId, isConfirming) => {
    setActiveBrokerId(isConfirming ? brokerId : null);
  };

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

    const initializeData = async () => {
      const fetchedUsers = await fetchUsers();
      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
        await fetchTableData(fetchedUsers);
      } else {
        console.error('[initializeData] No users fetched, skipping table data fetch');
        toast.error('Failed to fetch users, cannot load table data.');
      }
    };
    initializeData();
  }, [navigate]);

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

  const checkBrokerStatus = async (brokerIp) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('[checkBrokerStatus] Authentication token is missing');
      return false;
    }

    try {
      const response = await fetch('http://localhost:5000/api/check-broker-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ brokerIp }),
      });

      if (!response.ok) {
        console.error(`[checkBrokerStatus] HTTP error! status: ${response.status}`);
        return false;
      }

      const data = await response.json();
      console.log(`[checkBrokerStatus] Status for ${brokerIp}:`, data);
      return data.connected;
    } catch (err) {
      console.error(`[checkBrokerStatus] Error checking broker status for ${brokerIp}:`, err);
      return false;
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
          } else {
            assignedUserId = item.assignedUserId;
            const user = usersList.find((u) => u._id === assignedUserId);
            if (user) {
              assignedUserEmail = user.email;
            } else {
              assignedUserEmail = await fetchUserEmailById(assignedUserId);
            }
          }
        }

        // Use database connectionStatus instead of revalidating
        const connectionStatus = item.connectionStatus || 'disconnected';
        const connectionErrors = item.lastValidationError ? [item.lastValidationError] : [];

        return {
          brokerId: item._id,
          brokerip: item.brokerIp || 'N/A',
          port: item.portNumber ? item.portNumber.toString() : 'N/A',
          user: item.username || 'N/A',
          password: item.password || 'N/A',
          rawPassword: item.password || '',
          label: item.label || 'N/A',
          topic: item.topic || 'N/A',
          connectionStatus,
          connectionErrors,
          assignedUserId,
          assignedUserEmail,
        };
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

  console.log(`[handleAssignUser] Assigning userId=${userId} to brokerId=${brokerId}`);

  try {
    const assignResponse = await fetch(`http://localhost:5000/api/brokers/${brokerId}/assign-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ userId: userId || null }), // Explicitly send null for unassignment
    });

    if (!assignResponse.ok) {
      const errorData = await assignResponse.json();
      console.error(`[handleAssignUser] API error: ${errorData.message || 'Unknown error'}`);
      throw new Error(errorData.message || 'Failed to assign user to broker.');
    }

    const { broker } = await assignResponse.json();
    console.log(`[handleAssignUser] API response:`, broker);

    // Update tableData to reflect the new assignment
    const updatedTableData = tableData.map((item) =>
      item.brokerId === brokerId
        ? {
            ...item,
            assignedUserId: broker.assignedUserId || null,
            assignedUserEmail:
              broker.assignedUserId
                ? users.find((user) => user._id === broker.assignedUserId)?.email || broker.assignedUserEmail || 'Unknown'
                : null,
          }
        : item
    );

    setTableData(updatedTableData);

    if (userId) {
      const assignedUser = users.find((user) => user._id === userId);
      toast.success(
        `Broker ${broker.label || brokerId} assigned to user ${assignedUser?.email || userId} successfully!`
      );
    } else {
      toast.success(`Broker ${broker.label || brokerId} unassigned successfully!`);
    }
  } catch (err) {
    console.error(`[handleAssignUser] Error assigning user to broker ${brokerId}:`, err);
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

    toast.info(`Validating broker ${row.label || row.brokerId}...`);

    try {
      const testResponse = await fetch('http://localhost:5000/api/test-broker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          brokerIp: row.brokerip,
          portNumber: parseInt(row.port, 10),
          username: row.user === 'N/A' ? '' : row.user,
          password: row.rawPassword || '',
        }),
      });

      if (!testResponse.ok) {
        const errorData = await testResponse.json();
        const validationErrors = errorData.validationErrors || [];
        let displayError = 'Broker is not available';

        if (validationErrors.includes('Incorrect username') || validationErrors.includes('Incorrect password')) {
          displayError = 'Not authorized';
        } else if (validationErrors.includes('Check the broker IP and port.')) {
          displayError = 'Connection timeout';
        } else if (validationErrors.length > 0) {
          displayError = validationErrors.join(', ');
        }

        toast.error(`Validation failed: ${displayError}`);

        const updatedTableData = tableData.map((item) =>
          item.brokerId === row.brokerId
            ? { ...item, connectionStatus: 'disconnected', connectionErrors: [displayError] }
            : item
        );
        setTableData(updatedTableData);
        return;
      }

      toast.success(`Broker ${row.label || row.brokerId} is available. Connecting...`);

      const connectResponse = await fetch(`http://localhost:5000/api/brokers/${row.brokerId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        const validationErrors = errorData.validationErrors || [];
        let displayError = 'Failed to connect to broker';

        if (validationErrors.includes('Incorrect username') || validationErrors.includes('Incorrect password')) {
          displayError = 'Not authorized';
        } else if (validationErrors.includes('Check the broker IP and port.')) {
          displayError = 'Connection timeout';
        } else if (validationErrors.length > 0) {
          displayError = validationErrors.join(', ');
        }

        toast.error(`Connection failed: ${displayError}`);

        const updatedTableData = tableData.map((item) =>
          item.brokerId === row.brokerId
            ? { ...item, connectionStatus: 'disconnected', connectionErrors: [displayError] }
            : item
        );
        setTableData(updatedTableData);
        return;
      }

      const { connectionStatus } = await connectResponse.json();
      const updatedTableData = tableData.map((item) =>
        item.brokerId === row.brokerId
          ? { ...item, connectionStatus: connectionStatus || 'disconnected', connectionErrors: [] }
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
      const displayError = 'An unexpected error occurred';
      toast.error(`Connection failed: ${displayError}`);

      const updatedTableData = tableData.map((item) =>
        item.brokerId === row.brokerId
          ? { ...item, connectionStatus: 'disconnected', connectionErrors: [displayError] }
          : item
      );
      setTableData(updatedTableData);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      toast.error('Authentication token is missing. Please log in again.');
      navigate('/');
      return;
    }

    try {
      const logoutResponse = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!logoutResponse.ok) {
        const errorData = await logoutResponse.json();
        throw new Error(errorData.message || 'Failed to log out.');
      }

      toast.success('Logged out successfully. All broker assignments and connections cleared.');
      localStorage.clear();
      navigate('/');
    } catch (err) {
      console.error('Error during logout:', err);
      toast.error(err.message || 'An error occurred during logout.');
    } finally {
      setShowLogoutModal(false);
      localStorage.clear();
      navigate('/');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
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

  console.log(`[handleEditConfirm] Updating broker ${brokerToEdit.brokerId} with data:`, updatedData);

  try {
    // Check if critical fields have changed
    const hasCriticalChanges =
      updatedData.brokerIp !== brokerToEdit.brokerip ||
      parseInt(updatedData.portNumber, 10) !== parseInt(brokerToEdit.port, 10) ||
      updatedData.username !== brokerToEdit.user ||
      updatedData.password !== brokerToEdit.rawPassword;

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
        topic: updatedData.topic,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || `Failed to update broker (Status: ${response.status})`;
      const validationErrors = errorData.validationErrors || ['Unknown error'];
      console.error(`[handleEditConfirm] API error: ${errorMessage}, errors: ${validationErrors.join(", ")}`);
      toast.error(`${errorMessage}: ${validationErrors.join(", ")}`);

      const updatedTableData = tableData.map((item) =>
        item.brokerId === brokerToEdit.brokerId
          ? {
              ...item,
              connectionStatus: 'disconnected',
              connectionErrors: validationErrors,
            }
          : item
      );
      setTableData(updatedTableData);
      setShowEditModal(false);
      setBrokerToEdit(null);
      return;
    }

    const updatedBroker = await response.json();
    console.log(`[handleEditConfirm] Updated broker response:`, updatedBroker);

    let connectionStatus = updatedBroker.connectionStatus || 'disconnected';
    let connectionErrors = updatedBroker.lastValidationError ? [updatedBroker.lastValidationError] : [];

    // If critical fields changed, ensure connection status is accurate
    if (hasCriticalChanges && connectionStatus === 'connected') {
      const isConnected = await checkBrokerStatus(updatedBroker.brokerIp);
      console.log(`[handleEditConfirm] checkBrokerStatus result: ${isConnected}`);

      if (isConnected) {
        const connectResponse = await fetch(`http://localhost:5000/api/brokers/${brokerToEdit.brokerId}/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        if (connectResponse.ok) {
          const connectData = await connectResponse.json();
          connectionStatus = connectData.connectionStatus || connectionStatus;
          connectionErrors = connectData.validationErrors || [];
          console.log(`[handleEditConfirm] Reconnection attempt result: ${connectionStatus}`);
        } else {
          const connectErrorData = await connectResponse.json();
          connectionStatus = 'disconnected';
          connectionErrors = connectErrorData.validationErrors || ['Connection failed'];
          console.log(`[handleEditConfirm] Reconnection failed: ${connectionErrors.join(", ")}`);
        }
      } else {
        connectionStatus = 'disconnected';
        connectionErrors = updatedBroker.lastValidationError ? [updatedBroker.lastValidationError] : ['Connection failed'];
      }
    }

    const updatedTableData = tableData.map((item) =>
      item.brokerId === brokerToEdit.brokerId
        ? {
            ...item,
            brokerip: updatedBroker.brokerIp || 'N/A',
            port: updatedBroker.portNumber ? updatedBroker.portNumber.toString() : 'N/A',
            user: updatedBroker.username || 'N/A',
            password: updatedBroker.password || 'N/A',
            rawPassword: updatedBroker.password || '',
            label: updatedBroker.label || 'N/A',
            topic: updatedBroker.topic || 'N/A',
            connectionStatus,
            connectionErrors,
          }
        : item
    );

    setTableData(updatedTableData);
    toast.success(`Broker ${brokerToEdit.brokerId} updated successfully!`);
    setShowEditModal(false);
    setBrokerToEdit(null);
  } catch (err) {
    console.error('[handleEditConfirm] Update error:', err);
    const errorMessage = err.message || 'An error occurred while updating the broker.';
    const validationErrors = ['Unexpected error'];
    toast.error(`${errorMessage}: ${validationErrors.join(", ")}`);

    const updatedTableData = tableData.map((item) =>
      item.brokerId === brokerToEdit.brokerId
        ? {
            ...item,
            connectionStatus: 'disconnected',
            connectionErrors: validationErrors,
          }
        : item
    );
    setTableData(updatedTableData);
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
          topic: newBrokerData.topic,
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
        password: newBroker.password || 'N/A',
        rawPassword: newBroker.password || '',
        label: newBroker.label || 'N/A',
        topic: newBroker.topic || 'N/A',
        connectionStatus: newBroker.connectionStatus || 'disconnected',
        connectionErrors: [],
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

  const handleNavigation = (path, brokerId) => {
    const userId = localStorage.getItem('userId');
    navigate(`/table${path}`, { state: { brokerId, userId } });
  };

  return (
    <div className="table-layout">
      <div className="table-sidebar">
        <button
          className={getActiveClass('')}
          onClick={() => handleNavigation('', tableData[0]?.brokerId)}
        >
          Broker Table
        </button>
        <button
          className={getActiveClass('/publish')}
          onClick={() => handleNavigation('/publish', tableData[0]?.brokerId)}
        >
          Publish/Subscribe
        </button>
        <button
          className={getActiveClass('/firmware')}
          onClick={() => handleNavigation('/firmware', tableData[0]?.brokerId)}
        >
          Firmware
        </button>
        <button className="dashboard-button" onClick={handleAddClick}>
          Add Broker
        </button>
      </div>
      <div className="table-main">
        {location.pathname === '/table' ? (
          <div className="unique-table-scrollable">
            <table className="unique-table">
              <thead>
                <tr>
                  <th>Broker IP</th>
                  <th>Port</th>
                  <th>User</th>
                  <th>Password</th>
                  <th>Company Name</th>
                  <th>Topic Name</th>
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
                    <td>{row.topic}</td>
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
                            {row.connectionStatus === 'connected'
                              ? 'Connected'
                              : `Disconnected${row.connectionErrors.length > 0 ? ` (${row.connectionErrors.join(', ')})` : ''}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="edit-button" onClick={() => handleEditClick(row)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="delete-button" onClick={() => handleDeleteClick(row.brokerId)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                    <td>
                      <AdminUserAssign
                        brokerId={row.brokerId}
                        assignedUserId={row.assignedUserId}
                        assignedUserEmail={row.assignedUserEmail}
                        users={users}
                        handleAssignUser={handleAssignUser}
                        onConfirmationStateChange={handleConfirmationStateChange}
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
        ) : (
          <Outlet context={{ brokerId: tableData[0]?.brokerId, userId: localStorage.getItem('userId'), setTableData }} />
        )}
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

      <LogoutModal
        isOpen={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
};

export default RightSideTable;